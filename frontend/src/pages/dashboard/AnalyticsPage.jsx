import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getExpenses, addExpense, deleteExpense } from '../../api/expenseApi';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const { owner, currentRestaurant } = useAuth();
  const { t } = useTranslation();

  const restaurantId  = currentRestaurant?._id;
  const currency      = owner?.region === 'india' ? '₹' : '$';
  const getAuthHeader = () => ({ Authorization: `Bearer ${owner?.token}` });

  const [period,  setPeriod]  = useState('today');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Expenses state
  const [expenses,     setExpenses]     = useState([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expCategory,  setExpCategory]  = useState('inventory');
  const [expDate,      setExpDate]      = useState(new Date().toISOString().split('T')[0]);
  const [expAmount,    setExpAmount]    = useState('');
  const [expDesc,      setExpDesc]      = useState('');
  const [expOffCnt,    setExpOffCnt]    = useState('');
  const [expOffRev,    setExpOffRev]    = useState('');
  const [savingExp,    setSavingExp]    = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/analytics/${restaurantId}?period=${period}`, { headers: getAuthHeader() });
      const json = await res.json();
      setData(json);
    } catch { setData(null); }
    setLoading(false);
  }, [restaurantId, owner?.token, period]);

  const loadExpenses = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await getExpenses(restaurantId, period, owner?.token);
      setExpenses(Array.isArray(data) ? data : []);
    } catch { setExpenses([]); }
  }, [restaurantId, owner?.token, period]);

  useEffect(() => { loadAnalytics(); loadExpenses(); }, [loadAnalytics, loadExpenses]);

  const resetExpForm = () => {
    setExpCategory('inventory');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpAmount(''); setExpDesc(''); setExpOffCnt(''); setExpOffRev('');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSavingExp(true);
    try {
      await addExpense({
        restaurantId,
        date:               expDate,
        amount:             expCategory === 'inventory' ? parseFloat(expAmount) || 0 : 0,
        description:        expDesc,
        category:           expCategory,
        offlineOrdersCount: expCategory === 'offline' ? parseInt(expOffCnt) || 0 : 0,
        offlineRevenue:     expCategory === 'offline' ? parseFloat(expOffRev) || 0 : 0,
      }, owner?.token);
      toast.success('Entry added!');
      setShowExpModal(false);
      resetExpForm();
      loadExpenses();
    } catch { toast.error('Failed to add entry'); }
    setSavingExp(false);
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteExpense(id, owner?.token);
      setExpenses(prev => prev.filter(e => e._id !== id));
      toast.success('Entry deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // ── P&L calculations ──────────────────────────────────
  const onlineRevenue  = data?.overview?.onlineRevenue  || data?.overview?.totalRevenue || 0;
  const offlineRevenue = data?.overview?.offlineRevenue || 0;
  const totalRevenue   = data?.overview?.totalRevenue   || (onlineRevenue + offlineRevenue);
  const totalCosts     = data?.overview?.totalCosts     || 0;
  const netPnl         = data?.overview?.netPnl         || (totalRevenue - totalCosts);
  const onlineOrders   = data?.overview?.onlineOrders   || data?.overview?.totalOrders || 0;
  const offlineOrders  = data?.overview?.offlineOrders  || 0;
  const totalOrders    = data?.overview?.totalOrders    || (onlineOrders + offlineOrders);

  const exportCSV = () => {
    if (!data) return;
    const lines = [
      `Period,${period}`,
      '',
      'P&L SUMMARY',
      `Online Revenue,${onlineRevenue.toFixed(2)}`,
      `Offline Revenue,${offlineRevenue.toFixed(2)}`,
      `Total Revenue,${totalRevenue.toFixed(2)}`,
      `Total Costs,${totalCosts.toFixed(2)}`,
      `Net P&L,${netPnl.toFixed(2)}`,
      `Online Orders,${onlineOrders}`,
      `Offline Orders,${offlineOrders}`,
      '',
      'TOP ITEMS',
      'Item,Quantity,Revenue',
      ...(data.topItems || []).map(i => `"${i.name}",${i.quantity},${i.revenue?.toFixed(2)}`),
      '',
      'TABLE PERFORMANCE',
      'Table,Orders,Revenue',
      ...(data.tablePerformance || []).map(t => `"${t.table}",${t.orders},${t.revenue?.toFixed(2)}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const MiniBar = ({ value, max, color = 'bg-orange-400' }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  const RevenueChart = ({ buckets = [] }) => {
    if (!buckets.length) return null;
    const max = Math.max(...buckets.map(b => b.revenue), 1);
    return (
      <div className="flex items-end gap-1 h-24 mt-3">
        {buckets.map((b, i) => {
          const pct = Math.max(4, Math.round((b.revenue / max) * 100));
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-orange-400 dark:bg-orange-500 rounded-t-md transition-all hover:bg-orange-500"
                style={{ height: `${pct}%` }}
                title={`${currency}${b.revenue?.toFixed(0)} · ${b.date || b.label}`} />
              <span className="text-xs text-gray-400 truncate" style={{ fontSize: '9px' }}>{b.date || b.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const periods = [
    { key: 'today', label: t('analytics.today')    },
    { key: 'week',  label: t('analytics.thisWeek') },
    { key: 'month', label: t('analytics.thisMonth')},
  ];

  const topItems       = data?.topItems           || [];
  const tableStats     = data?.tablePerformance   || [];
  const peakHours      = data?.peakHours          || [];
  const revenueBuckets = data?.revenueChart       || [];
  const hasData        = data && (data.overview?.totalOrders !== undefined);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('analytics.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setShowExpModal(true); resetExpForm(); }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-2 rounded-xl text-sm transition">
            + Add Entry
          </button>
          <button onClick={() => { loadAnalytics(); loadExpenses(); }}
            className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            🔄 {t('common.refresh')}
          </button>
          <button onClick={exportCSV} disabled={!data}
            className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40">
            📥 {t('common.exportCSV')}
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${period === p.key ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="animate-spin text-2xl">⏳</span></div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-4xl mb-3">📊</span>
          <p>{t('analytics.noData')}</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{currency}{totalRevenue.toFixed(2)}</p>
              {offlineRevenue > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {currency}{onlineRevenue.toFixed(2)} online + {currency}{offlineRevenue.toFixed(2)} offline
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalOrders}</p>
              {offlineOrders > 0 && (
                <p className="text-xs text-gray-400 mt-1">{onlineOrders} online + {offlineOrders} offline</p>
              )}
            </div>
            <div className={`rounded-2xl p-5 shadow-sm border ${
              netPnl >= 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net P&L</p>
              <p className={`text-3xl font-bold ${netPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {netPnl >= 0 ? '+' : ''}{currency}{netPnl.toFixed(2)}
              </p>
              {totalCosts > 0 && (
                <p className="text-xs text-gray-400 mt-1">After {currency}{totalCosts.toFixed(2)} costs</p>
              )}
            </div>
          </div>

          {/* ── P&L Breakdown ── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">📊 P&L Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Online Revenue', value: onlineRevenue, color: 'text-blue-600' },
                { label: 'Offline Revenue', value: offlineRevenue, color: 'text-purple-600' },
                { label: 'Total Costs', value: totalCosts, color: 'text-red-500' },
                { label: 'Net P&L', value: netPnl, color: netPnl >= 0 ? 'text-green-600' : 'text-red-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>
                    {value < 0 ? '-' : value > 0 && label === 'Net P&L' ? '+' : ''}{currency}{Math.abs(value).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue chart */}
          {revenueBuckets.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('analytics.revenueOverTime')}</h3>
              <RevenueChart buckets={revenueBuckets} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Top Items */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🏆 {t('analytics.topItems')}</h3>
              {!topItems.length ? <p className="text-sm text-gray-400">{t('analytics.noData')}</p> : (
                <div className="flex flex-col gap-3">
                  {topItems.slice(0, 8).map((item, i) => {
                    const max = topItems[0]?.count || topItems[0]?.quantity || 1;
                    const val = item.count || item.quantity || 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5 text-right font-mono">{i + 1}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 w-36 truncate">{item.name}</span>
                        <MiniBar value={val} max={max} color="bg-orange-400" />
                        <span className="text-xs text-gray-400 w-8 text-right">{val}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Peak Hours */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">⏰ {t('analytics.peakHours')}</h3>
              {!peakHours.length ? <p className="text-sm text-gray-400">{t('analytics.noData')}</p> : (
                <div className="flex flex-col gap-3">
                  {peakHours.filter(h => h.count > 0).map((h, i) => {
                    const max   = Math.max(...peakHours.map(x => x.count), 1);
                    const hour  = typeof h.hour === 'string' ? parseInt(h.hour) : h.hour;
                    const label = isNaN(hour) ? h.hour
                      : `${hour.toString().padStart(2,'0')}:00 – ${(hour+1).toString().padStart(2,'0')}:00`;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
                        <MiniBar value={h.count} max={max} color="bg-blue-400" />
                        <span className="text-xs text-gray-400 w-8 text-right">{h.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Table Performance */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🪑 {t('analytics.tablePerformance')}</h3>
              {!tableStats.length ? <p className="text-sm text-gray-400">{t('analytics.noData')}</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left pb-2">{t('analytics.table')}</th>
                        <th className="text-right pb-2">{t('analytics.orders')}</th>
                        <th className="text-right pb-2">{t('analytics.revenue')}</th>
                        <th className="pb-2 pl-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableStats.map((row, i) => {
                        const maxRev = Math.max(...tableStats.map(r => r.revenue), 1);
                        return (
                          <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                            <td className="py-2.5 text-gray-700 dark:text-gray-300 font-medium">{row.table}</td>
                            <td className="py-2.5 text-right text-gray-500">{row.orders}</td>
                            <td className="py-2.5 text-right text-gray-700 dark:text-gray-300 font-semibold">{currency}{(row.revenue||0).toFixed(2)}</td>
                            <td className="py-2.5 pl-4 w-32"><MiniBar value={row.revenue} max={maxRev} color="bg-green-400" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Expense Log ── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">📝 Expense & Offline Log</h3>
              <button onClick={() => { setShowExpModal(true); resetExpForm(); }}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium transition">
                + Add Entry
              </button>
            </div>
            {expenses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No entries for this period</p>
            ) : (
              <div className="flex flex-col gap-2">
                {expenses.map(exp => (
                  <div key={exp._id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{exp.category === 'inventory' ? '💰' : '🏪'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {exp.description || (exp.category === 'inventory' ? 'Inventory Cost' : 'Offline Orders')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(exp.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                          {exp.category === 'offline' && ` · ${exp.offlineOrdersCount} orders`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {exp.category === 'inventory' ? (
                        <span className="text-sm font-semibold text-red-500">-{currency}{(exp.amount||0).toFixed(2)}</span>
                      ) : (
                        <span className="text-sm font-semibold text-green-600">+{currency}{(exp.offlineRevenue||0).toFixed(2)}</span>
                      )}
                      <button onClick={() => handleDeleteExpense(exp._id)}
                        className="text-xs text-gray-300 hover:text-red-500 transition">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Add Expense Modal ── */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Add Entry</h3>
              <p className="text-xs text-gray-400 mt-1">Log inventory costs or offline orders</p>
            </div>
            <form onSubmit={handleAddExpense} className="px-6 py-5 flex flex-col gap-4">
              {/* Category */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Entry Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'inventory', label: '💰 Inventory Cost',  desc: 'Money spent on stock' },
                    { key: 'offline',   label: '🏪 Offline Orders',  desc: 'Cash orders at table' },
                  ].map(({ key, label, desc }) => (
                    <button key={key} type="button" onClick={() => setExpCategory(key)}
                      className={`p-3 rounded-xl border text-left transition
                        ${expCategory === key ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'}`}>
                      <p className={`text-xs font-semibold ${expCategory === key ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{label}</p>
                      <p className={`text-xs mt-0.5 ${expCategory === key ? 'text-orange-100' : 'text-gray-400'}`}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Date *</label>
                <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} required
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              {expCategory === 'inventory' ? (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Amount Spent ({currency}) *</label>
                  <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} required min="0" step="0.01" placeholder="0.00"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Number of Offline Orders</label>
                    <input type="number" value={expOffCnt} onChange={e => setExpOffCnt(e.target.value)} min="0" placeholder="e.g. 12"
                      className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Total Offline Revenue ({currency}) *</label>
                    <input type="number" value={expOffRev} onChange={e => setExpOffRev(e.target.value)} required min="0" step="0.01" placeholder="0.00"
                      className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </>
              )}

              {/* Description */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  Description <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <input type="text" value={expDesc} onChange={e => setExpDesc(e.target.value)}
                  placeholder={expCategory === 'inventory' ? 'e.g. Weekly vegetable purchase' : 'e.g. Lunch service walk-ins'}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowExpModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button type="submit" disabled={savingExp}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {savingExp ? 'Saving...' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}