const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  addCategory, getCategories, updateCategory, deleteCategory,
  getItems, addItem, updateItem, deleteItem, toggleAvailability
} = require('../controllers/menuController');

const router = express.Router();
router.use(protect);

router.post('/categories',             addCategory);
router.get('/categories/:restaurantId', getCategories);
router.put('/categories/:id',          updateCategory);
router.delete('/categories/:id',       deleteCategory);

router.get('/items/:categoryId',       getItems);
router.post('/items',                  upload.single('image'), addItem);
router.put('/items/:id',               upload.single('image'), updateItem);
router.delete('/items/:id',            deleteItem);
router.patch('/items/:id/toggle',      toggleAvailability);

module.exports = router;