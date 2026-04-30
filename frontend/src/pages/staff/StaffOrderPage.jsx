import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import StaffLayout from './StaffLayout';
import i18n from '../../i18n';

const LABELS = {
  en: { title: 'Place Order', table: 'Table', categories: 'Categories',
        addToOrder: 'Add to Order', placeOrder: 'Place Order', orderMore: 'Order More',
        orderPlaced: 'Order Placed!', orderSent: 'Order sent to kitchen.',
        total: 'Total', qty: 'Qty', noItems: 'No items in this category',
        customerName: 'Customer Name (optional)', loading: 'Loading...',
        back: 'Back', clear: 'Clear', items: 'items', all: 'All' },
  hi: { title: 'ऑर्डर करें', table: 'टेबल', categories: 'श्रेणियां',
        addToOrder: 'ऑर्डर में जोड़ें', placeOrder: 'ऑर्डर दें', orderMore: 'और ऑर्डर करें',
        orderPlaced: 'ऑर्डर हो गया!', orderSent: 'ऑर्डर किचन को भेज दिया गया।',
        total: 'कुल', qty: 'मात्रा', noItems: 'इस श्रेणी में कोई आइटम नहीं',
        customerName: 'ग्राहक का नाम (वैकल्पिक)', loading: 'लोड हो रहा है...',
        back: 'वापस', clear: 'हटाएं', items: 'आइटम', all: 'सभी' },
  mr: { title: 'ऑर्डर करा', table: 'टेबल', categories: 'श्रेणी',
        addToOrder: 'ऑर्डरमध्ये जोडा', placeOrder: 'ऑर्डर द्या', orderMore: 'आणखी ऑर्डर करा',
        orderPlaced: 'ऑर्डर झाला!', orderSent: 'ऑर्डर किचनला पाठवला गेला.',
        total: 'एकूण', qty: 'प्रमाण', noItems: 'या श्रेणीत कोणतेही आइटम नाही',
        customerName: 'ग्राहकाचे नाव (पर्यायी)', loading: 'लोड होत आहे...',
        back: 'मागे', clear: 'काढा', items: 'आइटम', all: 'सर्व' },
};

