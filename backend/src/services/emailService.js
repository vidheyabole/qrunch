const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendLowStockAlert = async (ownerEmail, ownerName, restaurantName, items) => {
  const itemList = items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#f97316;font-weight:bold;">${i.stock} left</td>
    </tr>`
  ).join('');

  await transporter.sendMail({
    from:    `"QRunch" <${process.env.EMAIL_USER}>`,
    to:      ownerEmail,
    subject: `⚠️ Low Stock Alert — ${restaurantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#f97316;margin-bottom:4px;">QRunch</h2>
        <p style="color:#6b7280;margin-bottom:24px;">Low Stock Alert</p>
        <p>Hi <strong>${ownerName}</strong>,</p>
        <p>The following items at <strong>${restaurantName}</strong> are running low on stock:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#374151;">Item</th>
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#374151;">Stock Remaining</th>
            </tr>
          </thead>
          <tbody>${itemList}</tbody>
        </table>
        <p style="color:#6b7280;font-size:13px;">Please update your inventory to avoid disappointing customers.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/inventory"
          style="display:inline-block;margin-top:16px;background:#f97316;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Update Inventory
        </a>
      </div>
    `
  });
};

const sendFeedbackEmail = async ({ rating, message, senderType, senderName, senderRole, restaurantName, ownerName }) => {
  const stars     = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  const ratingColor = rating >= 4 ? '#16a34a' : rating === 3 ? '#f97316' : '#dc2626';

  const senderSection = senderType === 'customer'
    ? `<p style="color:#6b7280;font-size:13px;">Sent anonymously by a customer</p>`
    : `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:120px;">From</td><td style="color:#111827;font-weight:600;">${senderName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Role</td><td style="color:#111827;font-weight:600;text-transform:capitalize;">${senderRole || senderType}</td></tr>
        ${restaurantName ? `<tr><td style="padding:6px 0;color:#6b7280;">Restaurant</td><td style="color:#111827;font-weight:600;">${restaurantName}</td></tr>` : ''}
        ${ownerName && senderType === 'staff' ? `<tr><td style="padding:6px 0;color:#6b7280;">Owner</td><td style="color:#111827;font-weight:600;">${ownerName}</td></tr>` : ''}
      </table>`;

  await transporter.sendMail({
    from:    `"QRunch Feedback" <${process.env.EMAIL_USER}>`,
    to:      'qrunch9@gmail.com',
    subject: `${stars} New ${senderType} Feedback — ${restaurantName || 'QRunch'}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#f97316;margin-bottom:4px;">QRunch</h2>
        <p style="color:#6b7280;margin-bottom:24px;font-size:14px;">New Feedback Received</p>

        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="font-size:28px;letter-spacing:4px;margin-bottom:8px;">${stars}</div>
          <div style="font-size:32px;font-weight:800;color:${ratingColor};">${rating}/5</div>
        </div>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Message</p>
          <p style="color:#111827;font-size:15px;line-height:1.6;margin:0;">"${message}"</p>
        </div>

        <div style="background:#f9fafb;border-radius:12px;padding:20px;">
          <p style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Sender Details</p>
          ${senderSection}
        </div>

        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
          Received on ${new Date().toLocaleString('en-IN')}
        </p>
      </div>
    `
  });
};

module.exports = { sendLowStockAlert, sendFeedbackEmail };