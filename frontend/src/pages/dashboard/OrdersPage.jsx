import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { getOrders, updateOrderStatus } from '../../api/orderApi';
import { printOrder } from '../../utils/printService';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  new:       { label: 'New',       color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500',   next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', next: 'ready',     nextLabel: 'Mark Ready'      },
  ready:     { label: 'Ready',     color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',   dot: 'bg-green-500',  next: 'completed', nextLabel: 'Mark Completed'  },
  completed: { label: 'Completed', color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',          dot: 'bg-gray-400',   next: null,        nextLabel: null              },
};

const TABS = [
  { key: 'new',       label: 'New'       },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready',     label: 'Ready'     },
  { key: 'completed', label: 'Completed' },
  { key: 'all',       label: 'All'       },
  { key: 'receipts',  label: '🧾 Receipts' },
];

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach(delay => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch (e) {}
};

const AUTO_PRINT_KEY = 'qrunch_auto_print';

// ── Receipt Print Helper ──────────────────────────────────
const printReceipt = (order, restaurantName, currency) => {
  const itemRows = order.items.map(item => {
    const qty   = item.quantity || 1;
    const mods  = (item.selectedModifiers || []).map(m => `${m.groupName}: ${m.optionLabel}`).join(', ');
    const price = ((item.price || 0) + (item.selectedModifiers || []).reduce((s, m) => s + (m.extraPrice || 0), 0)) * qty;
    return `<tr>
      <td style="padding:6px 4px;border-bottom:1px solid #f3f4f6;">
        ${item.name} ×${qty}
        ${mods ? `<br/><span style="font-size:11px;color:#9ca3af;">${mods}</span>` : ''}
        ${item.specialInstructions ? `<br/><span style="font-size:11px;color:#f97316;font-style:italic;">"${item.specialInstructions}"</span>` : ''}
      </td>
      <td style="padding:6px 4px;border-bottom:1px solid #f3f4f6;text-align:right;">${currency}${price.toFixed(2)}</td>
    </tr>`;
  }).join('');

  const html = `<html><head><title>Receipt — Order #${order._id.slice(-6).toUpperCase()}</title>
    <style>
      @media print { .no-print { display:none; } body { margin:0; } }
      body { font-family:-apple-system,sans-serif; max-width:400px; margin:0 auto; padding:24px 16px; color:#111; }
      .brand { text-align:center; font-size:22px; font-weight:800; color:#f97316; margin-bottom:4px; }
      .sub { text-align:center; font-size:13px; color:#666; margin-bottom:4px; }
      .ref { text-align:center; font-size:11px; color:#9ca3af; margin-bottom:16px; }
      .divider { border:none; border-top:1px dashed #e5e7eb; margin:12px 0; }
      table { width:100%; border-collapse:collapse; font-size:13px; }
      th { text-align:left; padding:6px 4px; border-bottom:2px solid #111; font-size:11px; text-transform:uppercase; color:#6b7280; }
      th:last-child { text-align:right; }
      .total-row td { padding:10px 4px 4px; font-weight:800; font-size:15px; }
      .total-row td:last-child { text-align:right; color:#f97316; }
      .meta { font-size:12px; color:#6b7280; margin-bottom:4px; }
      .thank-you { text-align:center; margin-top:20px; font-size:13px; color:#9ca3af; }
      .btn { display:block; margin:20px auto 0; padding:10px 24px; background:#f97316; color:white; border:none; border-radius:8px; font-size:14px; cursor:pointer; }
      .status { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; background:#f0fdf4; color:#16a34a; }
    </style></head>
    <body>
      <div class="brand">🍽️ ${restaurantName}</div>
      <div class="sub">Receipt</div>
      <div class="ref">Order #${order._id.slice(-6).toUpperCase()}</div>
      <hr class="divider"/>
      <p class="meta">📅 ${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}</p>
      <p class="meta">🪑 Table ${order.tableNumber}</p>
      ${order.customerName  ? `<p class="meta">👤 ${order.customerName}</p>`  : ''}
      ${order.customerPhone ? `<p class="meta">📱 ${order.customerPhone}</p>` : ''}
      <p class="meta">Status: <span class="status">${order.status}</span></p>
      <hr class="divider"/>
      <table>
        <thead><tr><th>Item</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td>Total</td>
            <td>${currency}${(order.totalAmount || 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <hr class="divider"/>
      <div class="thank-you">Thank you for visiting! ❤️</div>
      <button class="btn no-print" onclick="window.print()">🖨️ Print Receipt</button>
    </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};

// ── Receipts Tab Component ────────────────────────────────
function ReceiptsTab({ restaurantId, token, currency, restaurantName }) {
  const [receipts,    setReceipts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [summary,     setSummary]     = useState(null);
  const [pagination,  setPagination]  = useState(null);
  const [page,        setPage]        = useState(1);
  const [expandedId,  setExpandedId]  = useState(null);

  // Filters
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [tableFilter,    setTableFilter]    = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');

  const fetchReceipts = useCallback(async (p = 1) => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (dateFrom)                    params.append('from',   dateFrom);
      if (dateTo)                      params.append('to',     dateTo);
      if (statusFilter !== 'all')      params.append('status', statusFilter);
      if (tableFilter.trim())          params.append('table',  tableFilter.trim());
      if (searchQuery.trim())          params.append('search', searchQuery.trim());

      const res  = await fetch(`/api/orders/${restaurantId}/receipts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReceipts(data.orders   || []);
      setSummary(data.summary   || null);
      setPagination(data.pagination || null);
      setPage(p);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [restaurantId, token, dateFrom, dateTo, statusFilter, tableFilter, searchQuery]);

  useEffect(() => { fetchReceipts(1); }, [fetchReceipts]);

  const handleSearch = (e) => { e.preventDefault(); fetchReceipts(1); };

  const clearFilters = () => {
    setDateFrom(''); setDateTo('');
    setStatusFilter('all'); setTableFilter(''); setSearchQuery('');
  };

  return (
    <div>
      {/* ── Summary Cards ── */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Orders',  value: summary.totalOrders,                          color: 'text-gray-800 dark:text-gray-100' },
            { label: 'Total Revenue', value: `${currency}${summary.totalRevenue.toFixed(2)}`, color: 'text-orange-500' },
            { label: 'Total Items',   value: summary.totalItems,                            color: 'text-blue-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          {/* Date from */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {/* Date to */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {/* Status */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {/* Table number */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Table Number</label>
            <input type="number" value={tableFilter} onChange={e => setTableFilter(e.target.value)}
              placeholder="e.g. 3"
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {/* Customer search */}
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Search Customer (name or phone)</label>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. Rahul or 9876543210"
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">
            🔍 Search
          </button>
          <button type="button" onClick={clearFilters}
            className="border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Clear
          </button>
        </div>
      </form>

      {/* ── Results ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-3">🧾</span>
          <p className="text-sm">No receipts found</p>
          <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {receipts.map(order => {
            const st         = STATUS_CONFIG[order.status] || STATUS_CONFIG.completed;
            const isExpanded = expandedId === order._id;
            return (
              <div key={order._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

                {/* Header row */}
                <div className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 font-bold text-gray-600 dark:text-gray-300 text-sm">
                    T{order.tableNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                      {order.customerName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">👤 {order.customerName}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-orange-500">{currency}{(order.totalAmount || 0).toFixed(2)}</span>
                    <span className="text-gray-300 dark:text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded receipt details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                    {/* Customer info */}
                    {(order.customerName || order.customerPhone) && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 mb-3 flex gap-4 flex-wrap">
                        {order.customerName  && <p className="text-xs text-gray-500 dark:text-gray-400">👤 {order.customerName}</p>}
                        {order.customerPhone && <p className="text-xs text-gray-500 dark:text-gray-400">📱 {order.customerPhone}</p>}
                      </div>
                    )}

                    {/* Items */}
                    <div className="flex flex-col gap-2 mb-4">
                      {order.items.map((item, i) => {
                        const qty   = item.quantity || 1;
                        const mods  = item.selectedModifiers || [];
                        const price = ((item.price || 0) + mods.reduce((s, m) => s + (m.extraPrice || 0), 0)) * qty;
                        return (
                          <div key={i} className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {item.name} <span className="text-orange-500">×{qty}</span>
                              </p>
                              {mods.length > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {mods.map(m => `${m.groupName}: ${m.optionLabel}`).join(' · ')}
                                </p>
                              )}
                              {item.specialInstructions && (
                                <p className="text-xs text-orange-400 italic mt-0.5">"{item.specialInstructions}"</p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 shrink-0">{currency}{price.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center py-2.5 border-t border-gray-100 dark:border-gray-800 mb-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-lg font-bold text-orange-500">{currency}{(order.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    {/* Print button */}
                    <button
                      onClick={() => printReceipt(order, restaurantName, currency)}
                      className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 py-2.5 rounded-xl text-sm font-medium transition">
                      🖨️ Print Receipt
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => fetchReceipts(page - 1)} disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button onClick={() => fetchReceipts(page + 1)} disabled={page >= pagination.totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main OrdersPage ───────────────────────────────────────
export default function OrdersPage() {
  const { owner, currentRestaurant } = useAuth();
  const token    = localStorage.getItem('qrunch_token');
  const currency = owner?.region === 'india' ? '₹' : '$';

  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('new');
  const [expandedId, setExpandedId] = useState(null);
  const [,           forceUpdate]   = useState(0);
  const isFirstLoad                 = useRef(true);

  const [autoPrint, setAutoPrint] = useState(() =>
    localStorage.getItem(AUTO_PRINT_KEY) === 'true'
  );

  const toggleAutoPrint = () => {
    const next = !autoPrint;
    setAutoPrint(next);
    localStorage.setItem(AUTO_PRINT_KEY, String(next));
    toast.success(next ? '🖨️ Auto-print enabled' : 'Auto-print disabled');
  };

  const loadOrders = useCallback(async () => {
    if (!currentRestaurant?._id) return;
    try {
      const data = await getOrders(currentRestaurant._id, token);
      setOrders(data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [currentRestaurant?._id, token]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNewOrder = useCallback((order) => {
    setOrders(prev => {
      if (prev.find(o => o._id === order._id)) return prev;
      return [order, ...prev];
    });
    if (!isFirstLoad.current) {
      playNotificationSound();
      toast.custom((t) => (
        <div className={`bg-blue-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
          <span className="text-xl">🔔</span>
          <div>
            <p className="font-semibold text-sm">New Order!</p>
            <p className="text-xs text-blue-100">Table {order.tableNumber}</p>
          </div>
        </div>
      ), { duration: 4000 });
      if (localStorage.getItem(AUTO_PRINT_KEY) === 'true') {
        setTimeout(() => printOrder(order, currentRestaurant?.name || 'Restaurant'), 500);
      }
    }
    isFirstLoad.current = false;
  }, [currentRestaurant?.name]);

  const handleOrderUpdated = useCallback((order) => {
    setOrders(prev => prev.map(o => o._id === order._id ? order : o));
  }, []);

  useSocket(currentRestaurant?._id, { onNewOrder: handleNewOrder, onOrderUpdated: handleOrderUpdated });

  const handleStatusUpdate = async (order, newStatus) => {
    try {
      const updated = await updateOrderStatus(order._id, newStatus, token);
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
      toast.success(`Order marked as ${STATUS_CONFIG[newStatus].label}`);
    } catch { toast.error('Failed to update order status'); }
  };

  const handleManualPrint = (order) => {
    printOrder(order, currentRestaurant?.name || 'Restaurant');
    toast.success('Sending to printer...');
  };

  const filteredOrders = activeTab === 'receipts'
    ? []
    : orders.filter(o => activeTab === 'all' || o.status === activeTab);

  if (!currentRestaurant) return (
    <div className="flex items-center justify-center h-64 text-gray-400">No restaurant selected</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
            {currentRestaurant.name}
            <span className="flex items-center gap-1 text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
              Live
            </span>
          </p>
        </div>
        {activeTab !== 'receipts' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={toggleAutoPrint}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition border ${
                autoPrint
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              🖨️ Auto-print {autoPrint ? 'ON' : 'OFF'}
            </button>
            <button onClick={loadOrders}
              className="text-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              🔄 Refresh
            </button>
          </div>
        )}
      </div>

      {/* Auto-print banner */}
      {autoPrint && activeTab !== 'receipts' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 mb-5 flex items-center gap-2">
          <span>🖨️</span>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Auto-print is <strong>ON</strong> — new orders will print automatically.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const count = tab.key === 'all'
            ? orders.length
            : tab.key === 'receipts'
              ? null
              : orders.filter(o => o.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'
              }`}>
              {tab.label}
              {count !== null && count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : tab.key === 'new'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Receipts Tab ── */}
      {activeTab === 'receipts' ? (
        <ReceiptsTab
          restaurantId={currentRestaurant._id}
          token={token}
          currency={currency}
          restaurantName={currentRestaurant.name}
        />
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 gap-3">
          <span className="text-6xl">🔔</span>
          <p className="text-sm">No {activeTab === 'all' ? '' : activeTab} orders yet</p>
          {activeTab === 'new' && <p className="text-xs text-gray-300 dark:text-gray-700">New orders will appear here in real-time</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map(order => {
            const st         = STATUS_CONFIG[order.status];
            const isExpanded = expandedId === order._id;
            return (
              <div key={order._id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border transition shadow-sm ${
                  order.status === 'new'
                    ? 'border-blue-300 dark:border-blue-700 shadow-blue-50 dark:shadow-none'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                <div className="p-4 flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                    order.status === 'new'       ? 'bg-blue-500 text-white'   :
                    order.status === 'preparing' ? 'bg-orange-500 text-white' :
                    order.status === 'ready'     ? 'bg-green-500 text-white'  :
                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>T{order.tableNumber}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      {order.customerName && <span className="text-xs text-gray-400 dark:text-gray-500">{order.customerName}</span>}
                      <span className="text-xs text-gray-300 dark:text-gray-600 ml-auto text-right">
                        <span className="block">{formatTime(order.createdAt)}</span>
                        <span className="block">{timeAgo(order.createdAt)}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {currency}{order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 truncate">
                      {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 text-sm shrink-0 mt-1">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div className="flex flex-col gap-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.name}<span className="text-orange-500 ml-1">×{item.quantity}</span>
                            </p>
                            {item.selectedModifiers?.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.selectedModifiers.map(m => `${m.groupName}: ${m.optionLabel}`).join(' · ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-xs text-orange-400 italic mt-0.5">"{item.specialInstructions}"</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                            {currency}{((item.price + (item.selectedModifiers || []).reduce((s, m) => s + (m.extraPrice || 0), 0)) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-800 mb-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                      <span className="font-bold text-orange-500">{currency}{order.totalAmount.toFixed(2)}</span>
                    </div>
                    {(order.customerName || order.customerPhone) && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4 flex gap-4">
                        {order.customerName  && <p className="text-xs text-gray-500 dark:text-gray-400">👤 {order.customerName}</p>}
                        {order.customerPhone && <p className="text-xs text-gray-500 dark:text-gray-400">📱 {order.customerPhone}</p>}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleManualPrint(order)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium">
                        🖨️ Print
                      </button>
                      <button onClick={() => printReceipt(order, currentRestaurant.name, currency)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium">
                        🧾 Receipt
                      </button>
                      {st.next && (
                        <button onClick={() => handleStatusUpdate(order, st.next)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                            order.status === 'new'       ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                            order.status === 'preparing' ? 'bg-green-500 hover:bg-green-600 text-white'   :
                            'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}>
                          {st.nextLabel}
                        </button>
                      )}
                      {order.status !== 'new' && order.status !== 'completed' && (
                        <button onClick={() => handleStatusUpdate(order, 'new')}
                          className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          ↩ Revert
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <div className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400 text-center">
                          ✅ Completed
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}