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

// Works for both owner (req.owner) and staff (req.staff)
const getOrders = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    if (req.owner) {
      // Owner — verify ownership
      await verifyOwnership(restaurantId, req.owner._id);
    } else if (req.staff) {
      // Staff — just verify they belong to this restaurant
      if (req.staff.restaurant.toString() !== restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const filter = { restaurant: restaurantId };
    if (req.query.status) {
      // Support comma-separated statuses e.g. ?status=new,preparing
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
      if (req.staff.restaurant.toString() !== order.restaurant.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { status } = req.body;
    const valid = ['new', 'preparing', 'ready', 'served'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    order.status = status;
    await order.save();

    try {
      getIO().to(order.restaurant.toString()).emit('order_updated', order);
    } catch (e) { console.error('Socket emit error:', e.message); }

    res.json(order);
  } catch (err) { next(err); }
};

module.exports = { getOrders, updateOrderStatus };