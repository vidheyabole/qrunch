const Table      = require('../models/Table');
const Restaurant = require('../models/Restaurant');

const verifyOwnership = async (restaurantId, ownerId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) { const e = new Error('Restaurant not found'); e.status = 404; throw e; }
  if (restaurant.owner.toString() !== ownerId.toString()) {
    const e = new Error('Not authorized'); e.status = 403; throw e;
  }
  return restaurant;
};

const getTables = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    if (req.owner) {
      await verifyOwnership(restaurantId, req.owner._id);
    } else if (req.staff) {
      if (req.staff.restaurant.toString() !== restaurantId)
        return res.status(403).json({ message: 'Not authorized' });
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const tables = await Table.find({ restaurant: restaurantId }).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) { next(err); }
};

const addTable = async (req, res, next) => {
  const { restaurantId, tableName, seats } = req.body;
  if (!seats || seats < 1) return res.status(400).json({ message: 'Seats must be at least 1' });
  try {
    await verifyOwnership(restaurantId, req.owner._id);
    const last        = await Table.findOne({ restaurant: restaurantId }).sort({ tableNumber: -1 });
    const tableNumber = last ? last.tableNumber + 1 : 1;
    const table       = await Table.create({
      tableNumber,
      tableName:  tableName?.trim() || '',
      seats:      Number(seats),
      restaurant: restaurantId
    });
    res.status(201).json(table);
  } catch (err) { next(err); }
};

const updateTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    await verifyOwnership(table.restaurant, req.owner._id);
    const { tableName, seats } = req.body;
    if (tableName !== undefined) table.tableName = tableName.trim();
    if (seats)                   table.seats     = Number(seats);
    await table.save();
    res.json(table);
  } catch (err) { next(err); }
};

const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    await verifyOwnership(table.restaurant, req.owner._id);
    await table.deleteOne();
    res.json({ message: 'Table deleted' });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    if (req.owner) {
      await verifyOwnership(table.restaurant, req.owner._id);
    } else if (req.staff) {
      if (req.staff.restaurant.toString() !== table.restaurant.toString())
        return res.status(403).json({ message: 'Not authorized' });
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { status } = req.body;
    const valid = ['empty', 'occupied', 'order_pending', 'bill_requested'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    table.status = status;
    await table.save();
    res.json(table);
  } catch (err) { next(err); }
};

module.exports = { getTables, addTable, updateTable, deleteTable, updateStatus };