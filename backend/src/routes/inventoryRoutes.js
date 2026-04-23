const express = require('express');
const { getInventory, addItem, updateItem, deleteItem } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/:restaurantId', getInventory);
router.post('/',             addItem);
router.put('/:id',           updateItem);
router.delete('/:id',        deleteItem);

module.exports = router;