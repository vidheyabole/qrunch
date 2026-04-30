const Feedback           = require('../models/Feedback');
const { sendFeedbackEmail } = require('../services/emailService');

exports.submitFeedback = async (req, res) => {
  try {
    const { rating, message, senderType, senderName, senderRole, restaurantName, ownerName } = req.body;

    if (!rating || !message?.trim())
      return res.status(400).json({ message: 'Rating and message are required' });

    // Save to DB
    const feedback = await Feedback.create({
      rating,
      message:        message.trim(),
      senderType:     senderType || 'customer',
      senderName:     senderName || 'Anonymous',
      senderRole:     senderRole || '',
      restaurantName: restaurantName || '',
      ownerName:      ownerName || ''
    });

    // Send email (non-blocking)
    sendFeedbackEmail({ rating, message, senderType, senderName, senderRole, restaurantName, ownerName })
      .catch(err => console.error('Feedback email error:', err.message));

    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 }).limit(100);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};