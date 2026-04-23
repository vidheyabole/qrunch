const { generateAndCacheImage } = require('../services/imageGenerationService');

const generateImage = async (req, res, next) => {
  const { dishName } = req.body;
  if (!dishName?.trim()) return res.status(400).json({ message: 'Dish name is required' });
  try {
    const result = await generateAndCacheImage(dishName.trim());
    res.json(result);
  } catch (err) {
    console.error('Image generation error:', err.message);
    next(err);
  }
};

module.exports = { generateImage };