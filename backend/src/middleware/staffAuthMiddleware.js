const jwt   = require('jsonwebtoken');
const Staff = require('../models/Staff');

exports.protectStaff = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (!decoded.isStaff)
      return res.status(401).json({ message: 'Not a staff token' });
    req.staff = await Staff.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};

// Role guard middleware factory
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.staff?.role))
    return res.status(403).json({ message: 'Access denied for this role' });
  next();
};