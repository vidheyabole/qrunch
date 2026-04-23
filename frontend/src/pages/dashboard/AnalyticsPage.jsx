import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getAnalytics } from '../../api/analyticsApi';
import { exportToCSV } from '../../utils/csvExport';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5','#fff7ed','#ea580c','#c2410c'];
const fmt = (n, currency) => `${currency}${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function AnalyticsPage() {
  const { owner, currentRestaurant } = useAuth();
  const { t } = useTranslation();
  const token    = localStorage.getItem('qrunch_token');
  const currency = owner?.region === 'india' ? '₹' : '$';

  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo]           = useState(today);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!currentRestaurant?._id) return;
    setLoading(true);
    try {
      const result = await getAnalytics(currentRestaurant._id, from, to, token);
      setData(result);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentRestaurant?._id]);

  const handleExportAll = () => {
    if (!data) return;
    exportToCSV(`${currentRestaurant.name} - Overview (${from} to ${to})`,
      ['Metric', 'Value'],
      [['Total Revenue', `${currency}${data.overview.totalRevenue}`], ['Total Orders', data.overview.totalOrders], ['Avg Order Value', `${currency}${data.overview.avgOrderValue}`], ['Items Sold', data.overview.totalItemsSold]]
    );
    if (data.revenueChart.length > 0)
      exportToCSV(`${currentRestaurant.name} - Revenue (${from} to ${to})`, ['Date', 'Revenue'], data.revenueChart.map(r => [r.date, `${currency}${r.revenue}`]));
    if (data.topItems.length > 0)
      exportToCSV(`${currentRestaurant.name} - Top Items (${from} to ${to})`, ['Item', 'Qty Sold', 'Revenue'], data.topItems.map(i => [i.name, i.quantity, `${currency}${i.revenue?.toFixed(2)}`]));
    toast.success('Analytics exported!');
  };

  const OVERVIEW = data ? [
    { label: t('analytics.totalRevenue'),  value: fmt(data.overview.totalRevenue,  currency), icon: '💰', color: 'text-green-600 dark:text-green-400'  },
    { label: t('analytics.totalOrders'),   value: data.overview.totalOrders,                  icon: '🔔', color: 'text-blue-600 dark:text-blue-400'    },
    { label: t('analytics.avgOrderValue'), value: fmt(data.overview.avgOrderValue, currency), icon: '📊', color: 'text-purple-600 dark:text-purple-400' },
    { label: t('analytics.itemsSold'),     value: data.overview.totalItemsSold,               icon: '🍽️', color: 'text-orange-600 dark:text-orange-400' },
  ] : [];

  const maxHour = data ? Math.max(...data.peakHours.map(h => h.count), 1) : 1;

  if (!currentRestaurant) return (
    <div className="flex items-center justify-center h-64 text-gray-400">No restaurant selected</div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('analytics.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{currentRestaurant.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <label className="text-xs text-gray-400">{t('analytics.fromLabel')}</label>
            <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
              className="text-sm text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <label className="text-xs text-gray-400">{t('analytics.toLabel')}</label>
            <input type="date" value={to} min={from} max={today} onChange={e => setTo(e.target.value)}
              className="text-sm text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none" />
          </div>
          <button onClick={load} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">{t('common.apply')}</button>
          <button onClick={handleExportAll} disabled={!data}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium disabled:opacity-40">
            📥 {t('common.exportCSV')}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { label: t('analytics.today'),  days: 0  },
          { label: t('analytics.last7'),  days: 7  },
          { label: t('analytics.last30'), days: 30 },
          { label: t('analytics.last90'), days: 90 },
        ].map(({ label, days }) => (
          <button key={label} onClick={() => { const f = new Date(); f.setDate(f.getDate() - days); setFrom(f.toISOString().split('T')[0]); setTo(today); }}
            className="text-xs border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:border-orange-400 hover:text-orange-500 transition">
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? null : (
        <div className="flex flex-col gap-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {OVERVIEW.map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="text-2xl mb-2">{icon}</div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('analytics.revenueChart')}</h3>
            {data.revenueChart.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">{t('analytics.noData')}</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${currency}${v}`} />
                  <Tooltip formatter={v => [`${currency}${v}`, t('analytics.revenueChart')]} />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Items + Table Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('analytics.topItems')}</h3>
              {data.topItems.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">{t('analytics.noData')}</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topItems} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
                    <Tooltip formatter={v => [v, t('analytics.qtySold')]} />
                    <Bar dataKey="quantity" radius={[0, 6, 6, 0]}>
                      {data.topItems.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('analytics.tablePerf')}</h3>
              {data.tablePerformance.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">{t('analytics.noData')}</p> : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {data.tablePerformance.map((tbl, i) => (
                    <div key={tbl.table} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tbl.table}</span>
                          <span className="text-sm font-bold text-orange-500">{fmt(tbl.revenue, currency)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(tbl.revenue / data.tablePerformance[0].revenue) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{tbl.orders} {t('analytics.ordersLabel')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('analytics.peakHours')}</h3>
            {data.peakHours.every(h => h.count === 0) ? <p className="text-center text-gray-400 py-8 text-sm">{t('analytics.noData')}</p> : (
              <div className="flex items-end gap-1 h-24 overflow-x-auto pb-1">
                {data.peakHours.map(({ hour, count }) => (
                  <div key={hour} className="flex flex-col items-center gap-1 shrink-0" style={{ width: '3.5%', minWidth: 28 }}>
                    <div className="w-full rounded-t-sm" style={{ height: `${(count / maxHour) * 80}px`, background: count > 0 ? '#f97316' : '#f3f4f6', opacity: count > 0 ? 0.4 + (count / maxHour) * 0.6 : 1, minHeight: count > 0 ? 4 : 0 }} />
                    <span className="text-gray-400" style={{ fontSize: 9 }}>{parseInt(hour)}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {t('analytics.busiestHour')}: {data.peakHours.reduce((a, b) => b.count > a.count ? b : a).hour} ({data.peakHours.reduce((a, b) => b.count > a.count ? b : a).count} {t('analytics.ordersLabel')})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}