import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import LanguageSelector from '../../components/common/LanguageSelector';

export default function CustomerLandingPage() {
  const { restaurantId, tableId } = useParams();
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();
  const { dark, toggleTheme } = useTheme();

  const saved = (() => { try { return JSON.parse(localStorage.getItem('qrunch_customer') || '{}'); } catch { return {}; } })();

  const [name,  setName]  = useState(saved.name  || '');
  const [phone, setPhone] = useState(saved.phone || '');
  const [step,  setStep]  = useState('lang');

  const proceed = (skip = false) => {
    if (!skip) localStorage.setItem('qrunch_customer', JSON.stringify({ name, phone }));
    navigate(`/order/${restaurantId}/${tableId}/menu`, { state: { name, phone, lang: i18n.language } });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Dark mode toggle — top right */}
      <div className="fixed top-4 right-4">
        <button onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-base border border-gray-100 dark:border-gray-700 transition">
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-4xl">🍽️</span>
          <p className="text-xs text-gray-400 mt-1">{t('customer.poweredBy')}</p>
        </div>

        {step === 'lang' ? (
          <>
            <h2 className="text-center text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
              {t('customer.selectLang')}
            </h2>
            <LanguageSelector variant="grid" />
            <button onClick={() => setStep('details')}
              className="mt-5 w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3 rounded-2xl transition">
              {t('customer.continueMenu')}
            </button>
          </>
        ) : (
          <>
            {saved.name ? (
              <p className="text-center text-sm text-gray-500 mb-4">
                {t('customer.welcomeBack')}, <strong className="text-gray-800 dark:text-gray-100">{saved.name}</strong> 👋
              </p>
            ) : (
              <p className="text-center text-sm text-gray-500 mb-4">
                {t('customer.optionalDetails')}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder={`${t('customer.yourName')} (${t('customer.optional')})`}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder={`${t('customer.phoneNumber')} (${t('customer.optional')})`}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <button onClick={() => proceed(false)}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3 rounded-2xl transition">
              {t('customer.enterDetails')}
            </button>
            <button onClick={() => proceed(true)}
              className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600 transition py-2">
              {t('customer.skipBrowse')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}