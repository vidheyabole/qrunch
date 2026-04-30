const express = require('express');
const router  = express.Router();
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

// Public — customers and staff can submit without auth
router.post('/', submitFeedback);

// Owner only — view all feedback
router.get('/',  protect, getFeedback);

module.exports = router;