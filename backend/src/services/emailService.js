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

module.exports = { sendLowStockAlert };