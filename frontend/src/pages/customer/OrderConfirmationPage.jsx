import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function OrderConfirmationPage() {
  const { restaurantId, tableId, orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => setCount(c => c - 1), 1000);
    const timeout  = setTimeout(() => navigate(`/order/${restaurantId}/${tableId}`), 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-white rounded-3xl shadow-md p-8 w-full max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{t('customer.orderPlaced')}</h1>
        <p className="text-gray-400 text-sm mt-2">{t('customer.orderSentKitchen')}</p>

        <div className="bg-orange-50 rounded-2xl p-4 mt-5 text-left">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{t('customer.orderId')}</p>
          <p className="text-xs text-gray-500 font-mono break-all">{orderId}</p>
        </div>

        <button onClick={() => navigate(`/order/${restaurantId}/${tableId}`)}
          className="w-full mt-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition">
          {t('customer.orderMore')}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          {t('customer.returnMenu')} {count}s...
        </p>
      </div>
    </div>
  );
}