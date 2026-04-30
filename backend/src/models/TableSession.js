const mongoose = require('mongoose');

const tablSessionSchema = new mongoose.Schema({
  restaurant:    { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  table:         { type: mongoose.Schema.Types.ObjectId, ref: 'Table',      required: true },
  tableNumber:   { type: Number, required: true },
  orders:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  status:        { type: String, enum: ['open', 'bill_requested', 'closed'], default: 'open' },
  customerCount: { type: Number, default: 1 },
  totalAmount:   { type: Number, default: 0 },
  splitMethod:   { type: String, enum: ['none', 'equal', 'custom', 'by_order'], default: 'none' },
  splits: [{
    label:  { type: String },
    amount: { type: Number },
    paid:   { type: Boolean, default: false }
  }],
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

module.exports = mongoose.model('TableSession', tablSessionSchema);