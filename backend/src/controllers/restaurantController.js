const Restaurant = require('../models/Restaurant');

const addRestaurant = async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ message: 'Restaurant name is required' });
  try {
    const restaurant = await Restaurant.create({ name: name.trim(), owner: req.owner._id });
    res.status(201).json(restaurant);
  } catch (err) {
    next(err);
  }
};

module.exports = { addRestaurant };