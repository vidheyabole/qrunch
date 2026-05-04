import { useEffect, useState, useCallback } from 'react';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { io } from 'socket.io-client';
import i18n from '../../i18n';

const LABELS = {
  en: { title: 'Kitchen Display', new: 'New', preparing: 'Preparing', ready: 'Ready', markPreparing: 'Start Preparing', markReady: 'Mark Ready', table: 'Table', noOrders: 'No active orders', items: 'items', inventory: 'Inventory', inStock: 'In Stock', lowStock: 'Low Stock', outOfStock: 'Out of Stock', updateQty: 'Update', orders: 'Orders' },
  hi: { title: 'किचन डिस्प्ले', new: 'नया', preparing: 'तैयार हो रहा है', ready: 'तैयार', markPreparing: 'बनाना शुरू करें', markReady: 'तैयार करें', table: 'टेबल', noOrders: 'कोई ऑर्डर नहीं', items: 'आइटम', inventory: 'इन्वेंटरी', inStock: 'स्टॉक में', lowStock: 'कम स्टॉक', outOfStock: 'स्टॉक खत्म', updateQty: 'अपडेट', orders: 'ऑर्डर' },
  mr: { title: 'किचन डिस्प्ले', new: 'नवीन', preparing: 'तयार होत आहे', ready: 'तयार', markPreparing: 'बनवणे सुरू करा', markReady: 'तयार करा', table: 'टेबल', noOrders: 'कोणतेही ऑर्डर नाही', items: 'आइटम', inventory: 'इन्व्हेंटरी', inStock: 'स्टॉकमध्ये', lowStock: 'कमी स्टॉक', outOfStock: 'स्टॉक संपला', updateQty: 'अपडेट', orders: 'ऑर्डर' },
};

const INV_UNITS = ['kg','g','lbs','oz','litre','ml','bottles','cans','packets','pieces','dozen','bags'];

