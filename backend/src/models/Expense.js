const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  restaurant:         { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  date:               { type: Date,   required: true },
  amount:             { type: Number, default: 0 },
  description:        { type: String, default: '' },
  category:           { type: String, enum: ['inventory', 'offline'], default: 'inventory' },
  offlineOrdersCount: { type: Number, default: 0 },
  offlineRevenue:     { type: Number, default: 0 },
  createdAt:          { type: Date,   default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);