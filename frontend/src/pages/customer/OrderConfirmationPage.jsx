import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FeedbackForm from '../../components/common/FeedbackForm';

export default function OrderConfirmationPage() {
  const { restaurantId, tableId, orderId } = useParams();
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const [showFeedback, setShowFeedback] = useState(false);

  const restaurantName = localStorage.getItem(`qrunch_restaurant_${restaurantId}`) || '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('customer.orderPlaced')}</h1>
          <p className="text-gray-400 text-sm mt-2">{t('customer.orderSentKitchen')}</p>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 mt-5 text-left">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{t('customer.orderId')}</p>
            <p className="text-xs text-gray-500 font-mono break-all">{orderId}</p>
          </div>
        </div>

        <button onClick={() => navigate(`/order/${restaurantId}/${tableId}/menu`)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition mb-3">
          {t('customer.orderMore')}
        </button>

        {/* ── Track Order button ── */}
        <button onClick={() => navigate(`/order/${restaurantId}/${tableId}/track`)}
          className="w-full border border-orange-200 dark:border-orange-800 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-semibold py-3 rounded-xl transition text-sm mb-3">
          📍 Track My Order
        </button>

        {!showFeedback ? (
          <button onClick={() => setShowFeedback(true)}
            className="w-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 py-3 rounded-xl text-sm transition">
            💬 Leave Feedback
          </button>
        ) : (
          <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-5">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">How was your experience?</h3>
            <FeedbackForm senderType="customer" restaurantName={restaurantName} compact={true} onSuccess={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}