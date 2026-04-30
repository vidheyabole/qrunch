const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  region:    { type: String, enum: ['india', 'usa'], default: 'india' },
  createdAt: { type: Date, default: Date.now },
  logo:           { type: String, default: '' },
  logoPublicId:   { type: String, default: '' },
});

module.exports = mongoose.model('Restaurant', restaurantSchema);