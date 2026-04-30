const Staff = require('../models/Staff');

// Helper — generate a unique loginId
const generateLoginId = async (name, restaurantId) => {
  // Convert name to lowercase, replace spaces with dots
  // e.g. "Rahul Sharma" → "rahul.sharma"
  const base = name.trim().toLowerCase().replace(/\s+/g, '.');

  // Check if this loginId already exists — if so, add a number suffix
  const existing = await Staff.findOne({ loginId: base });
  if (!existing) return base;

  // If taken, try rahul.sharma2, rahul.sharma3, etc.
  let count = 2;
  while (true) {
    const candidate = `${base}${count}`;
    const taken     = await Staff.findOne({ loginId: candidate });
    if (!taken) return candidate;
    count++;
  }
};

// ── Owner routes ─────────────────────────────────────────────

exports.getStaff = async (req, res) => {
  try {
    const { restaurant } = req.query;
    const staff = await Staff.find({ restaurant, owner: req.owner._id })
      .select('-password').sort('-createdAt');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, role, language, restaurant, password } = req.body;
    if (!name || !role || !restaurant || !password)
      return res.status(400).json({ message: 'Name, role, restaurant and password are required' });

    const loginId = await generateLoginId(name, restaurant);
    const staff   = await Staff.create({
      name, loginId, password, role,
      language:   language || 'en',
      restaurant,
      owner: req.owner._id
    });

    res.status(201).json({
      _id: staff._id, name: staff.name, loginId: staff.loginId,
      role: staff.role, language: staff.language, isActive: staff.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, owner: req.owner._id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const { name, language, isActive, password } = req.body;
    if (name     !== undefined) staff.name     = name;
    if (language !== undefined) staff.language = language;
    if (isActive !== undefined) staff.isActive = isActive;
    if (password)               staff.password = password;

    await staff.save();
    res.json({ _id: staff._id, name: staff.name, loginId: staff.loginId, role: staff.role, language: staff.language, isActive: staff.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    await Staff.findOneAndDelete({ _id: req.params.id, owner: req.owner._id });
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Manager routes (uses staff token, scoped to same restaurant) ──

exports.getStaffAsManager = async (req, res) => {
  try {
    const restaurantId = req.staff.restaurant;
    const staff = await Staff.find({ restaurant: restaurantId })
      .select('-password').sort('-createdAt');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStaffAsManager = async (req, res) => {
  try {
    const restaurantId = req.staff.restaurant;
    const { name, role, language, password } = req.body;
    if (!name || !role || !password)
      return res.status(400).json({ message: 'Name, role and password are required' });

    // Managers cannot create other managers
    if (role === 'manager')
      return res.status(403).json({ message: 'Managers cannot create other managers' });

    // Get the owner from any existing staff in this restaurant
    const existing = await Staff.findOne({ restaurant: restaurantId });
    if (!existing) return res.status(400).json({ message: 'Restaurant not found' });

    const loginId = await generateLoginId(name, restaurantId);
    const staff   = await Staff.create({
      name, loginId, password, role,
      language:   language || 'en',
      restaurant: restaurantId,
      owner:      existing.owner
    });

    res.status(201).json({
      _id: staff._id, name: staff.name, loginId: staff.loginId,
      role: staff.role, language: staff.language, isActive: staff.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStaffAsManager = async (req, res) => {
  try {
    const restaurantId = req.staff.restaurant;
    const staff = await Staff.findOne({ _id: req.params.id, restaurant: restaurantId });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    // Managers cannot edit other managers
    if (staff.role === 'manager' && staff._id.toString() !== req.staff._id.toString())
      return res.status(403).json({ message: 'Managers cannot edit other managers' });

    const { name, language, isActive, password } = req.body;
    if (name     !== undefined) staff.name     = name;
    if (language !== undefined) staff.language = language;
    if (isActive !== undefined) staff.isActive = isActive;
    if (password)               staff.password = password;

    await staff.save();
    res.json({ _id: staff._id, name: staff.name, loginId: staff.loginId, role: staff.role, language: staff.language, isActive: staff.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStaffAsManager = async (req, res) => {
  try {
    const restaurantId = req.staff.restaurant;
    const staff = await Staff.findOne({ _id: req.params.id, restaurant: restaurantId });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    // Managers cannot delete other managers
    if (staff.role === 'manager')
      return res.status(403).json({ message: 'Managers cannot delete other managers' });

    await staff.deleteOne();
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/staff/me/language — staff updates their own language
exports.updateOwnLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'hi', 'mr'].includes(language))
      return res.status(400).json({ message: 'Invalid language' });

    await Staff.findByIdAndUpdate(req.staff._id, { language });
    res.json({ message: 'Language updated', language });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};