const express = require('express');
const { getAllOwners, toggleSubscription } = require('../controllers/superAdminController');
const { superAdminProtect } = require('../middleware/superAdminMiddleware');

const router = express.Router();

router.use(superAdminProtect);

router.get('/owners', getAllOwners);
router.patch('/owners/:id/toggle-subscription', toggleSubscription);

module.exports = router;