const Order   = require('../models/Order');
const Expense = require('../models/Expense');
const Restaurant = require('../models/Restaurant');

const verifyOwnership = async (restaurantId, ownerId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) { const e = new Error('Restaurant not found'); e.status = 404; throw e; }
  if (restaurant.owner.toString() !== ownerId.toString()) {
    const e = new Error('Not authorized'); e.status = 403; throw e;
  }
  return restaurant;
};

const getPeriodDates = (period, from, to) => {
  if (from && to) {
    return {
      start: new Date(from),
      end:   new Date(new Date(to).setHours(23, 59, 59, 999))
    };
  }
  const end = new Date(); end.setHours(23, 59, 59, 999);
  let start;
  if (period === 'today')      { start = new Date(); start.setHours(0, 0, 0, 0); }
  else if (period === 'month') { start = new Date(new Date().getFullYear(), new Date().getMonth(), 1); }
  else                         { start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); }
  return { start, end };
};

const getAnalytics = async (req, res, next) => {
  const { restaurantId } = req.params;
  const { from, to, period } = req.query;

  try {
    await verifyOwnership(restaurantId, req.owner._id);
    const { start, end } = getPeriodDates(period, from, to);

    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt:  { $gte: start, $lte: end },
      status:     { $ne: 'new' }
    });

    const expenses = await Expense.find({
      restaurant: restaurantId,
      date:       { $gte: start, $lte: end }
    });

    // ── Online revenue ────────────────────────────────────
    const onlineRevenue  = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders    = orders.length;
    const totalItemsSold = orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0);

    // ── P&L from expenses ─────────────────────────────────
    const inventoryExpenses = expenses.filter(e => e.category === 'inventory');
    const offlineEntries    = expenses.filter(e => e.category === 'offline');
    const totalCosts        = inventoryExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const offlineRevenue    = offlineEntries.reduce((s, e) => s + (e.offlineRevenue || 0), 0);
    const offlineOrders     = offlineEntries.reduce((s, e) => s + (e.offlineOrdersCount || 0), 0);
    const totalRevenue      = onlineRevenue + offlineRevenue;
    const netPnl            = totalRevenue - totalCosts;

    // ── Revenue over time ─────────────────────────────────
    const revenueByDay = {};
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + order.totalAmount;
    });
    const revenueChart = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date:    new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: Math.round(revenue * 100) / 100
      }));

    // ── Peak hours ────────────────────────────────────────
    const hourCount = Array(24).fill(0);
    orders.forEach(order => { hourCount[new Date(order.createdAt).getHours()]++; });
    const peakHours = hourCount.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`, count
    }));

    // ── Top items ─────────────────────────────────────────
    const itemMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].revenue  += item.price * item.quantity;
      });
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 8);

    // ── Table performance ─────────────────────────────────
    const tableMap = {};
    orders.forEach(order => {
      const key = `Table ${order.tableNumber}`;
      if (!tableMap[key]) tableMap[key] = { table: key, orders: 0, revenue: 0 };
      tableMap[key].orders++;
      tableMap[key].revenue += order.totalAmount;
    });
    const tablePerformance = Object.values(tableMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    res.json({
      overview: {
        totalRevenue:  Math.round(totalRevenue  * 100) / 100,
        onlineRevenue: Math.round(onlineRevenue * 100) / 100,
        offlineRevenue:Math.round(offlineRevenue* 100) / 100,
        totalOrders:   totalOrders + offlineOrders,
        onlineOrders:  totalOrders,
        offlineOrders,
        totalCosts:    Math.round(totalCosts * 100) / 100,
        netPnl:        Math.round(netPnl    * 100) / 100,
        totalItemsSold
      },
      revenueChart,
      peakHours,
      topItems,
      tablePerformance
    });
  } catch (err) { next(err); }
};

module.exports = { getAnalytics };