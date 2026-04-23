const axios = require('axios');
const cloudinary = require('../config/cloudinary');
const GeneratedImage = require('../models/GeneratedImage');

const generateAndCacheImage = async (dishName) => {
  const key = dishName.toLowerCase().trim();

  // 1 — Check cache first
  const cached = await GeneratedImage.findOne({ dishName: key });
  if (cached) {
    cached.usageCount += 1;
    await cached.save();
    console.log(`Cache hit for "${dishName}" (used ${cached.usageCount} times)`);
    return { imageUrl: cached.imageUrl, fromCache: true };
  }

  // 2 — Generate via Pollinations AI
  const prompt = encodeURIComponent(
    `${dishName}, professional food photography, restaurant menu, appetizing, high quality, white background`
  );
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true&model=flux`;

  // 3 — Download the image buffer
  const response = await axios.get(pollinationsUrl, { responseType: 'arraybuffer', timeout: 60000 });
  const buffer = Buffer.from(response.data);

  // 4 — Upload buffer to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'qrunch/ai-generated',
        public_id: `dish_${key.replace(/\s+/g, '_')}_${Date.now()}`,
        resource_type: 'image',
        transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
      },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });

  // 5 — Save to cache
  const saved = await GeneratedImage.create({
    dishName:  key,
    imageUrl:  uploadResult.secure_url,
    publicId:  uploadResult.public_id
  });

  console.log(`Generated and cached image for "${dishName}"`);
  return { imageUrl: saved.imageUrl, fromCache: false };
};

module.exports = { generateAndCacheImage };