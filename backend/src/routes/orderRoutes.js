const express = require('express');
const { getOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/:restaurantId',    getOrders);
router.patch('/:id/status',     updateOrderStatus);

module.exports = router;