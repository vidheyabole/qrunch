const express = require('express');
const { getInventory, addItem, updateItem, deleteItem } = require('../controllers/inventoryController');
const { protect }      = require('../middleware/authMiddleware');
const { protectStaff } = require('../middleware/staffAuthMiddleware');

const router = express.Router();

// Accepts owner OR any staff token (manager + chef + waiter)
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

router.get   ('/:restaurantId', protectAny, getInventory);
router.post  ('/',              protectAny, addItem);
router.put   ('/:id',          protectAny, updateItem);
router.delete('/:id',          protectAny, deleteItem);

module.exports = router;