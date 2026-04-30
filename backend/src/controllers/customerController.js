const Restaurant         = require('../models/Restaurant');
const Category           = require('../models/Category');
const MenuItem           = require('../models/MenuItem');
const Table              = require('../models/Table');
const Order              = require('../models/Order');
const TableSession       = require('../models/TableSession');
const { getIO }          = require('../config/socket');
const { translateTexts } = require('../utils/translator');

const SUPPORTED_LANGS = new Set([
  'hi','mr','gu','ta','te','ml','kn','bn','pa','es'
]);

const getTranslatedItems = async (items, lang) => {
  if (lang === 'en' || !['hi','mr','gu','ta','te','ml','kn','bn','pa','es'].includes(lang)) {
    return items.map(i => i.toObject ? i.toObject() : i);
  }

  const uncached = items.filter(i => !i.translations?.[lang]?.name);
  const cached   = items.filter(i =>  i.translations?.[lang]?.name);

  if (uncached.length > 0) {
    try {
      const names        = uncached.map(i => i.name        || '');
      const descriptions = uncached.map(i => i.description || '');

      const [translatedNames, translatedDescs] = await Promise.all([
        translateTexts(names,        lang),
        translateTexts(descriptions, lang)
      ]);

      uncached.forEach((item, idx) => {
        const tName = translatedNames[idx];
        const tDesc = translatedDescs[idx];

        if (tName && tName !== item.name) {
          item._translatedName        = tName;
          item._translatedDescription = tDesc || item.description || '';

          MenuItem.findByIdAndUpdate(item._id, {
            $set: {
              [`translations.${lang}`]: {
                name:        item._translatedName,
                description: item._translatedDescription
              }
            }
          }).exec().catch(() => {});
        } else {
          item._translatedName        = item.name;
          item._translatedDescription = item.description || '';
        }
      });

    } catch (err) {
      console.error('Translation batch error:', err.message);
      uncached.forEach(item => {
        item._translatedName        = item.name;
        item._translatedDescription = item.description || '';
      });
    }
  }

  return items.map(item => {
    const plain = item.toObject ? item.toObject() : { ...item };
    const tr    = item.translations?.[lang];

    if (tr?.name) {
      return { ...plain, name: tr.name, description: tr.description ?? plain.description };
    }
    return {
      ...plain,
      name:        item._translatedName        ?? plain.name,
      description: item._translatedDescription ?? plain.description
    };
  });
};

// ── GET /api/customer/:restaurantId/:tableId/menu ────────────
exports.getPublicMenu = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    const lang = req.query.lang || 'en';

    res.set('Cache-Control', 'no-store');

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const table = await Table.findOne({ _id: tableId, restaurant: restaurantId });
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const categories = await Category.find({ restaurant: restaurantId }).sort('order');
    const items      = await MenuItem.find({ restaurant: restaurantId, isAvailable: true });

    const translatedItems = await getTranslatedItems(items, lang);

    res.json({ restaurant, table, categories, items: translatedItems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/customer/:restaurantId/:tableId/orders ─────────
exports.placeOrder = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    const { items, customerName, customerPhone, totalAmount } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const mappedItems = items.map(i => ({
      menuItemId:          i.menuItem || i.menuItemId,
      name:                i.name,
      price:               i.price,
      quantity:            i.qty || i.quantity,
      selectedModifiers:   i.selectedMods || i.selectedModifiers || [],
      specialInstructions: i.specialNote  || i.specialInstructions || ''
    }));

    const order = await Order.create({
      restaurant:    restaurantId,
      table:         tableId,
      tableNumber:   table.tableNumber,
      items:         mappedItems,
      customerName:  customerName  || '',
      customerPhone: customerPhone || '',
      totalAmount,
      status: 'new'
    });

    // ── Auto open or update session ──────────────────────────
    try {
      let session = await TableSession.findOne({
        restaurant: restaurantId,
        table:      tableId,
        status:     { $in: ['open', 'bill_requested'] }
      });

      if (session) {
        session.orders.push(order._id);
        session.totalAmount += totalAmount;
        await session.save();
        try { getIO().to(restaurantId).emit('session_updated', session); } catch (_) {}
      } else {
        session = await TableSession.create({
          restaurant:  restaurantId,
          table:       tableId,
          tableNumber: table.tableNumber,
          orders:      [order._id],
          totalAmount,
          status:      'open'
        });
        await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
        try { getIO().to(restaurantId).emit('session_opened', session); } catch (_) {}
      }
    } catch (sessionErr) {
      console.error('Session update error:', sessionErr.message);
    }

    try { getIO().to(restaurantId).emit('new_order', order); } catch (_) {}

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/customer/:restaurantId/:tableId/orders/:orderId ─
exports.getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/customer/:restaurantId/recommendations ──────────
exports.getRecommendations = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const itemIds = (req.query.items || '').split(',').filter(Boolean);
    const lang    = req.query.lang || 'en';

    if (!itemIds.length) return res.json([]);

    const recentOrders = await Order.find({
      restaurant:       restaurantId,
      'items.menuItem': { $in: itemIds }
    }).limit(200);

    const coCount = {};
    for (const order of recentOrders) {
      const otherIds = order.items
        .map(i => i.menuItem?.toString())
        .filter(id => id && !itemIds.includes(id));
      for (const id of otherIds) {
        coCount[id] = (coCount[id] || 0) + 1;
      }
    }

    const topIds = Object.entries(coCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const recs = await MenuItem.find({ _id: { $in: topIds }, isAvailable: true });
    const translatedRecs = await getTranslatedItems(recs, lang);
    res.json(translatedRecs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};