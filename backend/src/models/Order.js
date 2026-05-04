const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  restaurant:      { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  table:           { type: mongoose.Schema.Types.ObjectId, ref: 'Table',      required: true },
  tableNumber:     { type: Number, required: true },
  customerName:    { type: String,  default: '' },
  customerPhone:   { type: String,  default: '' },
  items: [{
    menuItemId:           { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name:                 { type: String,  required: true },
    price:                { type: Number,  required: true },
    quantity:             { type: Number,  required: true, min: 1 },
    selectedModifiers:    [{ groupName: String, optionLabel: String, extraPrice: Number }],
    specialInstructions:  { type: String,  default: '' }
  }],
  status: { type: String, enum: ['new', 'preparing', 'ready', 'completed'], default: 'new' },
  totalAmount:   { type: Number, required: true },
  createdAt:     { type: Date,   default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);