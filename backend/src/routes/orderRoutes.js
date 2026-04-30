const express = require('express');
const { getOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect }      = require('../middleware/authMiddleware');
const { protectStaff } = require('../middleware/staffAuthMiddleware');

const router = express.Router();

// Owner routes
router.get('/:restaurantId',    protect,      getOrders);
router.patch('/:id/status',     protect,      updateOrderStatus);

// Staff routes — same controllers, staff token
router.get('/staff/:restaurantId',   protectStaff, getOrders);
router.patch('/staff/:id/status',    protectStaff, updateOrderStatus);

module.exports = router;