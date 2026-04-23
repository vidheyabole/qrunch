const InventoryItem = require('../models/InventoryItem');
const Restaurant    = require('../models/Restaurant');
const Owner         = require('../models/Owner');
const { sendLowStockAlert } = require('../services/emailService');

const verifyOwnership = async (restaurantId, ownerId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) { const e = new Error('Restaurant not found'); e.status = 404; throw e; }
  if (restaurant.owner.toString() !== ownerId.toString()) {
    const e = new Error('Not authorized'); e.status = 403; throw e;
  }
  return restaurant;
};

const checkAndSendAlerts = async (items, restaurantId) => {
  const lowItems = items.filter(i => i.quantity <= i.lowStockThreshold && i.quantity > 0);
  const outItems = items.filter(i => i.quantity === 0);
  const alertItems = [...lowItems, ...outItems];
  if (alertItems.length === 0) return;
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    const owner      = await Owner.findById(restaurant.owner);
    await sendLowStockAlert(
      owner.email,
      owner.ownerName,
      restaurant.name,
      alertItems.map(i => ({ name: i.name, stock: `${i.quantity} ${i.unit}` }))
    );
  } catch (e) { console.error('Email alert failed:', e.message); }
};

const getInventory = async (req, res, next) => {
  try {
    await verifyOwnership(req.params.restaurantId, req.owner._id);
    const items = await InventoryItem.find({ restaurant: req.params.restaurantId }).sort({ name: 1 });
    res.json(items);
  } catch (err) { next(err); }
};

const addItem = async (req, res, next) => {
  const { restaurantId, name, quantity, unit, lowStockThreshold } = req.body;
  if (!name?.trim())  return res.status(400).json({ message: 'Item name is required' });
  if (!unit?.trim())  return res.status(400).json({ message: 'Unit is required' });
  if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) < 0)
    return res.status(400).json({ message: 'Valid quantity required' });
  try {
    await verifyOwnership(restaurantId, req.owner._id);
    const item = await InventoryItem.create({
      name: name.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      lowStockThreshold: Number(lowStockThreshold) || 5,
      restaurant: restaurantId
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await verifyOwnership(item.restaurant, req.owner._id);
    const { name, quantity, unit, lowStockThreshold } = req.body;
    const prevQty = item.quantity;
    if (name)              item.name              = name.trim();
    if (unit)              item.unit              = unit.trim();
    if (quantity !== undefined) item.quantity     = Number(quantity);
    if (lowStockThreshold) item.lowStockThreshold = Number(lowStockThreshold);
    await item.save();

    // Alert if quantity just dropped to/below threshold
    if (item.quantity <= item.lowStockThreshold && prevQty > item.lowStockThreshold) {
      checkAndSendAlerts([item], item.restaurant);
    }

    res.json(item);
  } catch (err) { next(err); }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await verifyOwnership(item.restaurant, req.owner._id);
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) { next(err); }
};

module.exports = { getInventory, addItem, updateItem, deleteItem };