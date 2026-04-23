const express = require('express');
const { getTables, addTable, updateTable, deleteTable, updateStatus } = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/:restaurantId',        getTables);
router.post('/',                    addTable);
router.put('/:id',                  updateTable);
router.delete('/:id',               deleteTable);
router.patch('/:id/status',         updateStatus);

module.exports = router;