const Order      = require('../models/Order');
const Restaurant = require('../models/Restaurant');

const verifyOwnership = async (restaurantId, ownerId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) { const e = new Error('Restaurant not found'); e.status = 404; throw e; }
  if (restaurant.owner.toString() !== ownerId.toString()) {
    const e = new Error('Not authorized'); e.status = 403; throw e;
  }
  return restaurant;
};

const getAnalytics = async (req, res, next) => {
  const { restaurantId } = req.params;
  const { from, to }     = req.query;

  try {
    await verifyOwnership(restaurantId, req.owner._id);

    const start = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end   = to   ? new Date(new Date(to).setHours(23, 59, 59, 999)) : new Date();

    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt:  { $gte: start, $lte: end },
      status:     { $ne: 'new' } // exclude cancelled/unprocessed
    });

    // ── Overview Cards ───────────────────────────────────
    const totalRevenue   = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders    = orders.length;
    const avgOrderValue  = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItemsSold = orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0);

    // ── Revenue Over Time ─────────────────────────────────
    const revenueByDay = {};
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + order.totalAmount;
    });
    const revenueChart = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: Math.round(revenue * 100) / 100
      }));

    // ── Peak Hours Heatmap ────────────────────────────────
    const hourCount = Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourCount[hour]++;
    });
    const peakHours = hourCount.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count
    }));

    // ── Top Items ─────────────────────────────────────────
    const itemMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].revenue  += item.price * item.quantity;
      });
    });
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // ── Table Performance ─────────────────────────────────
    const tableMap = {};
    orders.forEach(order => {
      const key = `Table ${order.tableNumber}`;
      if (!tableMap[key]) tableMap[key] = { table: key, orders: 0, revenue: 0 };
      tableMap[key].orders++;
      tableMap[key].revenue += order.totalAmount;
    });
    const tablePerformance = Object.values(tableMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      overview: {
        totalRevenue:  Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
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