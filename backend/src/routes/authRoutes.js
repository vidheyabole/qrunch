const express  = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const { upload } = require('../middleware/uploadMiddleware');
const {
  register, login, getMe,
  updateProfile, updateProfilePicture, updateRestaurantLogo,
  googleCallback, connectGoogle, disconnectGoogle
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Email / Password ──────────────────────────────────────
router.post('/register', [
  body('ownerName').notEmpty().withMessage('Owner name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('restaurantName').notEmpty().withMessage('Restaurant name is required'),
  body('region').isIn(['india', 'usa']).withMessage('Region must be india or usa')
], register);

router.post('/login', login);
router.get ('/me',    protect, getMe);

// ── Profile ───────────────────────────────────────────────
router.put  ('/profile',          protect,                          updateProfile);
router.post ('/profile/picture',  protect, upload.single('image'),  updateProfilePicture);
router.post ('/restaurant/logo',  protect, upload.single('image'),  updateRestaurantLogo);

// ── Google OAuth ──────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed', session: false }),
  googleCallback
);

// ── Connect / Disconnect Google ───────────────────────────
router.post('/connect-google',    protect, connectGoogle);
router.post('/disconnect-google', protect, disconnectGoogle);

module.exports = router;