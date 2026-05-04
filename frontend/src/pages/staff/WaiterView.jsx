import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { io } from 'socket.io-client';
import { getSessions, setSplit, markSplitPaid, closeSession } from '../../api/sessionApi';
import i18n from '../../i18n';

const LABELS = {
  en: {
    title: 'My Tables', total: 'Total', noOrders: 'No active tables',
    table: 'Table', placeOrder: 'Place Order', requestedBill: '🔔 Bill Requested!',
    open: 'Open', billRequested: 'Bill Requested', closed: 'Closed',
    splitBill: 'Split Bill', closeSess: 'Close & Done', printBill: 'Print Bill',
    splitEqual: 'Split Equally', splitCustom: 'Custom Split', splitByOrder: 'By Order',
    people: 'people', perPerson: 'per person', markPaid: 'Mark Paid', paid: '✅ Paid',
    total2: 'Total', apply: 'Apply', cancel: 'Cancel', orders: 'Orders',
    new: 'New', preparing: 'Preparing', ready: 'Ready ✅', completed: 'Completed',
    sessionTotal: 'Session Total', numPeople: 'Number of people',
    customAmounts: 'Enter amounts (must add up to total)', person: 'Person',
    freeTables: 'Free Tables', newOrder: '+ New Order'
  },
  hi: {
    title: 'मेरे टेबल', total: 'कुल', noOrders: 'कोई सक्रिय टेबल नहीं',
    table: 'टेबल', placeOrder: 'ऑर्डर करें', requestedBill: '🔔 बिल मांगा गया!',
    open: 'खुला', billRequested: 'बिल मांगा', closed: 'बंद',
    splitBill: 'बिल विभाजित करें', closeSess: 'बंद करें', printBill: 'बिल प्रिंट करें',
    splitEqual: 'बराबर विभाजित', splitCustom: 'कस्टम', splitByOrder: 'ऑर्डर अनुसार',
    people: 'लोग', perPerson: 'प्रति व्यक्ति', markPaid: 'भुगतान', paid: '✅ भुगतान',
    total2: 'कुल', apply: 'लागू', cancel: 'रद्द', orders: 'ऑर्डर',
    new: 'नया', preparing: 'बन रहा है', ready: 'तैयार ✅', completed: 'पूरा',
    sessionTotal: 'सत्र कुल', numPeople: 'लोगों की संख्या',
    customAmounts: 'राशि दर्ज करें (कुल के बराबर होनी चाहिए)', person: 'व्यक्ति',
    freeTables: 'खाली टेबल', newOrder: '+ नया ऑर्डर'
  },
  mr: {
    title: 'माझे टेबल', total: 'एकूण', noOrders: 'कोणतेही सक्रिय टेबल नाही',
    table: 'टेबल', placeOrder: 'ऑर्डर करा', requestedBill: '🔔 बिल मागितले!',
    open: 'उघडे', billRequested: 'बिल मागितले', closed: 'बंद',
    splitBill: 'बिल विभाजित करा', closeSess: 'बंद करा', printBill: 'बिल प्रिंट करा',
    splitEqual: 'समान विभागणी', splitCustom: 'कस्टम', splitByOrder: 'ऑर्डरनुसार',
    people: 'लोक', perPerson: 'प्रति व्यक्ती', markPaid: 'भरले', paid: '✅ भरले',
    total2: 'एकूण', apply: 'लागू करा', cancel: 'रद्द', orders: 'ऑर्डर',
    new: 'नवीन', preparing: 'तयार होत आहे', ready: 'तयार ✅', completed: 'पूर्ण',
    sessionTotal: 'सत्र एकूण', numPeople: 'लोकांची संख्या',
    customAmounts: 'रक्कम प्रविष्ट करा (एकूण बरोबर असणे आवश्यक)', person: 'व्यक्ती',
    freeTables: 'मोकळे टेबल', newOrder: '+ नवीन ऑर्डर'
  }
};

const STATUS_COLORS = {
  open:           'text-green-600  bg-green-50  dark:bg-green-900/20',
  bill_requested: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  closed:         'text-gray-400   bg-gray-100  dark:bg-gray-800',
};

