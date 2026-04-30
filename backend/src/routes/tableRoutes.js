const express = require('express');
const { getTables, addTable, updateTable, deleteTable, updateStatus } = require('../controllers/tableController');
const { protect }      = require('../middleware/authMiddleware');
const { protectStaff } = require('../middleware/staffAuthMiddleware');

const router = express.Router();

// Middleware that accepts either owner or staff token
const protectAny = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });

  const token = auth.split(' ')[1];
  const jwt   = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isStaff) return protectStaff(req, res, next);
    return protect(req, res, next);
  } catch {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

router.get   ('/:restaurantId', protectAny, getTables);
router.post  ('/',              protect,    addTable);
router.put   ('/:id',          protect,    updateTable);
router.delete('/:id',          protect,    deleteTable);
router.patch ('/:id/status',   protectAny, updateStatus);

module.exports = router;