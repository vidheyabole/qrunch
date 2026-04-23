// Generates a full receipt HTML and prints via hidden iframe
// Works with any printer: USB, network, Bluetooth, thermal, regular

export const generateReceiptHTML = (order, restaurantName) => {
  const now    = new Date(order.createdAt);
  const date   = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time   = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const orderId = order._id?.slice(-8).toUpperCase() || 'N/A';

  const itemRows = order.items.map(item => {
    const modExtra  = (item.selectedModifiers || []).reduce((s, m) => s + (m.extraPrice || 0), 0);
    const itemTotal = (item.price + modExtra) * item.quantity;
    const mods      = (item.selectedModifiers || []).map(m => `  ${m.groupName}: ${m.optionLabel}${m.extraPrice > 0 ? ` (+₹${m.extraPrice})` : ''}`).join('\n');
    const note      = item.specialInstructions ? `  Note: ${item.specialInstructions}` : '';
    const extras    = [mods, note].filter(Boolean).join('\n');

    return `
      <tr>
        <td style="padding:6px 0;border-bottom:1px dashed #e5e7eb;vertical-align:top;">
          <div style="font-weight:600;font-size:14px;">${item.name}</div>
          ${extras ? `<div style="font-size:11px;color:#6b7280;white-space:pre-line;margin-top:2px;">${extras}</div>` : ''}
        </td>
        <td style="padding:6px 0;border-bottom:1px dashed #e5e7eb;text-align:center;vertical-align:top;font-size:14px;">×${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #e5e7eb;text-align:right;vertical-align:top;font-weight:600;font-size:14px;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Order Ticket — ${restaurantName}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 8mm; }
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          color: #111;
          background: #fff;
          max-width: 320px;
          margin: 0 auto;
          padding: 16px;
        }
        .divider     { border: none; border-top: 1px dashed #111; margin: 10px 0; }
        .divider-solid { border: none; border-top: 2px solid #111; margin: 10px 0; }
        .center      { text-align: center; }
        .right       { text-align: right; }
        .bold        { font-weight: 700; }
        .small       { font-size: 11px; color: #6b7280; }
        .logo-box    {
          width: 60px; height: 60px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 10px;
          font-size: 10px; color: #9ca3af;
          text-align: center;
        }
        table { width: 100%; border-collapse: collapse; }
        .total-row td { padding: 8px 0; font-size: 16px; font-weight: 700; }
        .print-btn {
          display: block; width: 100%;
          margin-top: 16px; padding: 10px;
          background: #f97316; color: white;
          border: none; border-radius: 8px;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
        }
      </style>
    </head>
    <body>

      <!-- Logo placeholder -->
      <div class="logo-box">LOGO</div>

      <!-- Restaurant name -->
      <div class="center bold" style="font-size:18px;letter-spacing:1px;">${restaurantName.toUpperCase()}</div>
      <div class="center small" style="margin-top:2px;">Order Ticket</div>

      <hr class="divider-solid" />

      <!-- Order meta -->
      <table>
        <tr>
          <td class="small">Order #</td>
          <td class="right bold">${orderId}</td>
        </tr>
        <tr>
          <td class="small">Table</td>
          <td class="right bold">T${order.tableNumber}${order.tableName ? ` — ${order.tableName}` : ''}</td>
        </tr>
        <tr>
          <td class="small">Date</td>
          <td class="right small">${date}</td>
        </tr>
        <tr>
          <td class="small">Time</td>
          <td class="right small">${time}</td>
        </tr>
        ${order.customerName ? `
        <tr>
          <td class="small">Customer</td>
          <td class="right small">${order.customerName}</td>
        </tr>` : ''}
        ${order.customerPhone ? `
        <tr>
          <td class="small">Phone</td>
          <td class="right small">${order.customerPhone}</td>
        </tr>` : ''}
      </table>

      <hr class="divider" />

      <!-- Items header -->
      <table>
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;color:#6b7280;padding-bottom:4px;">ITEM</th>
            <th style="text-align:center;font-size:11px;color:#6b7280;padding-bottom:4px;">QTY</th>
            <th style="text-align:right;font-size:11px;color:#6b7280;padding-bottom:4px;">PRICE</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <hr class="divider-solid" />

      <!-- Total -->
      <table>
        <tr class="total-row">
          <td>TOTAL</td>
          <td></td>
          <td style="text-align:right;color:#f97316;">₹${order.totalAmount.toFixed(2)}</td>
        </tr>
      </table>

      <hr class="divider" />

      <!-- Footer -->
      <div class="center small" style="margin-top:8px;">Thank you for dining with us!</div>
      <div class="center small" style="margin-top:4px;">Powered by QRunch</div>

      <!-- Print button (hidden when printing) -->
      <button class="print-btn no-print" onclick="window.print()">🖨️ Print Ticket</button>

    </body>
    </html>
  `;
};

// Prints via a hidden iframe — no popup required, works on any printer
export const printOrder = (order, restaurantName) => {
  const html   = generateReceiptHTML(order, restaurantName);
  let iframe   = document.getElementById('qrunch-receipt-frame');

  if (!iframe) {
    iframe          = document.createElement('iframe');
    iframe.id       = 'qrunch-receipt-frame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }

  iframe.srcdoc  = html;
  iframe.onload  = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print failed:', e);
    }
  };
};