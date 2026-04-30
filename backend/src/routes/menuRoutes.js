const express = require('express');
const { protect }      = require('../middleware/authMiddleware');
const { protectStaff } = require('../middleware/staffAuthMiddleware');
const { upload }       = require('../middleware/uploadMiddleware');
const {
  addCategory, getCategories, updateCategory, deleteCategory,
  getItems, addItem, updateItem, deleteItem, toggleAvailability
} = require('../controllers/menuController');

const router = express.Router();

// Accepts owner or staff (manager) token
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

router.post  ('/categories',              protectAny, addCategory);
router.get   ('/categories/:restaurantId', protectAny, getCategories);
router.put   ('/categories/:id',           protectAny, updateCategory);
router.delete('/categories/:id',           protectAny, deleteCategory);

router.get   ('/items/:categoryId',        protectAny, getItems);
router.post  ('/items',                    protectAny, upload.single('image'), addItem);
router.put   ('/items/:id',                protectAny, upload.single('image'), updateItem);
router.delete('/items/:id',                protectAny, deleteItem);
router.patch ('/items/:id/toggle',         protectAny, toggleAvailability);

module.exports = router;