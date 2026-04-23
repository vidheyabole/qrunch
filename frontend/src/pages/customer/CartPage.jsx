import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { placeOrder } from '../../api/customerApi';

export default function CartPage() {
  const { restaurantId, tableId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t } = useTranslation();
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount } = useCart();

  const [customerName,  setCustomerName]  = useState(location.state?.customerName  || '');
  const [customerPhone, setCustomerPhone] = useState(location.state?.customerPhone || '');
  const [placing, setPlacing]             = useState(false);
  const currency = '₹';

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return toast.error(t('customer.emptyCart'));
    setPlacing(true);
    try {
      const order = await placeOrder({ restaurantId, tableId, items: cartItems, customerName, customerPhone });
      clearCart();
      navigate(`/order/${restaurantId}/${tableId}/confirmed/${order._id}`);
    } catch { toast.error('Failed to place order. Please try again.'); }
    finally { setPlacing(false); }
  };

  if (cartItems.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
      <span className="text-6xl">🛒</span>
      <p className="text-gray-500 text-lg font-medium">{t('customer.emptyCart')}</p>
      <button onClick={() => navigate(`/order/${restaurantId}/${tableId}/menu`, { state: location.state })}
        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
        {t('customer.browseMenu')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">{t('customer.yourCart')}</h1>
            <p className="text-xs text-gray-400">{totalItems} {t('customer.items')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-40">
        <div className="flex flex-col gap-3">
          {cartItems.map(item => {
            const modExtra  = (item.selectedModifiers || []).reduce((s, m) => s + (m.extraPrice || 0), 0);
            const itemTotal = (item.price + modExtra) * item.quantity;
            return (
              <div key={item.cartId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                    {item.selectedModifiers?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.selectedModifiers.map(m => `${m.groupName}: ${m.optionLabel}`).join(' · ')}</p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs text-orange-500 mt-0.5 italic">"{item.specialInstructions}"</p>
                    )}
                  </div>
                  <span className="font-bold text-orange-500 shrink-0">{currency}{itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-1.5">
                    <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white shadow text-gray-600 font-bold flex items-center justify-center text-sm">−</button>
                    <span className="font-bold text-gray-800 text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-white shadow text-gray-600 font-bold flex items-center justify-center text-sm">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.cartId)}
                    className="text-sm text-red-400 hover:text-red-600 transition">{t('customer.remove')}</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Customer details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-5">
          <h3 className="font-semibold text-gray-700 mb-3">
            {t('customer.yourDetails')} <span className="text-gray-400 font-normal text-sm">({t('customer.optional')})</span>
          </h3>
          <div className="flex flex-col gap-3">
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder={t('customer.yourName')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
              placeholder={t('customer.phoneNumber')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('customer.reorderNote')}</p>
        </div>

        {/* Bill summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-4">
          <h3 className="font-semibold text-gray-700 mb-3">{t('customer.billSummary')}</h3>
          {cartItems.map(item => {
            const modExtra = (item.selectedModifiers || []).reduce((s, m) => s + (m.extraPrice || 0), 0);
            return (
              <div key={item.cartId} className="flex justify-between text-sm text-gray-500 mb-1">
                <span>{item.name} × {item.quantity}</span>
                <span>{currency}{((item.price + modExtra) * item.quantity).toFixed(2)}</span>
              </div>
            );
          })}
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-800">
            <span>{t('customer.total')}</span>
            <span className="text-orange-500">{currency}{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-10">
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