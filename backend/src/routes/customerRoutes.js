const express = require('express');
const { getRestaurantInfo, getPublicMenu, getRecommendations, placeOrder } = require('../controllers/customerController');

const router = express.Router();

router.get('/info/:restaurantId/:tableId',          getRestaurantInfo);
router.get('/menu/:restaurantId',                   getPublicMenu);        // ?lang=hi
router.get('/recommendations/:restaurantId/:phone', getRecommendations);  // ?lang=hi
router.post('/order',                               placeOrder);

module.exports = router;