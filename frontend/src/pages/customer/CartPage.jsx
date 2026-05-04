import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { placeOrder } from '../../api/customerApi';

const PAYMENT_ICONS = {
  cash:  '💵',
  upi:   '📱',
  card:  '💳',
  other: '🔄',
};

const PAYMENT_LABELS = {
  cash:  'Cash',
  upi:   'UPI / GPay',
  card:  'Card',
  other: 'Other',
};

export default function CartPage() {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const { cartItems, removeFromCart, clearCart } = useCart();

  const saved = (() => { try { return JSON.parse(localStorage.getItem('qrunch_customer') || '{}'); } catch { return {}; } })();
  const [name,    setName]    = useState(saved.name  || '');
  const [phone,   setPhone]   = useState(saved.phone || '');
  const [placing, setPlacing] = useState(false);

  // ── Restaurant settings (GST + payment methods) ──────────
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [selectedPayment,    setSelectedPayment]    = useState('');

  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}/public`)
      .then(r => r.json())
      .then(data => {
        setRestaurantSettings(data);
        // Pre-select first available payment method
        const methods = data?.paymentMethods || {};
        const first = ['upi','cash','card','other'].find(m => methods[m]);
        if (first) setSelectedPayment(first);
      })
      .catch(() => {});
  }, [restaurantId]);

  const currency = restaurantSettings?.region === 'usa' ? '$' : '₹';

  // ── GST calculations ─────────────────────────────────────
  const gst         = restaurantSettings?.gst;
  const gstEnabled  = gst?.enabled && gst?.rate > 0;
  const gstRate     = gst?.rate || 0;
  const subtotal    = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const gstAmount   = gstEnabled ? parseFloat((subtotal * gstRate / 100).toFixed(2)) : 0;
  const cgst        = gstEnabled ? parseFloat((gstAmount / 2).toFixed(2)) : 0;
  const sgst        = gstEnabled ? parseFloat((gstAmount / 2).toFixed(2)) : 0;
  const totalAmount = subtotal + gstAmount;

  // Available payment methods configured by owner
  const availablePayments = restaurantSettings?.paymentMethods
    ? Object.entries(restaurantSettings.paymentMethods).filter(([_, v]) => v).map(([k]) => k)
    : ['cash', 'upi'];

  const handlePlaceOrder = async () => {
    if (!cartItems.length) return;
    setPlacing(true);
    try {
      const items = cartItems.map(i => ({
        menuItem:     i._id,
        name:         i.name,
        price:        i.price,
        qty:          i.qty,
        selectedMods: i.selectedMods || [],
        specialNote:  i.specialNote  || ''
      }));

      // Store payment preference for later (used when requesting bill)
      if (selectedPayment) {
        localStorage.setItem(`qrunch_payment_${restaurantId}_${tableId}`, selectedPayment);
      }

      const order = await placeOrder(restaurantId, tableId, {
        items,
        customerName:  name,
        customerPhone: phone,
        totalAmount:   subtotal,  // store pre-tax amount on order
        gstAmount,
        gstRate,
      });
      localStorage.setItem('qrunch_customer', JSON.stringify({ name, phone }));
      clearCart();
      navigate(`/order/${restaurantId}/${tableId}/confirmed/${order._id}`);
    } catch (err) {
      console.error(err);
      setPlacing(false);
    }
  };

  if (!cartItems.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 text-center">
      <span className="text-5xl mb-4">🛒</span>
      <p className="text-gray-500 mb-6">{t('customer.emptyCart')}</p>
      <button onClick={() => navigate(-1)}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-2xl transition">
        {t('customer.browseMenu')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-36">
      <div className="max-w-2xl mx-auto px-4 py-5">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {t('customer.yourCart')} · {cartItems.length} {t('customer.items')}
        </h1>

        {/* Cart items */}
        <div className="flex flex-col gap-3">
          {cartItems.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-xl shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                {item.selectedMods?.length > 0 && (
                  <p className="text-xs text-gray-400">{item.selectedMods.map(m => m.label).join(', ')}</p>
                )}
                {item.specialNote && (
                  <p className="text-xs text-gray-400 italic">"{item.specialNote}"</p>
                )}
                <p className="text-sm text-orange-500 font-bold mt-0.5">{currency}{(item.price * item.qty).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-400">×{item.qty}</span>
                <button onClick={() => removeFromCart(idx)}
                  className="text-xs text-red-400 hover:text-red-600 transition">
                  {t('customer.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Customer details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mt-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('customer.yourDetails')}</p>
          <p className="text-xs text-gray-400 mb-3">{t('customer.reorderNote')}</p>
          <div className="flex flex-col gap-2">
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder={`${t('customer.yourName')} (${t('customer.optional')})`}
              className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder={`${t('customer.phoneNumber')} (${t('customer.optional')})`}
              className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>

        {/* Payment method selection */}
        {availablePayments.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mt-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">💳 How will you pay?</p>
            <div className="grid grid-cols-2 gap-2">
              {availablePayments.map(method => (
                <button key={method} type="button"
                  onClick={() => setSelectedPayment(method)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition
                    ${selectedPayment === method
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300 bg-gray-50 dark:bg-gray-800'}`}>
                  <span>{PAYMENT_ICONS[method]}</span>
                  <span>{PAYMENT_LABELS[method]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">You can change this when requesting the bill</p>
          </div>
        )}

        {/* Bill summary */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mt-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('customer.billSummary')}</p>
          {cartItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm text-gray-500 py-1">
              <span>{item.name} ×{item.qty}</span>
              <span>{currency}{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}

          <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
            {/* Subtotal */}
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 py-1">
              <span>Subtotal</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>

            {/* GST breakdown */}
            {gstEnabled && (
              <>
                <div className="flex justify-between text-sm text-gray-400 py-0.5">
                  <span>CGST ({gstRate / 2}%)</span>
                  <span>{currency}{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 py-0.5">
                  <span>SGST ({gstRate / 2}%)</span>
                  <span>{currency}{sgst.toFixed(2)}</span>
                </div>
                {gst.gstin && (
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">GSTIN: {gst.gstin}</p>
                )}
              </>
            )}

            {/* Total */}
            <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
              <span>{t('customer.total')}</span>
              <span className="text-orange-500">{currency}{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Place Order */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-4 z-10">
        <div className="max-w-2xl mx-auto">
          <button onClick={handlePlaceOrder} disabled={placing}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 active:scale-95 text-white font-bold py-4 rounded-2xl transition flex items-center justify-between px-6 shadow-lg shadow-orange-100">
            <span>{placing ? t('customer.placing') : t('customer.placeOrder')}</span>
            <span>{currency}{totalAmount.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}