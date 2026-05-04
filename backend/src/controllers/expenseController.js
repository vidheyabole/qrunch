const Expense    = require('../models/Expense');
const Restaurant = require('../models/Restaurant');

const verify = async (restaurantId, ownerId) => {
  const r = await Restaurant.findById(restaurantId);
  if (!r || r.owner.toString() !== ownerId.toString())
    throw Object.assign(new Error('Not authorized'), { status: 403 });
};

const getPeriodDates = (period) => {
  const end = new Date(); end.setHours(23, 59, 59, 999);
  let start;
  if (period === 'today')      { start = new Date(); start.setHours(0, 0, 0, 0); }
  else if (period === 'month') { start = new Date(new Date().getFullYear(), new Date().getMonth(), 1); }
  else                         { start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); }
  return { start, end };
};

exports.getExpenses = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    await verify(restaurantId, req.owner._id);
    const { start, end } = getPeriodDates(req.query.period || 'week');
    const expenses = await Expense.find({
      restaurant: restaurantId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) { next(err); }
};

exports.addExpense = async (req, res, next) => {
  try {
    const { restaurantId, date, amount, description, category, offlineOrdersCount, offlineRevenue } = req.body;
    await verify(restaurantId, req.owner._id);
    const expense = await Expense.create({
      restaurant:         restaurantId,
      date:               date || new Date(),
      amount:             parseFloat(amount) || 0,
      description:        description || '',
      category:           category || 'inventory',
      offlineOrdersCount: parseInt(offlineOrdersCount) || 0,
      offlineRevenue:     parseFloat(offlineRevenue) || 0,
    });
    res.status(201).json(expense);
  } catch (err) { next(err); }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Not found' });
    await verify(expense.restaurant, req.owner._id);
    await expense.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};