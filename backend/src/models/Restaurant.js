const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);