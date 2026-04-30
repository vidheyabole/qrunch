import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export default function AnalyticsPage() {
  const { owner, currentRestaurant } = useAuth();
  console.log('currentRestaurant:', currentRestaurant);
  const { t } = useTranslation();

  const restaurantId  = currentRestaurant?._id;
  const currency = owner?.region === 'india' ? '₹' : '$';
  const getAuthHeader = () => ({ Authorization: `Bearer ${owner?.token}` });

  const [period,  setPeriod]  = useState('today');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res  = await fetch(
        `/api/analytics/${restaurantId}?period=${period}`,
        { headers: getAuthHeader() }
      );
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [restaurantId, owner?.token, period]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const exportCSV = () => {
    if (!data) return;
    const lines = [
      `Period,${period}`,
      `Total Revenue,${data.overview?.totalRevenue?.toFixed(2) || 0}`,
      `Total Orders,${data.overview?.totalOrders || 0}`,
      `Avg Order Value,${data.overview?.avgOrderValue?.toFixed(2) || 0}`,
      '',
      'TOP ITEMS',
      'Item,Quantity,Revenue',
      ...(data.topItems || []).map(i => `"${i.name}",${i.quantity},${i.revenue?.toFixed(2)}`),
      '',
      'TABLE PERFORMANCE',
      'Table,Orders,Revenue',
      ...(data.tablePerformance || []).map(t => `"${t.table}",${t.orders},${t.revenue?.toFixed(2)}`),
      '',
      'PEAK HOURS',
      'Hour,Orders',
      ...(data.peakHours || []).map(h => `${h.hour},${h.count}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
              <div
                className="w-full bg-orange-400 dark:bg-orange-500 rounded-t-md transition-all hover:bg-orange-500 dark:hover:bg-orange-400"
                style={{ height: `${pct}%` }}
                title={`${currency}${b.revenue?.toFixed(0)} · ${b.date || b.label}`}
              />
              <span className="text-xs text-gray-400 truncate" style={{ fontSize: '9px' }}>
                {b.date || b.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const periods = [
    { key: 'today', label: t('analytics.today')     },
    { key: 'week',  label: t('analytics.thisWeek')  },
    { key: 'month', label: t('analytics.thisMonth') },
  ];

  // Normalise data — handle both old and new analytics response shapes
  const overview       = data?.overview       || { totalRevenue: data?.totalRevenue,    totalOrders: data?.totalOrders,    avgOrderValue: data?.avgOrderValue    };
  const topItems       = data?.topItems       || [];
  const tableStats     = data?.tablePerformance || data?.tableStats || [];
  const peakHours      = data?.peakHours      || [];
  const revenueBuckets = data?.revenueChart   || data?.revenueBuckets || [];

  const hasData = data && (overview.totalOrders !== undefined);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('analytics.title')}</h1>
        <div className="flex gap-2">
          <button onClick={loadAnalytics}
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
              ${period === p.key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <span className="animate-spin text-2xl">⏳</span>
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-4xl mb-3">📊</span>
          <p>{t('analytics.noData')}</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('analytics.totalRevenue')}</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {currency}{(overview.totalRevenue || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('analytics.totalOrders')}</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {overview.totalOrders || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('analytics.avgOrderValue')}</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {currency}{(overview.avgOrderValue || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* ── Revenue Over Time ── */}
          {revenueBuckets.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('analytics.revenueOverTime')}
              </h3>
              <RevenueChart buckets={revenueBuckets} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Top Items ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                🏆 {t('analytics.topItems')}
              </h3>
              {!topItems.length ? (
                <p className="text-sm text-gray-400">{t('analytics.noData')}</p>
              ) : (
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

            {/* ── Peak Hours ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                ⏰ {t('analytics.peakHours')}
              </h3>
              {!peakHours.length ? (
                <p className="text-sm text-gray-400">{t('analytics.noData')}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {peakHours.map((h, i) => {
                    const max   = Math.max(...peakHours.map(x => x.count), 1);
                    const hour  = typeof h.hour === 'string' ? parseInt(h.hour) : h.hour;
                    const label = isNaN(hour)
                      ? h.hour
                      : `${hour.toString().padStart(2, '0')}:00 – ${(hour + 1).toString().padStart(2, '0')}:00`;
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

            {/* ── Table Performance ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                🪑 {t('analytics.tablePerformance')}
              </h3>
              {!tableStats.length ? (
                <p className="text-sm text-gray-400">{t('analytics.noData')}</p>
              ) : (
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
                        const label  = row.table || row.label || `Table ${i + 1}`;
                        return (
                          <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                            <td className="py-2.5 text-gray-700 dark:text-gray-300 font-medium">{label}</td>
                            <td className="py-2.5 text-right text-gray-500">{row.orders}</td>
                            <td className="py-2.5 text-right text-gray-700 dark:text-gray-300 font-semibold">
                              {currency}{(row.revenue || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 pl-4 w-32">
                              <MiniBar value={row.revenue} max={maxRev} color="bg-green-400" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}