const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
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
    await verifyOwnership(restaurantId, req.owner._id);
    const count = await Category.countDocuments({ restaurant: restaurantId });
    const category = await Category.create({ name: name.trim(), restaurant: restaurantId, order: count });
    res.status(201).json(category);
  } catch (err) { next(err); }
};

const getCategories = async (req, res, next) => {
  try {
    await verifyOwnership(req.params.restaurantId, req.owner._id);
    const categories = await Category.find({ restaurant: req.params.restaurantId }).sort({ order: 1, createdAt: 1 });
    res.json(categories);
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await verifyOwnership(category.restaurant, req.owner._id);
    category.name = req.body.name?.trim() || category.name;
    await category.save();
    res.json(category);
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await verifyOwnership(category.restaurant, req.owner._id);
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
    await verifyOwnership(category.restaurant, req.owner._id);
    const items = await MenuItem.find({ category: req.params.categoryId }).sort({ createdAt: 1 });
    res.json(items);
  } catch (err) { next(err); }
};

const addItem = async (req, res, next) => {
  try {
    const { categoryId, restaurantId, name, description, price, dietaryTags, modifiers, generatedImageUrl } = req.body;
    await verifyOwnership(restaurantId, req.owner._id);

    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'qrunch/menu-items');
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
    await verifyOwnership(item.restaurant, req.owner._id);

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
    await verifyOwnership(item.restaurant, req.owner._id);
    if (item.imagePublicId) await cloudinary.v2.uploader.destroy(item.imagePublicId);
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) { next(err); }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await verifyOwnership(item.restaurant, req.owner._id);
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json(item);
  } catch (err) { next(err); }
};

module.exports = {
  addCategory, getCategories, updateCategory, deleteCategory,
  getItems, addItem, updateItem, deleteItem, toggleAvailability
};