export default function WaiterView() {
  const { staff }    = useStaffAuth();
  const navigate     = useNavigate();
  const iframeRef    = useRef(null);

  const [sessions,     setSessions]     = useState([]);
  const [tables,       setTables]       = useState([]);
  const [splitSession, setSplitSession] = useState(null);
  const [splitMethod,  setSplitMethod]  = useState('equal');
  const [numPeople,    setNumPeople]    = useState(2);
  const [customAmts,   setCustomAmts]   = useState([]);
  const [showSplit,    setShowSplit]     = useState(false);

  const lang       = i18n.language || 'en';
  const L          = LABELS[lang] || LABELS.en;
  const token      = staff?.token;
  const authHeader = { Authorization: `Bearer ${token}` };
  const currency   = '₹';

  const loadData = async () => {
    const [sessData, tablesRes] = await Promise.all([
      getSessions(staff?.restaurant?._id, token),
      fetch(`/api/tables/${staff?.restaurant?._id}`, { headers: authHeader }).then(r => r.json())
    ]);
    setSessions(Array.isArray(sessData)  ? sessData  : []);
    setTables(Array.isArray(tablesRes) ? tablesRes : []);
  };

  useEffect(() => {
    loadData();
    const socket = io('http://localhost:5000', { auth: { token } });
    socket.on('connect',         () => { socket.emit('join_restaurant', staff?.restaurant?._id); });
    socket.on('new_order',       () => loadData());
    socket.on('order_updated',   () => loadData());
    socket.on('session_opened',  () => loadData());
    socket.on('session_updated', () => loadData());
    socket.on('session_closed',  () => loadData());
    socket.on('bill_requested',  (data) => {
      loadData();
      const tableNum = data?.tableNumber || data?.session?.tableNumber || '?';
      alert(`🔔 Table ${tableNum} has requested the bill!`);
    });
    return () => socket.disconnect();
  }, [staff?.restaurant?._id]);

  const activeSessions  = sessions.filter(s => s.status !== 'closed');
  const sessionTableIds = new Set(activeSessions.map(s => s.table?._id || s.table));
  const freeTables      = tables.filter(t => !sessionTableIds.has(t._id));

  // ── Print Bill ───────────────────────────────────────────────
  const handlePrintBill = (session, splitData = null) => {
    const allItems = (session.orders || []).flatMap(o => o.items || []);
    const itemRows = allItems.map(item => {
      const qty = item.quantity || item.qty || 1;
      return `<tr>
        <td style="padding:6px 4px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:right;">${currency}${((item.price||0)*qty).toFixed(2)}</td>
      </tr>`;
    }).join('');

    const splitSection = splitData ? `
      <hr style="border:none;border-top:1px dashed #ccc;margin:12px 0;" />
      <div style="font-weight:700;margin-bottom:8px;">Split Bill</div>
      ${splitData.map(s => `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
        <span>${s.label}</span><span>${currency}${s.amount.toFixed(2)} ${s.paid ? '✅' : ''}</span>
      </div>`).join('')}
    ` : '';

    const html = `<html><head><title>Bill — Table ${session.tableNumber}</title>
      <style>
        @media print { .no-print { display:none; } body { margin:0; } }
        body { font-family:-apple-system,sans-serif; max-width:400px; margin:0 auto; padding:24px 16px; color:#111; }
        .brand { text-align:center; font-size:22px; font-weight:800; color:#f97316; margin-bottom:4px; }
        .sub { text-align:center; font-size:14px; color:#666; margin-bottom:16px; }
        .divider { border:none; border-top:1px dashed #ccc; margin:12px 0; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { text-align:left; padding:6px 4px; border-bottom:2px solid #111; font-size:11px; text-transform:uppercase; color:#666; }
        th:last-child { text-align:right; }
        .total-row td { padding:10px 4px 4px; font-weight:800; font-size:15px; }
        .total-row td:last-child { text-align:right; color:#f97316; }
        .thank-you { text-align:center; margin-top:20px; font-size:13px; color:#888; }
        .btn { display:block; margin:20px auto 0; padding:10px 24px; background:#f97316; color:white; border:none; border-radius:8px; font-size:14px; cursor:pointer; }
      </style></head>
      <body>
        <div class="brand">🍽️ QRunch</div>
        <div class="sub">${staff?.restaurant?.name || ''}</div>
        <hr class="divider" />
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
          <span>Table ${session.tableNumber}</span>
          <span>${new Date(session.openedAt).toLocaleString()}</span>
        </div>
        <hr class="divider" />
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th style="text-align:right;">Amount</th></tr></thead>
          <tbody>
            ${itemRows}
            <tr class="total-row"><td colspan="2">Total</td><td>${currency}${(session.totalAmount||0).toFixed(2)}</td></tr>
          </tbody>
        </table>
        ${splitSection}
        <hr class="divider" />
        <div class="thank-you">Thank you for visiting!</div>
        <button class="btn no-print" onclick="window.print()">🖨️ Print</button>
      </body></html>`;

    const iframe = iframeRef.current;
    iframe.srcdoc = html;
    iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); };
  };

  // ── Split Bill ───────────────────────────────────────────────
  const openSplit = (session) => {
    setSplitSession(session);
    setSplitMethod('equal');
    setNumPeople(2);
    setCustomAmts([session.totalAmount / 2, session.totalAmount / 2]);
    setShowSplit(true);
  };

  const applySplit = async () => {
    if (!splitSession) return;
    let splits = [];
    if (splitMethod === 'equal') {
      const amt = splitSession.totalAmount / numPeople;
      splits = Array.from({ length: numPeople }, (_, i) => ({
        label: `${L.person} ${i + 1}`, amount: parseFloat(amt.toFixed(2)), paid: false
      }));
    } else if (splitMethod === 'custom') {
      splits = customAmts.map((amt, i) => ({
        label: `${L.person} ${i + 1}`, amount: parseFloat(amt) || 0, paid: false
      }));
    } else if (splitMethod === 'by_order') {
      splits = (splitSession.orders || []).map((o, i) => ({
        label:  `Order ${i + 1}${o.customerName ? ` (${o.customerName})` : ''}`,
        amount: o.totalAmount || 0, paid: false
      }));
    }
    await setSplit(splitSession._id, { splitMethod, customerCount: numPeople, splits }, token);
    setShowSplit(false);
    loadData();
  };

  const handleMarkPaid = async (session, idx) => {
    await markSplitPaid(session._id, idx, token);
    loadData();
  };

  const updateStatus = async (orderId, status) => {
    if (status === 'completed' && !confirm('Mark this order as completed?')) return;
    await fetch(`/api/orders/staff/${orderId}/status`, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadData();
  };

  const handleCloseSession = async (session) => {
    if (!confirm(`Close session for Table ${session.tableNumber}?`)) return;
    await closeSession(session._id, token);
    loadData();
  };

  return (
    <div>
      <iframe ref={iframeRef} style={{ display: 'none' }} title="bill-frame" />

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">🛎️ {L.title}</h1>

      {/* Active sessions */}
      {activeSessions.length > 0 && (
        <div className="flex flex-col gap-4 mb-6">
          {activeSessions.map(session => (
            <div key={session._id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-sm overflow-hidden
                ${session.status === 'bill_requested' ? 'border-orange-400' : 'border-gray-100 dark:border-gray-800'}`}>

              {/* Session header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {L.table} {session.tableNumber}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[session.status]}`}>
                    {session.status === 'bill_requested' ? L.requestedBill : L.open}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/staff/order/${session.table?._id || session.table}`)}
                    className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition font-medium">
                    {L.newOrder}
                  </button>
                  <span className="text-sm font-bold text-orange-500">
                    {currency}{(session.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Orders in session */}
              <div className="px-4 py-3">
                {(session.orders || []).map((order, oi) => (
                  <div key={order._id || oi} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-400 font-medium">
                        Order {oi + 1} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {order.customerName && ` · ${order.customerName}`}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                        ${order.status === 'new'       ? 'bg-red-100    text-red-600    dark:bg-red-900/20    dark:text-red-400'    :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          order.status === 'ready'     ? 'bg-green-100  text-green-600  dark:bg-green-900/20  dark:text-green-400'  :
                                                         'bg-gray-100   text-gray-500   dark:bg-gray-800      dark:text-gray-400'}`}>
                        {L[order.status]}
                      </span>
                    </div>
                    {(order.items || []).map((item, i) => {
                      const qty = item.quantity || item.qty || 1;
                      return (
                        <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400 py-0.5 pl-2">
                          <span>{item.name} <span className="text-orange-500 font-medium">×{qty}</span></span>
                          <span>{currency}{((item.price||0)*qty).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="flex gap-2 mt-2 pl-2">
                      {order.status === 'new' && (
                        <button onClick={() => updateStatus(order._id, 'preparing')}
                          className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition font-medium">
                          🍳 {L.preparing}
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateStatus(order._id, 'ready')}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition font-medium">
                          🔔 {L.ready}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateStatus(order._id, 'completed')}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition font-medium">
                          ✅ {L.completed}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Session total */}
                <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>{L.sessionTotal}</span>
                  <span className="text-orange-500">{currency}{(session.totalAmount||0).toFixed(2)}</span>
                </div>

                {/* Split display if set */}
                {session.splitMethod && session.splitMethod !== 'none' && session.splits?.length > 0 && (
                  <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Split Bill</p>
                    {session.splits.map((split, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{split.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {currency}{split.amount.toFixed(2)}
                          </span>
                          {split.paid ? (
                            <span className="text-xs text-green-500 font-medium">✅ {L.paid}</span>
                          ) : (
                            <button onClick={() => handleMarkPaid(session, idx)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition">
                              {L.markPaid}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <button onClick={() => openSplit(session)}
                  className="flex-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 py-2 rounded-lg transition font-medium">
                  ✂️ {L.splitBill}
                </button>
                <button onClick={() => handlePrintBill(session, session.splits?.length ? session.splits : null)}
                  className="flex-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 hover:bg-blue-100 py-2 rounded-lg transition font-medium">
                  🖨️ {L.printBill}
                </button>
                <button onClick={() => handleCloseSession(session)}
                  className="flex-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 py-2 rounded-lg transition font-medium">
                  ✅ {L.closeSess}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free tables */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        {L.freeTables}
      </h2>
      {freeTables.length === 0 && activeSessions.length === 0 ? (
        <p className="text-sm text-gray-400">{L.noOrders}</p>
      ) : freeTables.length === 0 ? null : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {freeTables.map(table => (
            <div key={table._id}
              className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 text-center">
              <p className="font-bold text-gray-400 text-lg">{L.table} {table.tableNumber}</p>
              <button onClick={() => navigate(`/staff/order/${table._id}`)}
                className="mt-2 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                {L.placeOrder}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Split Bill Modal ── */}
      {showSplit && splitSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                ✂️ {L.splitBill} — {L.table} {splitSession.tableNumber}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {L.sessionTotal}: {currency}{(splitSession.totalAmount||0).toFixed(2)}
              </p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'equal',    label: L.splitEqual   },
                  { key: 'custom',   label: L.splitCustom  },
                  { key: 'by_order', label: L.splitByOrder },
                ].map(m => (
                  <button key={m.key} onClick={() => setSplitMethod(m.key)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border transition text-center
                      ${splitMethod === m.key
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {splitMethod === 'equal' && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.numPeople}</label>
                  <input type="number" min="2" max="20" value={numPeople}
                    onChange={e => setNumPeople(parseInt(e.target.value) || 2)}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <p className="text-sm text-orange-500 font-semibold mt-2 text-center">
                    {currency}{(splitSession.totalAmount / numPeople).toFixed(2)} {L.perPerson}
                  </p>
                </div>
              )}

              {splitMethod === 'custom' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">{L.customAmounts}</label>
                    <div className="flex gap-1">
                      <button onClick={() => setCustomAmts(a => [...a, 0])}
                        className="text-xs text-orange-500 hover:text-orange-600 font-medium">+ Add</button>
                      {customAmts.length > 2 && (
                        <button onClick={() => setCustomAmts(a => a.slice(0, -1))}
                          className="text-xs text-red-400 hover:text-red-600 font-medium ml-2">- Remove</button>
                      )}
                    </div>
                  </div>
                  {customAmts.map((amt, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500 w-16">{L.person} {i + 1}</span>
                      <input type="number" min="0" step="0.01" value={amt}
                        onChange={e => {
                          const n = [...customAmts];
                          n[i] = parseFloat(e.target.value) || 0;
                          setCustomAmts(n);
                        }}
                        className="flex-1 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  ))}
                  <div className={`text-xs font-medium text-center mt-1 ${
                    Math.abs(customAmts.reduce((s, a) => s + (parseFloat(a)||0), 0) - splitSession.totalAmount) < 0.01
                      ? 'text-green-500' : 'text-red-500'}`}>
                    Sum: {currency}{customAmts.reduce((s, a) => s + (parseFloat(a)||0), 0).toFixed(2)} / {currency}{splitSession.totalAmount.toFixed(2)}
                  </div>
                </div>
              )}

              {splitMethod === 'by_order' && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  {(splitSession.orders || []).map((o, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Order {i + 1}{o.customerName ? ` — ${o.customerName}` : ''}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {currency}{(o.totalAmount||0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowSplit(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  {L.cancel}
                </button>
                <button onClick={applySplit}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {L.apply}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}