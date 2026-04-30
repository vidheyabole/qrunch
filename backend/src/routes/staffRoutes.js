const express  = require('express');
const router   = express.Router();
const { protect }                    = require('../middleware/authMiddleware');
const { protectStaff, requireRole }  = require('../middleware/staffAuthMiddleware');
const authCtrl  = require('../controllers/staffAuthController');
const staffCtrl = require('../controllers/staffController');

// ── Staff auth ───────────────────────────────────────────────
router.post('/auth/login', authCtrl.staffLogin);
router.get ('/auth/me',    protectStaff, authCtrl.getStaffMe);

// ── Staff updates their own language ────────────────────────
router.put('/me/language', protectStaff, staffCtrl.updateOwnLanguage);

// ── Owner manages staff ──────────────────────────────────────
router.get   ('/',    protect, staffCtrl.getStaff);
router.post  ('/',    protect, staffCtrl.createStaff);
router.put   ('/:id', protect, staffCtrl.updateStaff);
router.delete('/:id', protect, staffCtrl.deleteStaff);

// ── Manager manages staff ────────────────────────────────────
router.get   ('/manage/list', protectStaff, requireRole('manager'), staffCtrl.getStaffAsManager);
router.post  ('/manage',      protectStaff, requireRole('manager'), staffCtrl.createStaffAsManager);
router.put   ('/manage/:id',  protectStaff, requireRole('manager'), staffCtrl.updateStaffAsManager);
router.delete('/manage/:id',  protectStaff, requireRole('manager'), staffCtrl.deleteStaffAsManager);

module.exports = router;