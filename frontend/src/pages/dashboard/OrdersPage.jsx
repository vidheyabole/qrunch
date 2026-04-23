import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { getOrders, updateOrderStatus } from '../../api/orderApi';
import { printOrder } from '../../utils/printService';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  new:       { label: 'New',       color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500',   next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', next: 'ready',     nextLabel: 'Mark Ready'      },
  ready:     { label: 'Ready',     color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',   dot: 'bg-green-500',  next: 'served',    nextLabel: 'Mark Served'     },
  served:    { label: 'Served',    color: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',           dot: 'bg-gray-400',   next: null,        nextLabel: null              },
};

const TABS = [
  { key: 'new',       label: 'New'       },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready',     label: 'Ready'     },
  { key: 'served',    label: 'Served'    },
  { key: 'all',       label: 'All'       },
];

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

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
  } catch (e) { console.log('Audio not available'); }
};

const AUTO_PRINT_KEY = 'qrunch_auto_print';

export default function OrdersPage() {
  const { owner, currentRestaurant } = useAuth();
  const token    = localStorage.getItem('qrunch_token');
  const currency = owner?.region === 'india' ? '₹' : '$';

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('new');
  const [expandedId, setExpandedId] = useState(null);
  const [, forceUpdate]             = useState(0);
  const isFirstLoad                 = useRef(true);

  // Auto-print toggle — saved to localStorage
  const [autoPrint, setAutoPrint]   = useState(() =>
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

  // Socket handlers
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

      // Auto-print if enabled
      if (localStorage.getItem(AUTO_PRINT_KEY) === 'true') {
        setTimeout(() => {
          printOrder(order, currentRestaurant?.name || 'Restaurant');
        }, 500);
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

  const filteredOrders = orders.filter(o => activeTab === 'all' || o.status === activeTab);

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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-print toggle */}
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
      </div>

      {/* Auto-print info banner */}
      {autoPrint && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 mb-5 flex items-center gap-2">
          <span>🖨️</span>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Auto-print is <strong>ON</strong> — new orders will print automatically. Make sure your printer is connected and selected in your system settings.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const count = tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'
              }`}>
              {tab.label}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : tab.key === 'new' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {loading ? (
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

                {/* Order Header */}
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

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">

                    {/* Items */}
                    <div className="flex flex-col gap-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.name}
                              <span className="text-orange-500 ml-1">×{item.quantity}</span>
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

                    {/* Total */}
                    <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-800 mb-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                      <span className="font-bold text-orange-500">{currency}{order.totalAmount.toFixed(2)}</span>
                    </div>

                    {/* Customer info */}
                    {(order.customerName || order.customerPhone) && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4 flex gap-4">
                        {order.customerName  && <p className="text-xs text-gray-500 dark:text-gray-400">👤 {order.customerName}</p>}
                        {order.customerPhone && <p className="text-xs text-gray-500 dark:text-gray-400">📱 {order.customerPhone}</p>}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Print button */}
                      <button onClick={() => handleManualPrint(order)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium">
                        🖨️ Print
                      </button>

                      {/* Status action */}
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

                      {order.status !== 'new' && order.status !== 'served' && (
                        <button onClick={() => handleStatusUpdate(order, 'new')}
                          className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          ↩ Revert
                        </button>
                      )}

                      {order.status === 'served' && (
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