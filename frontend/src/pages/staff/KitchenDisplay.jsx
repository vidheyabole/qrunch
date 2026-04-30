import { useEffect, useState } from 'react';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { io } from 'socket.io-client';
import i18n from '../../i18n';

const LABELS = {
  en: { title: 'Kitchen Display', new: 'New', preparing: 'Preparing', ready: 'Ready', markPreparing: 'Start Preparing', markReady: 'Mark Ready', table: 'Table', noOrders: 'No active orders', items: 'items' },
  hi: { title: 'किचन डिस्प्ले', new: 'नया', preparing: 'तैयार हो रहा है', ready: 'तैयार', markPreparing: 'बनाना शुरू करें', markReady: 'तैयार करें', table: 'टेबल', noOrders: 'कोई ऑर्डर नहीं', items: 'आइटम' },
  mr: { title: 'किचन डिस्प्ले', new: 'नवीन', preparing: 'तयार होत आहे', ready: 'तयार', markPreparing: 'बनवणे सुरू करा', markReady: 'तयार करा', table: 'टेबल', noOrders: 'कोणतेही ऑर्डर नाही', items: 'आइटम' },
};

export default function KitchenDisplay() {
  const { staff } = useStaffAuth();
  const [orders, setOrders] = useState([]);
  const lang = i18n.language || 'en';
  const L = LABELS[lang] || LABELS.en;

  const token = staff?.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  const loadOrders = async () => {
    const res = await fetch(
      `/api/orders/staff/${staff?.restaurant?._id}?status=new,preparing`,
      { headers: authHeader }
    );
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadOrders();
    const socket = io('http://localhost:5000', { auth: { token } });

    socket.on('connect', () => {
      socket.emit('join_restaurant', staff?.restaurant?._id);
    });
    socket.on('new_order', () => loadOrders());
    socket.on('order_updated', () => loadOrders());
    return () => socket.disconnect();
  }, [staff?.restaurant?._id]);

  const updateStatus = async (orderId, status) => {
    await fetch(`/api/orders/staff/${orderId}/status`, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadOrders();
  };

  const STATUS_COLOR = {
    new: 'border-red-400   bg-red-50   dark:bg-red-900/20',
    preparing: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    ready: 'border-green-400 bg-green-50  dark:bg-green-900/20',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        👨‍🍳 {L.title}
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <span className="text-5xl mb-3">✅</span>
          <p>{L.noOrders}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map(order => (
            <div key={order._id}
              className={`rounded-2xl border-2 p-4 shadow-sm ${STATUS_COLOR[order.status] || ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                  {L.table} {order.tableNumber || order.table?.tableNumber || '—'}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full
                  ${order.status === 'new' ? 'bg-red-500 text-white' :
                    order.status === 'preparing' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'}`}>
                  {L[order.status]}
                </span>
              </div>

              {/* Time */}
              <p className="text-xs text-gray-400 mb-3">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {order.customerName && ` · ${order.customerName}`}
              </p>

              {/* Items */}
              <div className="flex flex-col gap-1.5 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100 bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-0.5 rounded-lg">
                        ×{item.quantity || item.qty || 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-orange-500">
                      ₹{((item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Special instructions */}
              {order.items.some(i => i.specialNote) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 mb-3">
                  {order.items.filter(i => i.specialNote).map((item, i) => (
                    <p key={i} className="text-xs text-gray-500 italic">"{item.specialNote}"</p>
                  ))}
                </div>
              )}

              {/* Action button */}
              {order.status === 'new' && (
                <button onClick={() => updateStatus(order._id, 'preparing')}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {L.markPreparing}
                </button>
              )}
              {order.status === 'preparing' && (
                <button onClick={() => updateStatus(order._id, 'ready')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {L.markReady}
                </button>
              )}
              {order.status === 'ready' && (
                <div className="w-full text-center text-green-600 font-semibold py-2.5 text-sm">
                  ✅ {L.ready}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}