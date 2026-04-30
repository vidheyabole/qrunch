const jwt   = require('jsonwebtoken');
const Staff = require('../models/Staff');

const generateToken = (id, role, restaurantId) =>
  jwt.sign({ id, role, restaurantId, isStaff: true }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/staff/auth/login
exports.staffLogin = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password)
      return res.status(400).json({ message: 'Login ID and password are required' });

    const staff = await Staff.findOne({ loginId, isActive: true }).populate('restaurant');
    if (!staff || !(await staff.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid login ID or password' });

    res.json({
      token:      generateToken(staff._id, staff.role, staff.restaurant._id),
      staff: {
        _id:        staff._id,
        name:       staff.name,
        loginId:    staff.loginId,
        role:       staff.role,
        language:   staff.language,
        restaurant: staff.restaurant
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/staff/auth/me
exports.getStaffMe = async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff._id).populate('restaurant');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({
      _id:        staff._id,
      name:       staff.name,
      loginId:    staff.loginId,
      role:       staff.role,
      language:   staff.language,
      restaurant: staff.restaurant
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};