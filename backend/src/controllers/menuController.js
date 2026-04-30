const Category   = require('../models/Category');
const MenuItem   = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const cloudinary = require('../config/cloudinary');

const verifyOwnership = async (restaurantId, ownerId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) { const e = new Error('Restaurant not found'); e.status = 404; throw e; }
  if (restaurant.owner.toString() !== ownerId.toString()) {
    const e = new Error('Not authorized'); e.status = 403; throw e;
  }
  return restaurant;
};

// Helper — verify staff belongs to this restaurant
const verifyStaffRestaurant = (req, restaurantId) => {
  if (req.staff && req.staff.restaurant.toString() !== restaurantId.toString())
    throw Object.assign(new Error('Not authorized'), { status: 403 });
};

// Helper — verify access for either owner or staff
const verifyAccess = async (req, restaurantId) => {
  if (req.owner) await verifyOwnership(restaurantId, req.owner._id);
  else           verifyStaffRestaurant(req, restaurantId);
};

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder, transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });

// ── CATEGORIES ──────────────────────────────────────────

const addCategory = async (req, res, next) => {
  const { restaurantId, name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Category name is required' });
  try {
    await verifyAccess(req, restaurantId);
    const count    = await Category.countDocuments({ restaurant: restaurantId });
    const category = await Category.create({ name: name.trim(), restaurant: restaurantId, order: count });
    res.status(201).json(category);
  } catch (err) { next(err); }
};

const getCategories = async (req, res, next) => {
  try {
    await verifyAccess(req, req.params.restaurantId);
    const categories = await Category.find({ restaurant: req.params.restaurantId }).sort({ order: 1, createdAt: 1 });
    res.json(categories);
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await verifyAccess(req, category.restaurant);
    category.name = req.body.name?.trim() || category.name;
    await category.save();
    res.json(category);
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await verifyAccess(req, category.restaurant);
    const items = await MenuItem.find({ category: category._id });
    await Promise.all(
      items.map(item =>
        item.imagePublicId ? cloudinary.v2.uploader.destroy(item.imagePublicId) : null
      )
    );
    await MenuItem.deleteMany({ category: category._id });
    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ── ITEMS ────────────────────────────────────────────────

const getItems = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await verifyAccess(req, category.restaurant);
    const items = await MenuItem.find({ category: req.params.categoryId }).sort({ createdAt: 1 });
    res.json(items);
  } catch (err) { next(err); }
};

const addItem = async (req, res, next) => {
  try {
    const { categoryId, restaurantId, name, description, price, dietaryTags, modifiers, generatedImageUrl } = req.body;

    if (!name?.trim())  return res.status(400).json({ message: 'Item name is required' });
    if (!categoryId)    return res.status(400).json({ message: 'Category ID is required' });
    if (!restaurantId)  return res.status(400).json({ message: 'Restaurant ID is required' });
    if (!price)         return res.status(400).json({ message: 'Price is required' });

    await verifyAccess(req, restaurantId);

    let imageUrl      = '';
    let imagePublicId = '';

    if (req.file) {
      const result  = await uploadToCloudinary(req.file.buffer, 'qrunch/menu-items');
      imageUrl      = result.secure_url;
      imagePublicId = result.public_id;
    } else if (generatedImageUrl) {
      imageUrl = generatedImageUrl;
    }

    const item = await MenuItem.create({
      name:        name.trim(),
      description: description || '',
      price:       Number(price),
      imageUrl,
      imagePublicId,
      category:    categoryId,
      restaurant:  restaurantId,
      dietaryTags: dietaryTags ? JSON.parse(dietaryTags) : [],
      modifiers:   modifiers   ? JSON.parse(modifiers)   : []
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await verifyAccess(req, item.restaurant);

    const { name, description, price, dietaryTags, modifiers, generatedImageUrl } = req.body;

    if (req.file) {
      if (item.imagePublicId) await cloudinary.v2.uploader.destroy(item.imagePublicId);
      const result    = await uploadToCloudinary(req.file.buffer, 'qrunch/menu-items');
      item.imageUrl      = result.secure_url;
      item.imagePublicId = result.public_id;
    } else if (generatedImageUrl) {
      item.imageUrl      = generatedImageUrl;
      item.imagePublicId = '';
    }

    if (name)                      item.name        = name.trim();
    if (description !== undefined) item.description = description;
    if (price !== undefined)       item.price       = Number(price);
    if (dietaryTags) item.dietaryTags = JSON.parse(dietaryTags);
    if (modifiers)   item.modifiers   = JSON.parse(modifiers);

    await item.save();
    res.json(item);
  } catch (err) { next(err); }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await verifyAccess(req, item.restaurant);
    if (item.imagePublicId) await cloudinary.v2.uploader.destroy(item.imagePublicId);
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) { next(err); }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await verifyAccess(req, item.restaurant);
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json(item);
  } catch (err) { next(err); }
};

module.exports = {
  addCategory, getCategories, updateCategory, deleteCategory,
  getItems, addItem, updateItem, deleteItem, toggleAvailability
};