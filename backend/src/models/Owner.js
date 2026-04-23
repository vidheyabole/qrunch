const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  ownerName:          { type: String,  required: true },
  email:              { type: String,  required: true, unique: true },
  password:           { type: String,  required: true },
  region:             { type: String,  enum: ['india', 'usa'], required: true },
  subscriptionActive: { type: Boolean, default: true },
  trialEnds:          { type: Date,    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  googleId:           { type: String,  sparse: true, default: null },
  avatar:             { type: String,  default: '' },
  authMethod:         { type: String,  enum: ['email', 'google', 'both'], default: 'email' },
  createdAt:          { type: Date,    default: Date.now }
});

module.exports = mongoose.model('Owner', ownerSchema);