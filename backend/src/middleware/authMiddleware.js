const jwt = require('jsonwebtoken');
const Owner = require('../models/Owner');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const owner = await Owner.findById(decoded.id).select('-password');
    if (!owner) return res.status(401).json({ message: 'Account not found' });
    if (!owner.subscriptionActive)
      return res.status(403).json({ message: 'Your subscription is inactive. Please contact support.' });
    req.owner = owner;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };