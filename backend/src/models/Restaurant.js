const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  owner:        { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  region:       { type: String, enum: ['india', 'usa'], default: 'india' },
  createdAt:    { type: Date, default: Date.now },
  logo:         { type: String, default: '' },
  logoPublicId: { type: String, default: '' },

  // ── GST Settings ─────────────────────────────────────────
  gst: {
    enabled:   { type: Boolean, default: false },
    rate:      { type: Number,  default: 0, min: 0, max: 28 }, // percentage e.g. 5 or 18
    gstin:     { type: String,  default: '' },   // optional — printed on bill if provided
    inclusive: { type: Boolean, default: false } // false = exclusive (added on top)
  },

  // ── Payment Methods ───────────────────────────────────────
  // Owner configures which methods they accept
  // Actual processing handled later via Razorpay
  paymentMethods: {
    cash:   { type: Boolean, default: true  },
    upi:    { type: Boolean, default: true  },
    card:   { type: Boolean, default: false },
    other:  { type: Boolean, default: false },
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);