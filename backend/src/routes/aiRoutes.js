const express = require('express');
const { generateDescription, suggestDietaryTags, getUpsells } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/describe',      protect, generateDescription);
router.post('/suggest-tags',  protect, suggestDietaryTags);
router.post('/upsell',        getUpsells); // public — called from customer page

module.exports = router;