export default function StaffOrderPage() {
  const { tableId }  = useParams();
  const navigate     = useNavigate();
  const { staff }    = useStaffAuth();
  const lang         = i18n.language || 'en';
  const L            = LABELS[lang] || LABELS.en;
  const currency     = '₹';
  const token        = staff?.token;
  const restaurantId = staff?.restaurant?._id;
  const authHeader   = { Authorization: `Bearer ${token}` };

  const [categories,    setCategories]    = useState([]);
  const [items,         setItems]         = useState([]);
  const [activeCat,     setActiveCat]     = useState('all');
  const [cart,          setCart]          = useState({});   // { itemId: { item, qty } }
  const [customerName,  setCustomerName]  = useState('');
  const [loading,       setLoading]       = useState(true);
  const [placing,       setPlacing]       = useState(false);
  const [confirmedOrder,setConfirmedOrder]= useState(null);
  const [tableNumber,   setTableNumber]   = useState('');

  // Load menu
  const loadMenu = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [catRes, tableRes] = await Promise.all([
        fetch(`/api/menu/categories/${restaurantId}`, { headers: authHeader }),
        fetch(`/api/tables/${restaurantId}`, { headers: authHeader })
      ]);
      const catData   = await catRes.json();
      const tableData = await tableRes.json();

      setCategories(Array.isArray(catData) ? catData : []);
      if (Array.isArray(catData) && catData.length) setActiveCat('all');

      // Find table number
      if (Array.isArray(tableData)) {
        const table = tableData.find(t => t._id === tableId);
        if (table) setTableNumber(table.tableNumber);
      }

      // Load all items
      if (Array.isArray(catData) && catData.length) {
        const allItems = await Promise.all(
          catData.map(cat =>
            fetch(`/api/menu/items/${cat._id}`, { headers: authHeader }).then(r => r.json())
          )
        );
        setItems(allItems.flat().filter(i => i.isAvailable));
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [restaurantId, tableId, token]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // Cart helpers
  const addItem = (item) => {
    setCart(prev => ({
      ...prev,
      [item._id]: { item, qty: (prev[item._id]?.qty || 0) + 1 }
    }));
  };

  const removeItem = (itemId) => {
    setCart(prev => {
      const current = prev[itemId]?.qty || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...prev[itemId], qty: current - 1 } };
    });
  };

  const clearCart = () => setCart({});

  const cartItems    = Object.values(cart);
  const cartCount    = cartItems.reduce((s, c) => s + c.qty, 0);
  const cartTotal    = cartItems.reduce((s, c) => s + c.item.price * c.qty, 0);

  const visibleItems = activeCat === 'all'
    ? items
    : items.filter(i => i.category === activeCat || i.category?._id === activeCat);

  // Place order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setPlacing(true);
    try {
      const orderItems = cartItems.map(({ item, qty }) => ({
        menuItem: item._id,
        name:     item.name,
        price:    item.price,
        qty
      }));

      const res  = await fetch(`/api/customer/${restaurantId}/${tableId}/orders`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          items:        orderItems,
          customerName: customerName || `Staff — ${staff?.name}`,
          totalAmount:  cartTotal
        })
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmedOrder(data);
        setCart({});
        setCustomerName('');
      }
    } catch (err) { console.error(err); }
    setPlacing(false);
  };

  // ── Confirmation screen ──────────────────────────────────────
  if (confirmedOrder) {
    return (
      <StaffLayout>
        <div className="max-w-md mx-auto flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{L.orderPlaced}</h1>
          <p className="text-gray-400 text-sm mb-4">{L.orderSent}</p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 w-full mb-6 text-left">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Order Summary</p>
            {confirmedOrder.items?.map((item, i) => {
              const qty = item.quantity || item.qty || 1;
              return (
                <div key={i} className="flex justify-between text-sm py-1 text-gray-700 dark:text-gray-300">
                  <span>{item.name} <span className="text-orange-500">×{qty}</span></span>
                  <span>{currency}{((item.price||0)*qty).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <span>{L.total}</span>
              <span className="text-orange-500">{currency}{confirmedOrder.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={() => setConfirmedOrder(null)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition">
              {L.orderMore}
            </button>
            <button onClick={() => navigate('/staff')}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-3 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              {L.back}
            </button>
          </div>
        </div>
      </StaffLayout>
    );
  }

  // ── Order form ───────────────────────────────────────────────
  return (
    <StaffLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {L.title} — {L.table} {tableNumber}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{staff?.restaurant?.name}</p>
          </div>
          <button onClick={() => navigate('/staff')}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl transition">
            ← {L.back}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Left — Menu */}
            <div className="flex-1 min-w-0">
              {/* Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                <button onClick={() => setActiveCat('all')}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
                    ${activeCat === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {L.all}
                </button>
                {categories.map(cat => (
                  <button key={cat._id} onClick={() => setActiveCat(cat._id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
                      ${activeCat === cat._id ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Items */}
              {visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <span className="text-3xl mb-2">🍴</span>
                  <p className="text-sm">{L.noItems}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {visibleItems.map(item => {
                    const inCart = cart[item._id]?.qty || 0;
                    return (
                      <div key={item._id}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
                            <p className="text-sm font-bold text-orange-500">{currency}{item.price.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Qty controls */}
                        {inCart === 0 ? (
                          <button onClick={() => addItem(item)}
                            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                            + {L.addToOrder}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => removeItem(item._id)}
                              className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                              −
                            </button>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 w-6 text-center">{inCart}</span>
                            <button onClick={() => addItem(item)}
                              className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg flex items-center justify-center transition">
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right — Cart summary (desktop) */}
            <div className="w-64 shrink-0 hidden md:block">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 sticky top-20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                    Order ({cartCount} {L.items})
                  </h3>
                  {cartCount > 0 && (
                    <button onClick={clearCart}
                      className="text-xs text-red-400 hover:text-red-600 transition">{L.clear}</button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No items added yet</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
                      {cartItems.map(({ item, qty }) => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{item.name} ×{qty}</span>
                          <span className="text-gray-500 shrink-0 ml-2">{currency}{(item.price*qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 pt-3 border-t border-gray-100 dark:border-gray-800 mb-4">
                      <span>{L.total}</span>
                      <span className="text-orange-500">{currency}{cartTotal.toFixed(2)}</span>
                    </div>

                    {/* Customer name */}
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                      placeholder={L.customerName}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3" />

                    <button onClick={handlePlaceOrder} disabled={placing || cartItems.length === 0}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl text-sm transition">
                      {placing ? '...' : `🍽️ ${L.placeOrder}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile cart FAB */}
        {cartCount > 0 && (
          <div className="fixed bottom-6 left-0 right-0 px-4 z-10 md:hidden">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {cartCount} {L.items} — {currency}{cartTotal.toFixed(2)}
                </span>
                <button onClick={clearCart} className="text-xs text-red-400">{L.clear}</button>
              </div>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder={L.customerName}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3" />
              <button onClick={handlePlaceOrder} disabled={placing}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl text-sm transition">
                {placing ? '...' : `🍽️ ${L.placeOrder}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}