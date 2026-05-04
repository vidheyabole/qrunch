const TableSession = require('../models/TableSession');
const Order        = require('../models/Order');
const Table        = require('../models/Table');
const { getIO }    = require('../config/socket');

exports.getActiveSession = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    const session = await TableSession.findOne({
      restaurant: restaurantId,
      table:      tableId,
      status:     { $in: ['open', 'bill_requested'] }
    }).populate('orders');
    res.json(session || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSessions = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sessions = await TableSession.find({
      restaurant: restaurantId,
      openedAt:   { $gte: start }
    }).populate('orders').sort({ openedAt: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.openSession = async (req, res) => {
  try {
    const { restaurantId, tableId, tableNumber, orderId } = req.body;

    let session = await TableSession.findOne({
      restaurant: restaurantId,
      table:      tableId,
      status:     { $in: ['open', 'bill_requested'] }
    });

    if (session) {
      if (orderId && !session.orders.includes(orderId)) {
        session.orders.push(orderId);
        session.totalAmount += req.body.orderAmount || 0;
        await session.save();
      }
      return res.json(session);
    }

    session = await TableSession.create({
      restaurant:  restaurantId,
      table:       tableId,
      tableNumber: tableNumber || 1,
      orders:      orderId ? [orderId] : [],
      totalAmount: req.body.orderAmount || 0,
      status:      'open'
    });

    await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
    try { getIO().to(restaurantId).emit('session_opened', session); } catch (_) {}
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Updated: accepts paymentMethod from customer ──────────
exports.requestBill = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    const { paymentMethod } = req.body; // 'cash' | 'upi' | 'card' | 'other' | ''

    const session = await TableSession.findOne({
      restaurant: restaurantId,
      table:      tableId,
      status:     'open'
    });

    if (!session) return res.status(404).json({ message: 'No active session found' });

    session.status = 'bill_requested';
    if (paymentMethod) session.paymentMethod = paymentMethod;
    await session.save();

    await Table.findByIdAndUpdate(tableId, { status: 'bill_requested' });

    try {
      getIO().to(restaurantId).emit('bill_requested', {
        session,
        tableNumber:   session.tableNumber,
        paymentMethod: session.paymentMethod
      });
    } catch (_) {}

    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.setSplit = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { splitMethod, customerCount, splits } = req.body;

    const session = await TableSession.findById(sessionId).populate('orders');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.splitMethod   = splitMethod;
    session.customerCount = customerCount || session.customerCount;

    if (splitMethod === 'equal') {
      const count     = customerCount || 1;
      const perPerson = session.totalAmount / count;
      session.splits  = Array.from({ length: count }, (_, i) => ({
        label:  `Person ${i + 1}`,
        amount: parseFloat(perPerson.toFixed(2)),
        paid:   false
      }));
    } else if (splitMethod === 'custom' && splits) {
      session.splits = splits;
    } else if (splitMethod === 'by_order') {
      session.splits = session.orders.map((order, i) => ({
        label:  `Order ${i + 1} (${order.customerName || `Table ${session.tableNumber}`})`,
        amount: order.totalAmount,
        paid:   false
      }));
    }

    await session.save();
    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.markSplitPaid = async (req, res) => {
  try {
    const { sessionId, splitIndex } = req.params;
    const session = await TableSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.splits[splitIndex]) {
      session.splits[splitIndex].paid = true;
      await session.save();
    }
    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await TableSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status   = 'closed';
    session.closedAt = new Date();
    await session.save();

    await Table.findByIdAndUpdate(session.table, { status: 'empty' });
    try { getIO().to(session.restaurant.toString()).emit('session_closed', session); } catch (_) {}
    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};