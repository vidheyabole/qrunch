const express = require('express');
const { addRestaurant, getSettings, updateSettings, getPublicSettings } = require('../controllers/restaurantController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Public (no auth) ──────────────────────────────────────
router.get('/:restaurantId/public', getPublicSettings);

// ── Owner routes ──────────────────────────────────────────
router.post('/', protect, addRestaurant);
router.get ('/:restaurantId/settings', protect, getSettings);
router.put ('/:restaurantId/settings', protect, updateSettings);

module.exports = router;