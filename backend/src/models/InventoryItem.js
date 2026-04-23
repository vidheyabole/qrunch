const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  quantity:          { type: Number, required: true, min: 0, default: 0 },
  unit:              { type: String, required: true },
  lowStockThreshold: { type: Number, required: true, default: 5 },
  restaurant:        { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  createdAt:         { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);