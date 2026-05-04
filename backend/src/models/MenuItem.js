const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name:          { type: String,  required: true },
  description:   { type: String,  default: '' },
  price:         { type: Number,  required: true },
  imageUrl:      { type: String,  default: '' },
  imagePublicId: { type: String,  default: '' },
  category:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  restaurant:    { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  isAvailable:   { type: Boolean, default: true },
  stock:         { type: Number,  default: null },
  dietaryTags:   [{ type: String }],
  ingredients:   [{ type: String }],
  modifiers: [{
    groupName: { type: String },
    options:   [{ label: { type: String }, extraPrice: { type: Number, default: 0 } }]
  }],
  translations:  { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);