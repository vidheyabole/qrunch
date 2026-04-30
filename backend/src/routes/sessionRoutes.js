const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/sessionController');
const { protect }      = require('../middleware/authMiddleware');
const { protectStaff } = require('../middleware/staffAuthMiddleware');

// Middleware that accepts owner or staff token
const protectAny = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.isStaff) return protectStaff(req, res, next);
    return protect(req, res, next);
  } catch {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

// Public — called from customer page (no auth)
router.get ('/active/:restaurantId/:tableId', ctrl.getActiveSession);
router.post('/open',                          ctrl.openSession);
router.post('/request-bill/:restaurantId/:tableId', ctrl.requestBill);

// Staff or owner
router.get  ('/:restaurantId',           protectAny, ctrl.getSessions);
router.put  ('/:sessionId/split',        protectAny, ctrl.setSplit);
router.patch('/:sessionId/split/:splitIndex/paid', protectAny, ctrl.markSplitPaid);
router.post ('/:sessionId/close',        protectAny, ctrl.closeSession);

module.exports = router;