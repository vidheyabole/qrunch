import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getRestaurantInfo, getPublicMenu, getRecommendations } from '../../api/customerApi';
import { getUpsells } from '../../api/aiApi';
import { useCart } from '../../context/CartContext';
import LanguageSelector from '../../components/common/LanguageSelector';
import i18n from '../../i18n';

const DIETARY_COLORS = {
  'Vegan':       'bg-green-100 text-green-700',
  'Vegetarian':  'bg-lime-100 text-lime-700',
  'Gluten-Free': 'bg-yellow-100 text-yellow-700',
  'Spicy':       'bg-red-100 text-red-700',
  'Halal':       'bg-teal-100 text-teal-700',
  'Jain':        'bg-orange-100 text-orange-700',
};

export default function CustomerMenuPage() {
  const { restaurantId, tableId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t } = useTranslation();
  const { addToCart, totalItems, totalAmount } = useCart();

  const customerName  = location.state?.customerName  || '';
  const customerPhone = location.state?.customerPhone || '';
  const initLang      = location.state?.lang || 'en';

  const [info, setInfo]                 = useState(null);
  const [menu, setMenu]                 = useState([]);
  const [recommendations, setRecs]      = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState(-1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity]         = useState(1);
  const [modifiers, setModifiers]       = useState({});
  const [instructions, setInstructions] = useState('');
  const [upsells, setUpsells]           = useState([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);
  const [lang, setLang]                 = useState(initLang);
  const [translating, setTranslating]   = useState(false);
  const currency = '₹';

  const loadMenu = async (language) => {
    setTranslating(true);
    try {
      const [infoData, menuData, recsData] = await Promise.all([
        getRestaurantInfo(restaurantId, tableId),
        getPublicMenu(restaurantId, language),
        getRecommendations(restaurantId, customerPhone, language)
      ]);
      setInfo(infoData);
      setMenu(menuData);
      setRecs(recsData);
      setActiveTab(recsData.length > 0 ? -1 : 0);
    } catch {
      toast.error('Could not load menu. Please try again.');
    } finally { setLoading(false); setTranslating(false); }
  };

  useEffect(() => { loadMenu(lang); }, [restaurantId, tableId]);

  const handleLangChange = (code) => {
    setLang(code);
    i18n.changeLanguage(code);
    loadMenu(code);
  };

  const openItem = async (item) => {
    setSelectedItem(item);
    setQuantity(1); setModifiers({}); setInstructions(''); setUpsells([]);
    setLoadingUpsells(true);
    try {
      const { items } = await getUpsells(item.name, restaurantId);
      setUpsells(items || []);
    } catch { /* silent */ }
    finally { setLoadingUpsells(false); }
  };

  const handleModifierSelect = (groupName, option) =>
    setModifiers(prev => ({ ...prev, [groupName]: option }));

  const getItemTotal = () => {
    if (!selectedItem) return 0;
    const modExtra = Object.values(modifiers).reduce((s, o) => s + (o.extraPrice || 0), 0);
    return (selectedItem.price + modExtra) * quantity;
  };

  const handleAddToCart = () => {
    const selectedMods = Object.entries(modifiers).map(([groupName, option]) => ({
      groupName, optionLabel: option.label, extraPrice: option.extraPrice || 0
    }));
    addToCart({ menuItemId: selectedItem._id, name: selectedItem.name, price: selectedItem.price, quantity, selectedModifiers: selectedMods, specialInstructions: instructions.trim() });
    toast.success(`${selectedItem.name} added!`);
    setSelectedItem(null);
  };

  const activeItems = activeTab === -1 ? recommendations : (menu[activeTab]?.items || []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-orange-500 text-white px-4 pt-5 pb-4 sticky top-0 z-20 shadow">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-xs font-medium uppercase tracking-wide">QRunch</p>
              <h1 className="text-xl font-bold mt-0.5">{info?.restaurant?.name}</h1>
              <p className="text-orange-100 text-sm mt-0.5">
                Table {info?.table?.tableNumber}
                {info?.table?.tableName ? ` — ${info.table.tableName}` : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {customerName && (
                <p className="text-white text-sm font-semibold">{customerName} 👋</p>
              )}
              <LanguageSelector variant="compact" selectedLang={lang} onSelect={handleLangChange} />
            </div>
          </div>
        </div>

        {/* Translating indicator */}
        {translating && (
          <div className="max-w-2xl mx-auto mt-2">
            <p className="text-orange-200 text-xs flex items-center gap-1">
              <span className="animate-spin">⏳</span> Translating menu...
            </p>
          </div>
        )}

        {/* Category Tabs */}
        <div className="max-w-2xl mx-auto mt-3 -mb-4 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {recommendations.length > 0 && (
            <button onClick={() => setActiveTab(-1)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === -1 ? 'bg-white text-orange-600' : 'bg-orange-400/50 text-white'}`}>
              ⭐ {t('customer.forYou')}
            </button>
          )}
          {menu.map((cat, i) => (
            <button key={cat._id} onClick={() => setActiveTab(i)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === i ? 'bg-white text-orange-600' : 'bg-orange-400/50 text-white'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        {activeItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm">No items here yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeItems.map(item => (
              <div key={item._id} onClick={() => openItem(item)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex cursor-pointer hover:shadow-md transition active:scale-[0.98]">
                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  {item.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>}
                  {item.dietaryTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.dietaryTags.slice(0, 3).map(tag => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIETARY_COLORS[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-orange-500 font-bold mt-2">{currency}{item.price}</p>
                </div>
                <div className="w-28 h-28 shrink-0 bg-gray-100 m-3 rounded-xl overflow-hidden">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">🍽️</div>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-30">
          <button onClick={() => navigate(`/order/${restaurantId}/${tableId}/cart`, { state: { customerName, customerPhone, lang } })}
            className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-lg shadow-orange-200 transition">
            <span className="bg-orange-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{totalItems}</span>
            <span className="font-semibold">{t('customer.viewCart')}</span>
            <span className="font-bold">{currency}{totalAmount.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedItem.imageUrl && (
              <div className="h-52 bg-gray-100 overflow-hidden rounded-t-3xl">
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedItem.name}</h2>
                  {selectedItem.description && <p className="text-sm text-gray-500 mt-1">{selectedItem.description}</p>}
                </div>
                <span className="text-orange-500 font-bold text-lg shrink-0">{currency}{selectedItem.price}</span>
              </div>

              {selectedItem.dietaryTags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedItem.dietaryTags.map(tag => (
                    <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIETARY_COLORS[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                  ))}
                </div>
              )}

              {selectedItem.modifiers?.map(group => (
                <div key={group.groupName} className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{group.groupName}</p>
                  <div className="flex flex-col gap-2">
                    {group.options.map(opt => (
                      <button key={opt.label} type="button" onClick={() => handleModifierSelect(group.groupName, opt)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition text-sm ${
                          modifiers[group.groupName]?.label === opt.label ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-700'
                        }`}>
                        <span>{opt.label}</span>
                        {opt.extraPrice > 0 && <span className="text-gray-400">+{currency}{opt.extraPrice}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">{t('customer.specialInstructions')}</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. No onions, extra spicy..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>

              {/* Upsells */}
              {(loadingUpsells || upsells.length > 0) && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">{t('customer.goesWith')}</p>
                  {loadingUpsells ? (
                    <div className="flex gap-3">
                      {[1,2,3].map(i => <div key={i} className="w-24 h-28 bg-gray-100 rounded-xl animate-pulse shrink-0" />)}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {upsells.map(item => (
                        <div key={item._id} onClick={() => openItem(item)} className="shrink-0 w-28 cursor-pointer group">
                          <div className="w-28 h-20 bg-gray-100 rounded-xl overflow-hidden mb-1.5">
                            {item.imageUrl
                              ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🍽️</div>
                            }
                          </div>
                          <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.name}</p>
                          <p className="text-xs text-orange-500 font-bold mt-0.5">{currency}{item.price}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-5">
                <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white shadow text-gray-600 font-bold flex items-center justify-center">−</button>
                  <span className="font-bold text-gray-800 w-4 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-7 h-7 rounded-lg bg-white shadow text-gray-600 font-bold flex items-center justify-center">+</button>
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