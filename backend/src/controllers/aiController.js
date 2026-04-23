const { GoogleGenerativeAI } = require('@google/generative-ai');
const MenuItem = require('../models/MenuItem');
const Order    = require('../models/Order');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DIETARY_TAGS = ['Vegan','Vegetarian','Gluten-Free','Dairy-Free','Spicy','Contains Nuts','Egg-Free','Halal','Jain'];

const handleGeminiError = (err, res, next) => {
  const msg = err.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('rate'))
    return res.status(429).json({ code: 'RATE_LIMIT', message: 'AI is busy right now. Please wait a moment and try again.' });
  if (msg.includes('400') || msg.includes('API key') || msg.includes('invalid'))
    return res.status(400).json({ code: 'INVALID_KEY', message: 'AI service is misconfigured. Please contact support.' });
  if (msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand'))
    return res.status(503).json({ code: 'SERVICE_DOWN', message: 'AI service is temporarily down. Please try again in a few minutes.' });
  next(err);
};

// ── MENU DESCRIPTION ─────────────────────────────────────
const generateDescription = async (req, res, next) => {
  const { itemName } = req.body;
  if (!itemName?.trim()) return res.status(400).json({ message: 'Item name is required' });
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `Write a short, appetizing restaurant menu description for a dish called "${itemName.trim()}". Keep it to 2 sentences max. Sound delicious and professional. Only return the description text, nothing else.`
    );
    res.json({ description: result.response.text().trim() });
  } catch (err) { handleGeminiError(err, res, next); }
};

// ── DIETARY TAG SUGGESTIONS ──────────────────────────────
const suggestDietaryTags = async (req, res, next) => {
  const { itemName } = req.body;
  if (!itemName?.trim()) return res.status(400).json({ message: 'Item name is required' });
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `You are a restaurant menu assistant. Given the dish name "${itemName.trim()}", suggest which of the following dietary tags apply to it.
      
Available tags: ${DIETARY_TAGS.join(', ')}

Rules:
- Only suggest tags that are very likely to apply based on the dish name
- Do NOT suggest a tag if you are not confident
- Return ONLY a JSON array of tag strings with no explanation, no markdown, no backticks
- Example output: ["Vegetarian", "Gluten-Free"]
- If no tags apply, return []`
    );
    let text = result.response.text().trim();
    text = text.replace(/```json|```/g, '').trim();
    const tags = JSON.parse(text);
    const validTags = tags.filter(t => DIETARY_TAGS.includes(t));
    res.json({ tags: validTags });
  } catch (err) {
    if (err instanceof SyntaxError) return res.json({ tags: [] });
    handleGeminiError(err, res, next);
  }
};

// ── UPSELLING RECOMMENDATIONS ────────────────────────────
const getUpsells = async (req, res, next) => {
  const { itemName, restaurantId } = req.body;
  if (!itemName?.trim() || !restaurantId) return res.status(400).json({ message: 'Item name and restaurant ID required' });

  try {
    // 1 — Get all available menu items for this restaurant
    const allItems = await MenuItem.find({ restaurant: restaurantId, isAvailable: true });
    if (allItems.length < 2) return res.json({ items: [] });

    // Filter out the current item
    const otherItems = allItems.filter(i => i.name.toLowerCase() !== itemName.toLowerCase());
    if (otherItems.length === 0) return res.json({ items: [] });

    // 2 — Check order co-occurrence history
    const orders = await Order.find({
      restaurant:  restaurantId,
      'items.name': itemName
    });

    if (orders.length >= 5) {
      // Enough data — use co-occurrence
      const coCount = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.name.toLowerCase() !== itemName.toLowerCase()) {
            coCount[item.name] = (coCount[item.name] || 0) + 1;
          }
        });
      });

      const topNames = Object.entries(coCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name.toLowerCase());

      const matched = otherItems.filter(i => topNames.includes(i.name.toLowerCase()));
      if (matched.length >= 2) {
        return res.json({ items: matched.slice(0, 3), source: 'history' });
      }
    }

    // 3 — Fall back to Gemini AI with actual menu
    const menuList = otherItems.map(i => i.name).join(', ');
    const model    = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result   = await model.generateContent(
      `A customer is ordering "${itemName}" at a restaurant. 
From this restaurant's menu: ${menuList}

Pick exactly 3 items from the menu that would pair well or complement "${itemName}".
Return ONLY a JSON array of item name strings exactly as they appear in the menu list. No explanation, no markdown, no backticks.
Example: ["Garlic Naan", "Raita", "Mango Lassi"]`
    );

    let text = result.response.text().trim();
    text = text.replace(/```json|```/g, '').trim();
    const suggestedNames = JSON.parse(text);

    const matched = otherItems.filter(i =>
      suggestedNames.some(s => s.toLowerCase() === i.name.toLowerCase())
    ).slice(0, 3);

    res.json({ items: matched, source: 'ai' });
  } catch (err) {
    if (err instanceof SyntaxError) return res.json({ items: [] });
    handleGeminiError(err, res, next);
  }
};

module.exports = { generateDescription, suggestDietaryTags, getUpsells };