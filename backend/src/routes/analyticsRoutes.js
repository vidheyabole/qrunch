const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/:restaurantId', protect, getAnalytics);

module.exports = router;