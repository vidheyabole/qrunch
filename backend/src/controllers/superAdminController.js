const Owner = require('../models/Owner');
const Restaurant = require('../models/Restaurant');

const getAllOwners = async (req, res, next) => {
  try {
    const owners = await Owner.find().select('-password').sort({ createdAt: -1 });
    const result = await Promise.all(owners.map(async (owner) => {
      const restaurants = await Restaurant.find({ owner: owner._id });
      return { ...owner.toObject(), restaurants };
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const toggleSubscription = async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });
    owner.subscriptionActive = !owner.subscriptionActive;
    await owner.save();
    res.json({
      message: `Subscription ${owner.subscriptionActive ? 'activated' : 'deactivated'} for ${owner.ownerName}`,
      subscriptionActive: owner.subscriptionActive
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllOwners, toggleSubscription };