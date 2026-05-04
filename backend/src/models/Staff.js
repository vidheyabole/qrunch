const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  loginId:     { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['manager', 'chef', 'waiter'], required: true },
  restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  language:    { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
  isActive:    { type: Boolean, default: true },
  joinedAt:    { type: Date, default: Date.now },
  leftAt:      { type: Date, default: null },
  leaveReason: { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

staffSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Staff', staffSchema);