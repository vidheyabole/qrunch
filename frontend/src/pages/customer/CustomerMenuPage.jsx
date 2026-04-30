import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { getPublicMenu, getRecommendations } from '../../api/customerApi';
import LanguageSelector from '../../components/common/LanguageSelector';
import { requestBill } from '../../api/sessionApi';
import { useTheme } from '../../hooks/useTheme';

export default function CustomerMenuPage() {
  const { restaurantId, tableId } = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { t, i18n } = useTranslation();
  const { cartItems, addToCart } = useCart();
  const { dark, toggleTheme } = useTheme();

  const [restaurant,   setRestaurant]   = useState(null);
  const [categories,   setCategories]   = useState([]);
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lang,         setLang]         = useState(localStorage.getItem('qrunch_ui_lang') || 'en');
  const [activeTab,    setActiveTab]    = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty,          setQty]          = useState(1);
  const [selectedMods, setSelectedMods] = useState({});
  const [specialNote,  setSpecialNote]  = useState('');
  const [recs,         setRecs]         = useState([]);
  const [billRequested,setBillRequested]= useState(false);
  const [requesting,   setRequesting]   = useState(false);

  const customerName = location.state?.name || '';
  const currency     = restaurant?.region === 'india' ? '₹' : '$';

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicMenu(restaurantId, tableId, lang);
      setRestaurant(data.restaurant);
      setCategories(data.categories);
      setItems(data.items);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [restaurantId, tableId, lang]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  useEffect(() => {
    if (!selectedItem) { setRecs([]); return; }
    getRecommendations(restaurantId, [selectedItem._id], lang)
      .then(setRecs).catch(() => setRecs([]));
    setQty(1); setSelectedMods({}); setSpecialNote('');
  }, [selectedItem, restaurantId, lang]);

  const visibleItems = activeTab === 'all'
    ? items
    : activeTab === 'foryou'
      ? items.filter(i => i.dietaryTags?.length > 0).slice(0, 6)
      : items.filter(i => i.category === activeTab || i.category?._id === activeTab);

  const getItemTotal = () => {
    const modTotal = Object.values(selectedMods).reduce((s, opt) => s + (opt?.extraPrice || 0), 0);
    return ((selectedItem?.price || 0) + modTotal) * qty;
  };

  const handleAddToCart = () => {
    const modList = Object.values(selectedMods).filter(Boolean);
    addToCart({ ...selectedItem, selectedMods: modList, specialNote, qty });
    setSelectedItem(null);
  };

  const handleRequestBill = async () => {
    setRequesting(true);
    try {
      await requestBill(restaurantId, tableId);
      setBillRequested(true);
    } catch (err) { console.error(err); }
    setRequesting(false);
  };

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <span className="text-4xl animate-pulse">🍽️</span>
        <p className="text-gray-400 text-sm mt-2">{t('common.loading')}</p>
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">{t('customer.noMenu')}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto gap-2">
          <div className="min-w-0">
            <h1 className="font-bold text-gray-800 dark:text-gray-100 text-base truncate">{restaurant.name}</h1>
            {customerName && <p className="text-xs text-gray-400">{t('customer.welcomeBack')}, {customerName}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark mode toggle */}
            <button onClick={toggleTheme}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-base">
              {dark ? '☀️' : '🌙'}
            </button>
            <LanguageSelector variant="compact" onSelect={(code) => { setLang(code); i18n.changeLanguage(code); }} />
            {/* Request Bill */}
            <button onClick={handleRequestBill} disabled={billRequested || requesting}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition
                ${billRequested
                  ? 'bg-green-100 text-green-600 cursor-default'
                  : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'}`}>
              {billRequested ? '✅ Bill Requested' : requesting ? '...' : '🧾 Request Bill'}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 max-w-2xl mx-auto scrollbar-hide">
          <button onClick={() => setActiveTab('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
              ${activeTab === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            All
          </button>
          <button onClick={() => setActiveTab('foryou')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
              ${activeTab === 'foryou' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            {t('customer.forYou')}
          </button>
          {categories.map(cat => (
            <button key={cat._id} onClick={() => setActiveTab(cat._id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition
                ${activeTab === cat._id ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      <div className="max-w-2xl mx-auto px-4 py-4 grid grid-cols-2 gap-3 pb-32">
        {visibleItems.map(item => (
          <button key={item._id} onClick={() => setSelectedItem(item)}
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 text-left active:scale-95 transition">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
            )}
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{item.name}</p>
              {item.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-orange-500">{currency}{item.price.toFixed(2)}</span>
                {item.dietaryTags?.length > 0 && (
                  <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                    {item.dietaryTags[0]}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-10">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(`/order/${restaurantId}/${tableId}/cart`)}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition flex items-center justify-between px-6 shadow-lg shadow-orange-100">
              <span className="bg-orange-600 rounded-xl px-2.5 py-0.5 text-sm">{cartCount}</span>
              <span>{t('customer.viewCart')}</span>
              <span>{currency}{cartItems.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Item modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-y-auto">
            {selectedItem.imageUrl && (
              <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-52 object-cover rounded-t-3xl" />
            )}
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedItem.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedItem.description}</p>
              <p className="text-lg font-bold text-orange-500 mt-2">{currency}{selectedItem.price.toFixed(2)}</p>

              {selectedItem.dietaryTags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedItem.dietaryTags.map(tag => (
                    <span key={tag} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {selectedItem.modifiers?.map((group, gi) => (
                <div key={gi} className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{group.groupName}</p>
                  <div className="flex flex-col gap-1.5">
                    {group.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl cursor-pointer">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        <div className="flex items-center gap-2">
                          {opt.extraPrice > 0 && <span className="text-xs text-orange-500">+{currency}{opt.extraPrice}</span>}
                          <input type="radio" name={`mod-${gi}`}
                            checked={selectedMods[gi]?.label === opt.label}
                            onChange={() => setSelectedMods(m => ({ ...m, [gi]: opt }))}
                            className="accent-orange-500" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('customer.specialInstructions')}</p>
                <textarea value={specialNote} onChange={e => setSpecialNote(e.target.value)}
                  rows={2} placeholder="e.g. No onions, extra spicy..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              {recs.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('customer.goesWith')}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {recs.map(rec => (
                      <button key={rec._id} onClick={() => setSelectedItem(rec)}
                        className="shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl p-2 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition w-28">
                        {rec.imageUrl && <img src={rec.imageUrl} alt={rec.name} className="w-full h-16 object-cover rounded-lg mb-1" />}
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">{rec.name}</p>
                        <p className="text-xs text-orange-500 font-bold">{currency}{rec.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-lg font-bold w-6 flex items-center justify-center">−</button>
                  <span className="text-sm font-bold w-5 text-center text-gray-800 dark:text-gray-100">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="text-lg font-bold w-6 flex items-center justify-center">+</button>
                </div>
                <button onClick={handleAddToCart}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold py-3 rounded-xl transition flex items-center justify-between px-4">
                  <span>{t('customer.addToCart')}</span>
                  <span>{currency}{getItemTotal().toFixed(2)}</span>
                </button>
              </div>

              <button onClick={() => setSelectedItem(null)}
                className="w-full mt-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}