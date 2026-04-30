const TableSession = require('../models/TableSession');
const Order        = require('../models/Order');
const Table        = require('../models/Table');
const { getIO }    = require('../config/socket');

// Get active session for a table (or null)
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

// Get all sessions for a restaurant (today)
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

// Open a session (called when first order is placed)
exports.openSession = async (req, res) => {
  try {
    const { restaurantId, tableId, tableNumber, orderId } = req.body;

    // Check if session already open
    let session = await TableSession.findOne({
      restaurant: restaurantId,
      table:      tableId,
      status:     { $in: ['open', 'bill_requested'] }
    });

    if (session) {
      // Add order to existing session
      if (orderId && !session.orders.includes(orderId)) {
        session.orders.push(orderId);
        session.totalAmount += req.body.orderAmount || 0;
        await session.save();
      }
      return res.json(session);
    }

    // Create new session
    session = await TableSession.create({
      restaurant:  restaurantId,
      table:       tableId,
      tableNumber: tableNumber || 1,
      orders:      orderId ? [orderId] : [],
      totalAmount: req.body.orderAmount || 0,
      status:      'open'
    });

    // Update table status to occupied
    await Table.findByIdAndUpdate(tableId, { status: 'occupied' });

    // Notify staff
    try { getIO().to(restaurantId).emit('session_opened', session); } catch (_) {}

    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Request bill (called from customer page)
exports.requestBill = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    const session = await TableSession.findOne({
      restaurant: restaurantId,
      table:      tableId,
      status:     'open'
    });

    if (!session) return res.status(404).json({ message: 'No active session found' });

    session.status = 'bill_requested';
    await session.save();

    // Update table status
    await Table.findByIdAndUpdate(tableId, { status: 'bill_requested' });

    // Notify staff in real time
    try { getIO().to(restaurantId).emit('bill_requested', { session, tableNumber: session.tableNumber }); } catch (_) {}

    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Set split method
exports.setSplit = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { splitMethod, customerCount, splits } = req.body;

    const session = await TableSession.findById(sessionId).populate('orders');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.splitMethod   = splitMethod;
    session.customerCount = customerCount || session.customerCount;

    if (splitMethod === 'equal') {
      const count      = customerCount || 1;
      const perPerson  = session.totalAmount / count;
      session.splits   = Array.from({ length: count }, (_, i) => ({
        label:  `Person ${i + 1}`,
        amount: parseFloat(perPerson.toFixed(2)),
        paid:   false
      }));
    } else if (splitMethod === 'custom' && splits) {
      session.splits = splits;
    } else if (splitMethod === 'by_order') {
      // One split per order
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

// Mark a split as paid
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

// Close session
exports.closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await TableSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status   = 'closed';
    session.closedAt = new Date();
    await session.save();

    // Reset table status to empty
    await Table.findByIdAndUpdate(session.table, { status: 'empty' });

    // Notify staff
    try { getIO().to(session.restaurant.toString()).emit('session_closed', session); } catch (_) {}

    res.json(session);
  } catch (err) { res.status(500).json({ message: err.message }); }
};