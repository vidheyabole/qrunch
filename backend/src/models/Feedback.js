const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  rating:         { type: Number, required: true, min: 1, max: 5 },
  message:        { type: String, required: true },
  senderType:     { type: String, enum: ['customer', 'staff', 'owner'], required: true },
  senderName:     { type: String, default: 'Anonymous' },
  senderRole:     { type: String, default: '' },
  restaurantName: { type: String, default: '' },
  ownerName:      { type: String, default: '' },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);