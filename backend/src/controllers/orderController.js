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

// Get all orders for a restaurant (with optional status filter)
const getOrders = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    await verifyOwnership(restaurantId, req.owner._id);
    const filter = { restaurant: restaurantId };
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { next(err); }
};

// Update order status
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await verifyOwnership(order.restaurant, req.owner._id);
    const { status } = req.body;
    const valid = ['new', 'preparing', 'ready', 'served'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    order.status = status;
    await order.save();

    // Emit real-time update to restaurant room
    try {
      const io = getIO();
      io.to(order.restaurant.toString()).emit('order_updated', order);
    } catch (e) { console.error('Socket emit error:', e.message); }

    res.json(order);
  } catch (err) { next(err); }
};

module.exports = { getOrders, updateOrderStatus };