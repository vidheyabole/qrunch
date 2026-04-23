const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  tableName:   { type: String, default: '' },
  seats:       { type: Number, required: true, min: 1 },
  status:      { type: String, enum: ['empty', 'occupied', 'order_pending', 'bill_requested'], default: 'empty' },
  restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  createdAt:   { type: Date, default: Date.now }
});

// Each table number must be unique per restaurant
tableSchema.index({ tableNumber: 1, restaurant: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);