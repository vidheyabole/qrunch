const Order      = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { getIO }  = require('../config/socket');

const verifyOwnership = async (restaurantId, ownerId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) { const e = new Error('Restaurant not found'); e.status = 404; throw e; }
  if (restaurant.owner.toString() !== ownerId.toString()) {
    const e = new Error('Not authorized'); e.status = 403; throw e;
  }
  return restaurant;
};

const getOrders = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    if (req.owner) {
      await verifyOwnership(restaurantId, req.owner._id);
    } else if (req.staff) {
      if (req.staff.restaurant.toString() !== restaurantId)
        return res.status(403).json({ message: 'Not authorized' });
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const filter = { restaurant: restaurantId };
    if (req.query.status) {
      const statuses = req.query.status.split(',');
      filter.status  = { $in: statuses };
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.owner) {
      await verifyOwnership(order.restaurant, req.owner._id);
    } else if (req.staff) {
      if (req.staff.restaurant.toString() !== order.restaurant.toString())
        return res.status(403).json({ message: 'Not authorized' });
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const { status } = req.body;
    const valid = ['new', 'preparing', 'ready', 'completed'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    order.status = status;
    await order.save();
    try { getIO().to(order.restaurant.toString()).emit('order_updated', order); } catch (e) {}
    res.json(order);
  } catch (err) { next(err); }
};

// ── GET /api/orders/:restaurantId/receipts ────────────────
// All-time order history with date filter, search, pagination
const getPastOrders = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    if (req.owner) {
      await verifyOwnership(restaurantId, req.owner._id);
    } else if (req.staff) {
      if (req.staff.restaurant.toString() !== restaurantId)
        return res.status(403).json({ message: 'Not authorized' });
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const {
      from, to,
      status,
      table,
      search,
      paymentMethod,
      page  = 1,
      limit = 20
    } = req.query;

    const filter = { restaurant: restaurantId };

    // Date range
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Table filter
    if (table) {
      filter.tableNumber = parseInt(table);
    }

    // Customer name / phone search
    if (search?.trim()) {
      filter.$or = [
        { customerName:  { $regex: search.trim(), $options: 'i' } },
        { customerPhone: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Summary stats for the filtered results
    const allFiltered = await Order.find(filter);
    const totalRevenue = allFiltered.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalItems   = allFiltered.reduce((s, o) => s + o.items.reduce((is, i) => is + (i.quantity || 1), 0), 0);

    res.json({
      orders,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      summary: {
        totalOrders:  total,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalItems
      }
    });
  } catch (err) { next(err); }
};

module.exports = { getOrders, updateOrderStatus, getPastOrders };