import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getActiveSession, requestBill } from '../../api/sessionApi';

const STATUS_INFO = {
  new:       { label: 'Order Received', emoji: '📥', color: 'bg-blue-50   dark:bg-blue-900/20   text-blue-600   dark:text-blue-400'   },
  preparing: { label: 'Being Prepared', emoji: '👨‍🍳', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
  ready:     { label: 'Ready!',          emoji: '🔔', color: 'bg-green-50  dark:bg-green-900/20  text-green-600  dark:text-green-400'  },
  completed: { label: 'Delivered',       emoji: '✅', color: 'bg-gray-100  dark:bg-gray-800      text-gray-500   dark:text-gray-400'   },
};

const PAYMENT_ICONS  = { cash: '💵', upi: '📱', card: '💳', other: '🔄' };
const PAYMENT_LABELS = { cash: 'Cash', upi: 'UPI / GPay', card: 'Card', other: 'Other' };

export default function OrderTrackerPage() {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();

  const [session,         setSession]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [billRequested,   setBillRequested]   = useState(false);
  const [requesting,      setRequesting]      = useState(false);
  const [lastUpdated,     setLastUpdated]     = useState(null);
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(
    () => localStorage.getItem(`qrunch_payment_${restaurantId}_${tableId}`) || ''
  );
  const [restaurantSettings, setRestaurantSettings] = useState(null);

  const currency = restaurantSettings?.region === 'usa' ? '$' : '₹';

  // ── GST for display on tracker ────────────────────────────
  const gst        = restaurantSettings?.gst;
  const gstEnabled = gst?.enabled && gst?.rate > 0;
  const gstRate    = gst?.rate || 0;
  const subtotal   = session?.totalAmount || 0;
  const gstAmount  = gstEnabled ? parseFloat((subtotal * gstRate / 100).toFixed(2)) : 0;
  const grandTotal = subtotal + gstAmount;

  const loadSession = useCallback(async () => {
    try {
      const s = await getActiveSession(restaurantId, tableId);
      if (s) {
        setSession(s);
        if (s.status === 'bill_requested') setBillRequested(true);
        setLastUpdated(new Date());
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [restaurantId, tableId]);

  useEffect(() => {
    loadSession();
    fetch(`/api/restaurants/${restaurantId}/public`)
      .then(r => r.json())
      .then(setRestaurantSettings)
      .catch(() => {});
    const interval = setInterval(loadSession, 10000);
    return () => clearInterval(interval);
  }, [loadSession]);

  const availablePayments = restaurantSettings?.paymentMethods
    ? Object.entries(restaurantSettings.paymentMethods).filter(([_, v]) => v).map(([k]) => k)
    : ['cash', 'upi'];

  const handleRequestBillClick = () => {
    if (availablePayments.length > 0) {
      setShowPayModal(true);
    } else {
      confirmRequestBill('');
    }
  };

  const confirmRequestBill = async (method) => {
    setShowPayModal(false);
    setRequesting(true);
    try {
      await requestBill(restaurantId, tableId, method);
      setBillRequested(true);
      if (method) localStorage.setItem(`qrunch_payment_${restaurantId}_${tableId}`, method);
    } catch (err) { console.error(err); }
    setRequesting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <span className="text-4xl animate-pulse">🍽️</span>
        <p className="text-gray-400 text-sm mt-2">Loading your order...</p>
      </div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl mb-4">🍽️</span>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No active session</h2>
      <p className="text-gray-400 text-sm mb-6">Place an order to track it here</p>
      <button onClick={() => navigate(`/order/${restaurantId}/${tableId}/menu`)}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition">
        Browse Menu
      </button>
    </div>
  );

  const orders = session.orders || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">🍽️ Your Orders</h1>
            <p className="text-xs text-gray-400 mt-0.5">Table {session.tableNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <p className="text-xs text-gray-400 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
              ${session.status === 'bill_requested'
                ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600'
                : 'bg-green-100 dark:bg-green-900/20 text-green-600'}`}>
              {session.status === 'bill_requested' ? '🔔 Bill Requested' : '🟢 Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-4">

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-4xl block mb-3">🍴</span>
            <p className="text-sm">No orders placed yet</p>
          </div>
        ) : orders.map((order, oi) => {
          const info = STATUS_INFO[order.status] || STATUS_INFO.new;
          return (
            <div key={order._id || oi} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Order {oi + 1}
                  <span className="ml-2 text-xs text-gray-300 dark:text-gray-600">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${info.color}`}>
                  {info.emoji} {info.label}
                </span>
              </div>
              <div className="px-4 py-3">
                {(order.items || []).map((item, i) => {
                  const qty = item.quantity || item.qty || 1;
                  return (
                    <div key={i} className="flex justify-between text-sm py-1 text-gray-700 dark:text-gray-300">
                      <span>{item.name} <span className="text-orange-500 font-medium">×{qty}</span></span>
                      <span className="text-gray-400">{currency}{((item.price || 0) * qty).toFixed(2)}</span>
                    </div>
                  );
                })}
                {/* Progress bar */}
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-50 dark:border-gray-800">
                  {['new','preparing','ready','completed'].map((s, i) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`h-1.5 flex-1 rounded-full transition-all ${
                        ['new','preparing','ready','completed'].indexOf(order.status) >= i
                          ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-300 dark:text-gray-600 mt-1">
                  <span>Received</span><span>Preparing</span><span>Ready</span><span>Done</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Bill Summary with GST */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🧾 Bill Summary</p>

          <div className="flex justify-between text-sm text-gray-500 py-1">
            <span>Subtotal</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
          </div>

          {gstEnabled && (
            <>
              <div className="flex justify-between text-xs text-gray-400 py-0.5">
                <span>CGST ({gstRate / 2}%)</span>
                <span>{currency}{(gstAmount / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 py-0.5">
                <span>SGST ({gstRate / 2}%)</span>
                <span>{currency}{(gstAmount / 2).toFixed(2)}</span>
              </div>
              {gst.gstin && (
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">GSTIN: {gst.gstin}</p>
              )}
            </>
          )}

          <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
            <p className="font-bold text-gray-800 dark:text-gray-100">Total</p>
            <p className="text-2xl font-bold text-orange-500">{currency}{grandTotal.toFixed(2)}</p>
          </div>

          {/* Show selected payment method if bill requested */}
          {billRequested && session.paymentMethod && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
              <span>{PAYMENT_ICONS[session.paymentMethod]}</span>
              <span>Paying via {PAYMENT_LABELS[session.paymentMethod]}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              {orders.length} order{orders.length !== 1 ? 's' : ''} ·{' '}
              {(session.orders || []).flatMap(o => o.items || []).reduce((s, i) => s + (i.quantity || i.qty || 1), 0)} items
            </p>
          </div>
        </div>

        {/* Actions */}
        <button onClick={() => navigate(`/order/${restaurantId}/${tableId}/menu`)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition">
          + Order More
        </button>

        <button onClick={handleRequestBillClick} disabled={billRequested || requesting}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition
            ${billRequested
              ? 'bg-green-100 dark:bg-green-900/20 text-green-600 cursor-default'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          {billRequested ? '✅ Bill Requested' : requesting ? '...' : '🧾 Request Bill'}
        </button>

        <p className="text-center text-xs text-gray-300 dark:text-gray-700">Auto-refreshes every 10 seconds</p>
      </div>

      {/* ── Payment Method Modal ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">💳 How will you pay?</h3>
              <p className="text-xs text-gray-400 mt-1">Let the staff know your preferred payment method</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2">
              {availablePayments.map(method => (
                <button key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition
                    ${selectedPayment === method
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300 bg-gray-50 dark:bg-gray-800'}`}>
                  <span className="text-xl">{PAYMENT_ICONS[method]}</span>
                  <span>{PAYMENT_LABELS[method]}</span>
                  {method === 'upi' && <span className="text-xs ml-auto opacity-70">GPay, PhonePe, Paytm</span>}
                </button>
              ))}
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowPayModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button onClick={() => confirmRequestBill(selectedPayment)} disabled={!selectedPayment}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  Confirm & Request Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}