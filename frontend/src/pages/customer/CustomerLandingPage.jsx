import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRestaurantInfo } from '../../api/customerApi';
import LanguageSelector from '../../components/common/LanguageSelector';
import i18n from '../../i18n';

export default function CustomerLandingPage() {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [info, setInfo]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [customerName, setCustomerName]     = useState('');
  const [customerPhone, setCustomerPhone]   = useState('');
  const [selectedLang, setSelectedLang]     = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    getRestaurantInfo(restaurantId, tableId)
      .then(setInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [restaurantId, tableId]);

  const handleLangSelect = (code) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    setShowLangPicker(false);
  };

  const goToMenu = (withInfo) => {
    navigate(`/order/${restaurantId}/${tableId}/menu`, {
      state: withInfo
        ? { customerName: customerName.trim(), customerPhone: customerPhone.trim(), lang: selectedLang }
        : { customerName: '', customerPhone: '', lang: selectedLang }
    });
  };

  const LANGS = [
    { code: 'en', native: 'English',    flag: '🇬🇧' },
    { code: 'hi', native: 'हिंदी',       flag: '🇮🇳' },
    { code: 'mr', native: 'मराठी',       flag: '🇮🇳' },
    { code: 'gu', native: 'ગુજરાતી',    flag: '🇮🇳' },
    { code: 'ta', native: 'தமிழ்',       flag: '🇮🇳' },
    { code: 'te', native: 'తెలుగు',      flag: '🇮🇳' },
    { code: 'ml', native: 'മലയാളം',     flag: '🇮🇳' },
    { code: 'kn', native: 'ಕನ್ನಡ',       flag: '🇮🇳' },
    { code: 'bn', native: 'বাংলা',       flag: '🇮🇳' },
    { code: 'pa', native: 'ਪੰਜਾਬੀ',     flag: '🇮🇳' },
    { code: 'es', native: 'Español',    flag: '🇪🇸' },
  ];
  const currentLang = LANGS.find(l => l.code === selectedLang) || LANGS[0];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{info?.restaurant?.name || 'Welcome!'}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Table {info?.table?.tableNumber}
            {info?.table?.tableName ? ` — ${info.table.tableName}` : ''}
          </p>
        </div>

        {/* Language picker toggle */}
        <div className="flex justify-center mb-4">
          <button onClick={() => setShowLangPicker(s => !s)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 hover:border-orange-400 transition">
            <span>{currentLang.flag}</span>
            <span>{currentLang.native}</span>
            <span className="text-gray-400">▼</span>
          </button>
        </div>

        {/* Language grid */}
        {showLangPicker && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-md">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('customer.selectLang')}</p>
            <div className="grid grid-cols-3 gap-2">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => handleLangSelect(l.code)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition ${
                    selectedLang === l.code
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}>
                  <span className="text-lg">{l.flag}</span>
                  <span className="text-xs font-medium text-gray-700 leading-tight text-center">{l.native}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-1">{t('customer.enterDetails')}</h2>
          <p className="text-sm text-gray-400 mb-5">{t('customer.optionalDetails')}</p>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {t('customer.yourName')} <span className="text-gray-300">({t('customer.optional')})</span>
              </label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {t('customer.phoneNumber')} <span className="text-gray-300">({t('customer.optional')})</span>
              </label>
              <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          <button onClick={() => goToMenu(true)}
            className="w-full mt-5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-xl transition shadow-md shadow-orange-100">
            {t('customer.continueMenu')} →
          </button>
          <button onClick={() => goToMenu(false)}
            className="w-full mt-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition">
            {t('customer.skipBrowse')}
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">{t('customer.poweredBy')}</p>
      </div>
    </div>
  );
}