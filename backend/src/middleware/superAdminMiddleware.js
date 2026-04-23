const superAdminProtect = (req, res, next) => {
  const secret = req.headers['x-super-admin-secret'];
  if (!secret || secret !== process.env.SUPER_ADMIN_SECRET)
    return res.status(403).json({ message: 'Access denied' });
  next();
};

module.exports = { superAdminProtect };