const Restaurant = require('../models/Restaurant');
const Category   = require('../models/Category');
const MenuItem   = require('../models/MenuItem');
const Table      = require('../models/Table');
const Order      = require('../models/Order');
const { getIO }  = require('../config/socket');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LANG_NAMES = {
  hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati',
  ta: 'Tamil', te: 'Telugu',  ml: 'Malayalam',
  kn: 'Kannada', bn: 'Bengali', pa: 'Punjabi', es: 'Spanish'
};

const getRestaurantInfo = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId).select('name');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    const table = await Table.findById(req.params.tableId).select('tableNumber tableName seats');
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({ restaurant, table });
  } catch (err) { next(err); }
};

const buildMenu = (categories, items, lang) => {
  return categories.map(cat => ({
    ...cat.toObject(),
    items: items
      .filter(i => i.category.toString() === cat._id.toString())
      .map(i => {
        const trans = lang && lang !== 'en' && i.translations?.[lang];
        return {
          ...i.toObject(),
          name:        trans?.name        || i.name,
          description: trans?.description || i.description
        };
      })
  })).filter(cat => cat.items.length > 0);
};

const getPublicMenu = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const lang = req.query.lang || 'en';
    const categories = await Category.find({ restaurant: restaurantId }).sort({ order: 1, createdAt: 1 });
    let items = await MenuItem.find({ restaurant: restaurantId, isAvailable: true });

    // Translate if needed
    if (lang !== 'en' && LANG_NAMES[lang]) {
      const needsTranslation = items.filter(i => !i.translations?.[lang]?.name);
      if (needsTranslation.length > 0) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const toTranslate = needsTranslation.map(i => ({
            id: i._id.toString(), name: i.name, description: i.description || ''
          }));
          const result = await model.generateContent(
            `Translate these restaurant menu items to ${LANG_NAMES[lang]}.
Keep food names that are already in the target language or are brand names unchanged.
Return ONLY a valid JSON array with the same number of objects, each having "id", "name", "description" fields.
No markdown, no explanation.

${JSON.stringify(toTranslate)}`
          );
          let text = result.response.text().trim().replace(/```json|```/g, '').trim();
          const translated = JSON.parse(text);

          // Cache translations
          await Promise.all(translated.map(async t => {
            const item = items.find(i => i._id.toString() === t.id);
            if (item) {
              item.translations = { ...item.translations, [lang]: { name: t.name, description: t.description } };
              item.markModified('translations');
              await item.save();
            }
          }));
        } catch (e) {
          console.error('Translation error:', e.message);
          // Fall back to English silently
        }
        // Reload items with fresh translations
        items = await MenuItem.find({ restaurant: restaurantId, isAvailable: true });
      }
    }

    res.json(buildMenu(categories, items, lang));
  } catch (err) { next(err); }
};

const getRecommendations = async (req, res, next) => {
  const { restaurantId, phone } = req.params;
  const lang = req.query.lang || 'en';
  if (!phone || phone === 'anonymous') return res.json([]);
  try {
    const orders = await Order.find({ restaurant: restaurantId, customerPhone: phone });
    if (orders.length === 0) return res.json([]);
    const countMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const id = item.menuItemId?.toString();
        if (!id) return;
        countMap[id] = (countMap[id] || 0) + item.quantity;
      });
    });
    const itemIds   = Object.keys(countMap);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds }, isAvailable: true });
    const recommendations = menuItems
      .map(item => {
        const trans = lang !== 'en' && item.translations?.[lang];
        return {
          ...item.toObject(),
          name:        trans?.name        || item.name,
          description: trans?.description || item.description,
          orderCount:  countMap[item._id.toString()] || 0
        };
      })
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 8);
    res.json(recommendations);
  } catch (err) { next(err); }
};

const placeOrder = async (req, res, next) => {
  const { restaurantId, tableId, items, customerName, customerPhone } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' });
  try {
    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    const totalAmount = items.reduce((sum, item) => {
      const modExtra = (item.selectedModifiers || []).reduce((s, m) => s + (m.extraPrice || 0), 0);
      return sum + (item.price + modExtra) * item.quantity;
    }, 0);
    const order = await Order.create({
      restaurant: restaurantId, table: tableId,
      tableNumber: table.tableNumber,
      customerName: customerName?.trim() || '',
      customerPhone: customerPhone?.trim() || '',
      items, totalAmount: Math.round(totalAmount * 100) / 100
    });
    table.status = 'order_pending';
    await table.save();
    try { getIO().to(restaurantId.toString()).emit('new_order', order); }
    catch (e) { console.error('Socket emit error:', e.message); }
    res.status(201).json(order);
  } catch (err) { next(err); }
};

module.exports = { getRestaurantInfo, getPublicMenu, getRecommendations, placeOrder };