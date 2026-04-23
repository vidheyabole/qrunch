const mongoose = require('mongoose');

const generatedImageSchema = new mongoose.Schema({
  dishName:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  imageUrl:   { type: String, required: true },
  publicId:   { type: String, required: true },
  usageCount: { type: Number, default: 1 },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('GeneratedImage', generatedImageSchema);