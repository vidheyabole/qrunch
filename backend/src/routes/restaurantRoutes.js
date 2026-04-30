const express = require('express');
const { addRestaurant } = require('../controllers/restaurantController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Temporary — remove after running once
router.get('/fix-region', async (req, res) => {
  const Restaurant = require('../models/Restaurant');
  const Owner      = require('../models/Owner');
  const restaurants = await Restaurant.find({});
  for (const r of restaurants) {
    const owner = await Owner.findById(r.owner);
    if (owner?.region) {
      r.region = owner.region;
      await r.save();
    }
  }
  res.json({ message: `Fixed ${restaurants.length} restaurants` });
});

router.post('/', protect, addRestaurant);

module.exports = router;