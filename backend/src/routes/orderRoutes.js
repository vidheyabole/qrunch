const express = require('express');
const { getOrders, updateOrderStatus, getPastOrders } = require('../controllers/orderController');
const { protect }      = require('../middleware/authMiddleware');
const { protectStaff } = require('../middleware/staffAuthMiddleware');

const router = express.Router();

// Middleware that accepts owner or staff token
const protectAny = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.isStaff) return protectStaff(req, res, next);
    return protect(req, res, next);
  } catch {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

// Owner routes
router.get ('/:restaurantId',          protect,      getOrders);
router.patch('/:id/status',            protect,      updateOrderStatus);
router.get ('/:restaurantId/receipts', protect,      getPastOrders);

// Staff routes
router.get ('/staff/:restaurantId',          protectStaff, getOrders);
router.patch('/staff/:id/status',            protectStaff, updateOrderStatus);
router.get ('/staff/:restaurantId/receipts', protectAny,   getPastOrders);

module.exports = router;