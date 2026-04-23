const express = require('express');
const { addRestaurant } = require('../controllers/restaurantController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, addRestaurant);

module.exports = router;