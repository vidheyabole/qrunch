const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/customerController');

// Public routes — no auth required
router.get ('/:restaurantId/:tableId/menu',          ctrl.getPublicMenu);
router.post('/:restaurantId/:tableId/orders',        ctrl.placeOrder);
router.get ('/:restaurantId/:tableId/orders/:orderId', ctrl.getOrderStatus);
router.get ('/:restaurantId/recommendations',        ctrl.getRecommendations);

module.exports = router;