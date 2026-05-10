import { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../hooks/useStaffAuth';

const STATUS_COLORS = {
  new:       'bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-400',
  preparing: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  ready:     'bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-400',
  completed: 'bg-gray-100   text-gray-500   dark:bg-gray-800      dark:text-gray-400',
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

const printReceipt = (order, restaurantName) => {
  const currency = '₹';
  const itemRows = order.items.map(item => {
    const qty   = item.quantity || 1;
    const mods  = (item.selectedModifiers || []);
    const price = ((item.price || 0) + mods.reduce((s, m) => s + (m.extraPrice || 0), 0)) * qty;
    return `<tr>
      <td style="padding:6px 4px;border-bottom:1px solid #f3f4f6;">
        ${item.name} ×${qty}
        ${mods.length ? `<br/><span style="font-size:11px;color:#9ca3af;">${mods.map(m => `${m.groupName}: ${m.optionLabel}`).join(', ')}</span>` : ''}
        ${item.specialInstructions ? `<br/><span style="font-size:11px;color:#f97316;font-style:italic;">"${item.specialInstructions}"</span>` : ''}
      </td>
      <td style="padding:6px 4px;border-bottom:1px solid #f3f4f6;text-align:right;">${currency}${price.toFixed(2)}</td>
    </tr>`;
  }).join('');

  const html = `<html><head><title>Receipt #${order._id.slice(-6).toUpperCase()}</title>
    <style>
      @media print { .no-print{display:none;} body{margin:0;} }
      body{font-family:-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:24px 16px;color:#111;}
      .brand{text-align:center;font-size:22px;font-weight:800;color:#f97316;margin-bottom:4px;}
      .sub{text-align:center;font-size:13px;color:#666;margin-bottom:4px;}
      .ref{text-align:center;font-size:11px;color:#9ca3af;margin-bottom:16px;}
      .divider{border:none;border-top:1px dashed #e5e7eb;margin:12px 0;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th{text-align:left;padding:6px 4px;border-bottom:2px solid #111;font-size:11px;text-transform:uppercase;color:#6b7280;}
      th:last-child{text-align:right;}
      .total-row td{padding:10px 4px 4px;font-weight:800;font-size:15px;}
      .total-row td:last-child{text-align:right;color:#f97316;}
      .meta{font-size:12px;color:#6b7280;margin-bottom:4px;}
      .thank-you{text-align:center;margin-top:20px;font-size:13px;color:#9ca3af;}
      .btn{display:block;margin:20px auto 0;padding:10px 24px;background:#f97316;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;}
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
      <hr class="divider"/>
      <table>
        <thead><tr><th>Item</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>
          ${itemRows}
          <tr class="total-row"><td>Total</td><td>${currency}${(order.totalAmount||0).toFixed(2)}</td></tr>
        </tbody>
      </table>
      <hr class="divider"/>
      <div class="thank-you">Thank you for visiting! ❤️</div>
      <button class="btn no-print" onclick="window.print()">🖨️ Print Receipt</button>
    </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
};

export default function StaffReceiptsPage() {
  const { staff } = useStaffAuth();
  const token        = staff?.token;
  const restaurantId = staff?.restaurant?._id;
  const restaurantName = staff?.restaurant?.name || 'Restaurant';
  const currency     = '₹';

  const [receipts,   setReceipts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [summary,    setSummary]    = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tableFilter,  setTableFilter]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');

  const fetchReceipts = useCallback(async (p = 1) => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (dateFrom)               params.append('from',   dateFrom);
      if (dateTo)                 params.append('to',     dateTo);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (tableFilter.trim())     params.append('table',  tableFilter.trim());
      if (searchQuery.trim())     params.append('search', searchQuery.trim());

      const res  = await fetch(`/api/orders/staff/${restaurantId}/receipts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReceipts(data.orders      || []);
      setSummary(data.summary      || null);
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-5">🧾 Receipts</h1>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Orders',  value: summary.totalOrders,                             color: 'text-gray-800 dark:text-gray-100' },
            { label: 'Total Revenue', value: `${currency}${summary.totalRevenue.toFixed(2)}`, color: 'text-orange-500' },
            { label: 'Total Items',   value: summary.totalItems,                              color: 'text-blue-500'   },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
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
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Table Number</label>
            <input type="number" value={tableFilter} onChange={e => setTableFilter(e.target.value)}
              placeholder="e.g. 3"
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Search Customer</label>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Name or phone number"
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">
            🔍 Search
          </button>
          <button type="button" onClick={clearFilters}
            className="border border-gray-300 dark:border-gray-600 text-gray-500 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Clear
          </button>
        </div>
      </form>

      {/* Results */}
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
            const isExpanded = expandedId === order._id;
            return (
              <div key={order._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 font-bold text-gray-600 dark:text-gray-300 text-sm">
                    T{order.tableNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || STATUS_COLORS.completed}`}>
                        {order.status}
                      </span>
                      {order.customerName && (
                        <span className="text-xs text-gray-500">👤 {order.customerName}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-orange-500">{currency}{(order.totalAmount||0).toFixed(2)}</span>
                    <span className="text-gray-300 dark:text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                    {(order.customerName || order.customerPhone) && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 mb-3 flex gap-4 flex-wrap">
                        {order.customerName  && <p className="text-xs text-gray-500">👤 {order.customerName}</p>}
                        {order.customerPhone && <p className="text-xs text-gray-500">📱 {order.customerPhone}</p>}
                      </div>
                    )}
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
                                <p className="text-xs text-gray-400 mt-0.5">{mods.map(m => `${m.groupName}: ${m.optionLabel}`).join(' · ')}</p>
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
                    <div className="flex justify-between items-center py-2.5 border-t border-gray-100 dark:border-gray-800 mb-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-lg font-bold text-orange-500">{currency}{(order.totalAmount||0).toFixed(2)}</span>
                    </div>
                    <button onClick={() => printReceipt(order, restaurantName)}
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => fetchReceipts(page - 1)} disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
          <button onClick={() => fetchReceipts(page + 1)} disabled={page >= pagination.totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}