export default function KitchenDisplay() {
  const { staff } = useStaffAuth();
  const [tab,     setTab]     = useState('orders');
  const [orders,  setOrders]  = useState([]);

  // Inventory state
  const [invItems,     setInvItems]     = useState([]);
  const [invLoading,   setInvLoading]   = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [editInvItem,  setEditInvItem]  = useState(null);
  const [savingInv,    setSavingInv]    = useState(false);
  const [invName,      setInvName]      = useState('');
  const [invQty,       setInvQty]       = useState('');
  const [invUnit,      setInvUnit]      = useState('kg');
  const [invCustomUnit,setInvCustomUnit]= useState('');
  const [invThreshold, setInvThreshold] = useState(5);

  const lang         = i18n.language || 'en';
  const L            = LABELS[lang] || LABELS.en;
  const token        = staff?.token;
  const authHeader   = { Authorization: `Bearer ${token}` };
  const restaurantId = staff?.restaurant?._id;

  const loadOrders = useCallback(async () => {
    const res  = await fetch(`/api/orders/staff/${restaurantId}?status=new,preparing`, { headers: authHeader });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  }, [restaurantId, token]);

  const loadInventory = useCallback(async () => {
    if (!restaurantId) return;
    setInvLoading(true);
    const res  = await fetch(`/api/inventory/${restaurantId}`, { headers: authHeader });
    const data = await res.json();
    setInvItems(Array.isArray(data) ? data : []);
    setInvLoading(false);
  }, [restaurantId, token]);

  useEffect(() => {
    loadOrders();
    const socket = io('http://localhost:5000', { auth: { token } });
    socket.on('connect',      () => socket.emit('join_restaurant', restaurantId));
    socket.on('new_order',    () => loadOrders());
    socket.on('order_updated',() => loadOrders());
    return () => socket.disconnect();
  }, [restaurantId]);

  useEffect(() => {
    if (tab === 'inventory') loadInventory();
  }, [tab, loadInventory]);

  const updateStatus = async (orderId, status) => {
    await fetch(`/api/orders/staff/${orderId}/status`, {
      method: 'PATCH', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadOrders();
  };

  const invFinalUnit = invUnit === 'custom' ? invCustomUnit : invUnit;

  const openEditInv = (item) => {
    setEditInvItem(item);
    setInvName(item.name);
    setInvQty(item.quantity.toString());
    const known = INV_UNITS.includes(item.unit);
    setInvUnit(known ? item.unit : 'custom');
    setInvCustomUnit(known ? '' : item.unit);
    setInvThreshold(item.lowStockThreshold ?? 5);
    setShowInvModal(true);
  };

  const saveInvItem = async (e) => {
    e.preventDefault();
    if (!invName.trim() || invQty === '' || !invFinalUnit) return;
    setSavingInv(true);
    await fetch(`/api/inventory/${editInvItem._id}`, {
      method: 'PUT',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: invName, quantity: parseFloat(invQty), unit: invFinalUnit, lowStockThreshold: parseFloat(invThreshold), restaurantId })
    });
    setSavingInv(false);
    setShowInvModal(false);
    loadInventory();
  };

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: L.outOfStock, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    if (item.quantity <= item.lowStockThreshold) return { label: L.lowStock, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' };
    return { label: L.inStock, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
  };

  const STATUS_COLOR = {
    new:      'border-red-400   bg-red-50   dark:bg-red-900/20',
    preparing:'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    ready:    'border-green-400 bg-green-50  dark:bg-green-900/20',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">👨‍🍳 {L.title}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[{ key: 'orders', label: `📋 ${L.orders}` }, { key: 'inventory', label: `📦 ${L.inventory}` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${tab === t.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Orders Tab ── */}
      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="text-5xl mb-3">✅</span>
            <p>{L.noOrders}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map(order => (
              <div key={order._id} className={`rounded-2xl border-2 p-4 shadow-sm ${STATUS_COLOR[order.status] || ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                    {L.table} {order.tableNumber || order.table?.tableNumber || '—'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full
                    ${order.status === 'new' ? 'bg-red-500 text-white' : order.status === 'preparing' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}>
                    {L[order.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {order.customerName && ` · ${order.customerName}`}
                </p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-lg">
                          ×{item.quantity || item.qty || 1}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {order.items.some(i => i.specialNote) && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 mb-3">
                    {order.items.filter(i => i.specialNote).map((item, i) => (
                      <p key={i} className="text-xs text-gray-500 italic">"{item.specialNote}"</p>
                    ))}
                  </div>
                )}
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
                  <div className="w-full text-center text-green-600 font-semibold py-2.5 text-sm">✅ {L.ready}</div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Inventory Tab ── */}
      {tab === 'inventory' && (
        <div>
          {invLoading ? (
            <div className="flex justify-center py-16"><span className="animate-spin text-2xl">⏳</span></div>
          ) : invItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-sm">No inventory items yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {invItems.map(item => {
                const { label, color } = getStockStatus(item);
                return (
                  <div key={item._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.quantity} {item.unit} · Alert at {item.lowStockThreshold} {item.unit}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${color}`}>{label}</span>
                      <button onClick={() => openEditInv(item)}
                        className="text-xs text-blue-500 hover:text-blue-700 transition shrink-0">
                        {L.updateQty}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Inventory Edit Modal ── */}
      {showInvModal && editInvItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Update: {editInvItem.name}</h3>
            </div>
            <form onSubmit={saveInvItem} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Quantity</label>
                <input type="number" value={invQty} onChange={e => setInvQty(e.target.value)} min="0" step="0.1" autoFocus
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Unit</label>
                <select value={invUnit} onChange={e => setInvUnit(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {INV_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="custom">Custom…</option>
                </select>
                {invUnit === 'custom' && (
                  <input type="text" value={invCustomUnit} onChange={e => setInvCustomUnit(e.target.value)} placeholder="Custom unit"
                    className="mt-2 w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowInvModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={savingInv}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {savingInv ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}