const Restaurant = require('../models/Restaurant');

const addRestaurant = async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ message: 'Restaurant name is required' });
  try {
    const restaurant = await Restaurant.create({
      name:   name.trim(),
      owner:  req.owner._id,
      region: req.owner.region || 'india'
    });
    res.status(201).json(restaurant);
  } catch (err) { next(err); }
};

// GET /api/restaurants/:restaurantId/settings  — owner only
const getSettings = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    if (restaurant.owner.toString() !== req.owner._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    res.json({
      gst:            restaurant.gst,
      paymentMethods: restaurant.paymentMethods
    });
  } catch (err) { next(err); }
};

// PUT /api/restaurants/:restaurantId/settings  — owner only
const updateSettings = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    if (restaurant.owner.toString() !== req.owner._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const { gst, paymentMethods } = req.body;

    if (gst !== undefined) {
      restaurant.gst.enabled   = gst.enabled   ?? restaurant.gst.enabled;
      restaurant.gst.rate      = gst.rate       ?? restaurant.gst.rate;
      restaurant.gst.gstin     = gst.gstin      ?? restaurant.gst.gstin;
      restaurant.gst.inclusive = gst.inclusive  ?? restaurant.gst.inclusive;
    }

    if (paymentMethods !== undefined) {
      restaurant.paymentMethods.cash  = paymentMethods.cash  ?? restaurant.paymentMethods.cash;
      restaurant.paymentMethods.upi   = paymentMethods.upi   ?? restaurant.paymentMethods.upi;
      restaurant.paymentMethods.card  = paymentMethods.card  ?? restaurant.paymentMethods.card;
      restaurant.paymentMethods.other = paymentMethods.other ?? restaurant.paymentMethods.other;
    }

    await restaurant.save();
    res.json({ gst: restaurant.gst, paymentMethods: restaurant.paymentMethods });
  } catch (err) { next(err); }
};

// GET /api/restaurants/:restaurantId/public  — no auth — for customer pages
const getPublicSettings = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId)
      .select('name gst paymentMethods region logo');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) { next(err); }
};

module.exports = { addRestaurant, getSettings, updateSettings, getPublicSettings };