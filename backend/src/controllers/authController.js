const bcrypt        = require('bcryptjs');
const { validationResult } = require('express-validator');
const Owner         = require('../models/Owner');
const Restaurant    = require('../models/Restaurant');
const generateToken = require('../utils/generateToken');

const formatResponse = (owner, restaurants) => ({
  _id:                owner._id,
  ownerName:          owner.ownerName,
  email:              owner.email,
  region:             owner.region,
  subscriptionActive: owner.subscriptionActive,
  trialEnds:          owner.trialEnds,
  avatar:             owner.avatar || '',
  authMethod:         owner.authMethod,
  restaurants,
  token: generateToken(owner._id)
});

// ── EMAIL / PASSWORD ─────────────────────────────────────

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { ownerName, email, password, restaurantName, region } = req.body;
  try {
    const exists = await Owner.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hash  = await bcrypt.hash(password, 10);
    const owner = await Owner.create({ ownerName, email, password: hash, region, authMethod: 'email' });
    const restaurant = await Restaurant.create({ name: restaurantName, owner: owner._id });
    res.status(201).json(formatResponse(owner, [restaurant]));
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const owner = await Owner.findOne({ email });
    if (!owner) return res.status(400).json({ message: 'Invalid email or password' });
    if (owner.authMethod === 'google')
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });
    const match = await bcrypt.compare(password, owner.password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });
    const restaurants = await Restaurant.find({ owner: owner._id });
    res.json(formatResponse(owner, restaurants));
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.owner._id });
    res.json(formatResponse(req.owner, restaurants));
  } catch (err) { next(err); }
};

// ── GOOGLE OAUTH ─────────────────────────────────────────

// Called after Google redirects back — sends token to frontend
const googleCallback = async (req, res) => {
  try {
    const owner       = req.user;
    const restaurants = await Restaurant.find({ owner: owner._id });

    // If new Google user with no restaurants, create one
    if (restaurants.length === 0) {
      const restaurant = await Restaurant.create({
        name:  `${owner.ownerName}'s Restaurant`,
        owner: owner._id
      });
      restaurants.push(restaurant);
    }

    const response  = formatResponse(owner, restaurants);
    const encoded   = encodeURIComponent(JSON.stringify(response));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?data=${encoded}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed`);
  }
};

// Connect Google to an existing email/password account
const connectGoogle = async (req, res, next) => {
  const { googleId, avatar } = req.body;
  try {
    const owner = await Owner.findById(req.owner._id);
    if (!owner) return res.status(404).json({ message: 'Account not found' });
    if (owner.googleId) return res.status(400).json({ message: 'Google account already connected' });
    owner.googleId   = googleId;
    owner.avatar     = avatar || owner.avatar;
    owner.authMethod = 'both';
    await owner.save();
    const restaurants = await Restaurant.find({ owner: owner._id });
    res.json(formatResponse(owner, restaurants));
  } catch (err) { next(err); }
};

// Disconnect Google from account (only if they also have a password)
const disconnectGoogle = async (req, res, next) => {
  try {
    const owner = await Owner.findById(req.owner._id);
    if (!owner) return res.status(404).json({ message: 'Account not found' });
    if (owner.authMethod === 'google')
      return res.status(400).json({ message: 'Cannot disconnect Google — no password set. Set a password first.' });
    owner.googleId   = null;
    owner.authMethod = 'email';
    await owner.save();
    res.json({ message: 'Google account disconnected' });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, googleCallback, connectGoogle, disconnectGoogle };