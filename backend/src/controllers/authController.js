const bcrypt        = require('bcryptjs');
const { validationResult } = require('express-validator');
const Owner         = require('../models/Owner');
const Restaurant    = require('../models/Restaurant');
const cloudinary    = require('../config/cloudinary');
const generateToken = require('../utils/generateToken');

const formatResponse = (owner, restaurants) => ({
  _id:                owner._id,
  ownerName:          owner.ownerName,
  email:              owner.email,
  region:             owner.region,
  subscriptionActive: owner.subscriptionActive,
  trialEnds:          owner.trialEnds,
  avatar:             owner.avatar || '',
  profilePicture:     owner.profilePicture || '',
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
    const restaurant = await Restaurant.create({
      name:   restaurantName,
      owner:  owner._id,
      region: region
    });
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

// ── UPDATE PROFILE ────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { ownerName, currentPassword, newPassword, restaurantName } = req.body;
    const owner = await Owner.findById(req.owner._id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });

    // Update name
    if (ownerName?.trim()) owner.ownerName = ownerName.trim();

    // Update password
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
      const match = await bcrypt.compare(currentPassword, owner.password);
      if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
      owner.password = await bcrypt.hash(newPassword, 10);
    }

    await owner.save();

    // Update restaurant name if provided
    if (restaurantName?.trim() && req.body.restaurantId) {
      await Restaurant.findOneAndUpdate(
        { _id: req.body.restaurantId, owner: owner._id },
        { name: restaurantName.trim() }
      );
    }

    const restaurants = await Restaurant.find({ owner: owner._id });
    res.json(formatResponse(owner, restaurants));
  } catch (err) { next(err); }
};

// ── UPDATE PROFILE PICTURE ────────────────────────────────
const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });
    const owner = await Owner.findById(req.owner._id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });

    // Delete old profile picture from Cloudinary
    if (owner.profilePicturePublicId) {
      await cloudinary.v2.uploader.destroy(owner.profilePicturePublicId).catch(() => {});
    }

    // Upload new
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { folder: 'qrunch/profiles', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    owner.profilePicture          = result.secure_url;
    owner.profilePicturePublicId  = result.public_id;
    await owner.save();

    const restaurants = await Restaurant.find({ owner: owner._id });
    res.json(formatResponse(owner, restaurants));
  } catch (err) { next(err); }
};

// ── UPDATE RESTAURANT LOGO ────────────────────────────────
const updateRestaurantLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });
    const { restaurantId } = req.body;

    const restaurant = await Restaurant.findOne({ _id: restaurantId, owner: req.owner._id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    if (restaurant.logoPublicId) {
      await cloudinary.v2.uploader.destroy(restaurant.logoPublicId).catch(() => {});
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { folder: 'qrunch/logos', transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }] },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    restaurant.logo          = result.secure_url;
    restaurant.logoPublicId  = result.public_id;
    await restaurant.save();

    const restaurants = await Restaurant.find({ owner: req.owner._id });
    const owner       = await Owner.findById(req.owner._id);
    res.json(formatResponse(owner, restaurants));
  } catch (err) { next(err); }
};

// ── GOOGLE OAUTH ─────────────────────────────────────────

const googleCallback = async (req, res) => {
  try {
    const owner       = req.user;
    const restaurants = await Restaurant.find({ owner: owner._id });
    if (restaurants.length === 0) {
      const restaurant = await Restaurant.create({
        name:   `${owner.ownerName}'s Restaurant`,
        owner:  owner._id,
        region: owner.region || 'india'
      });
      restaurants.push(restaurant);
    }
    const response = formatResponse(owner, restaurants);
    const encoded  = encodeURIComponent(JSON.stringify(response));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?data=${encoded}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed`);
  }
};

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

module.exports = {
  register, login, getMe,
  updateProfile, updateProfilePicture, updateRestaurantLogo,
  googleCallback, connectGoogle, disconnectGoogle
};