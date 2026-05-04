import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const DIETARY_OPTIONS = [
  'Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Spicy',
  'Contains Nuts', 'Egg-Free', 'Halal', 'Jain'
];

export default function MenuPage() {
  const { owner, currentRestaurant } = useAuth();
  const { t } = useTranslation();

  const restaurantId = currentRestaurant?._id;
  const currency = owner?.region === 'india' ? '₹' : '$';
  const getAuthHeader = () => ({ Authorization: `Bearer ${owner?.token}` });

  const [categories, setCategories] = useState([]);
  const [activecat, setActiveCat] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [dietaryTags, setDietaryTags] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImage, setExistingImage] = useState('');

  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [aiTagSuggestions, setAiTagSuggestions] = useState([]);

  const [ingredients, setIngredients] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');

  const loadCategories = useCallback(async () => {
    if (!restaurantId || !owner?.token) return;
    setLoading(true);
    const res = await fetch(`/api/menu/categories/${restaurantId}`, { headers: getAuthHeader() });
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    if (Array.isArray(data) && data.length && !activecat) setActiveCat(data[0]._id);
    setLoading(false);
  }, [restaurantId, owner?.token]);

  const loadItems = useCallback(async () => {
    if (!restaurantId || !owner?.token || categories.length === 0) return;
    const all = await Promise.all(
      categories.map(cat =>
        fetch(`/api/menu/items/${cat._id}`, { headers: getAuthHeader() }).then(r => r.json())
      )
    );
    setItems(all.flat());
  }, [restaurantId, owner?.token, categories]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadItems(); }, [loadItems]);

  const visibleItems = items.filter(i =>
    i.category === activecat || i.category?._id === activecat
  );

  const openAddCat = () => { setEditCat(null); setCatName(''); setShowCatModal(true); };
  const openEditCat = (cat) => { setEditCat(cat); setCatName(cat.name); setShowCatModal(true); };

  const saveCat = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSavingCat(true);
    const url = editCat ? `/api/menu/categories/${editCat._id}` : '/api/menu/categories';
    const method = editCat ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName, restaurantId })
    });
    setSavingCat(false);
    setShowCatModal(false);
    loadCategories();
  };

  const deleteCat = async (catId) => {
    if (!confirm('Delete category and all its items?')) return;
    await fetch(`/api/menu/categories/${catId}`, { method: 'DELETE', headers: getAuthHeader() });
    if (activecat === catId) setActiveCat(null);
    loadCategories();
    loadItems();
  };

  const resetForm = () => {
    setName(''); setDescription(''); setPrice('');
    setSelectedCatId(activecat || ''); setIsAvailable(true);
    setDietaryTags([]); setModifiers([]);
    setImageFile(null); setImagePreview(''); setExistingImage('');
    setAiTagSuggestions([]);
    setIngredients('');
setCustomTagInput('');
  };

  const openAdd = () => { resetForm(); setEditItem(null); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price.toString());
    setSelectedCatId(item.category?._id || item.category || '');
    setIsAvailable(item.isAvailable !== false);
    setDietaryTags(item.dietaryTags || []);
    setModifiers(item.modifiers || []);
    setImageFile(null);
    setImagePreview('');
    setExistingImage(item.imageUrl || '');
    setAiTagSuggestions([]);
    setShowModal(true);
    setIngredients((item.ingredients || []).join(', '));
setCustomTagInput('');
  };

  const toggleTag = (tag) => setDietaryTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const addGroup = () => setModifiers(m => [...m, { groupName: '', options: [{ label: '', extraPrice: 0 }] }]);
  const removeGroup = (gi) => setModifiers(m => m.filter((_, i) => i !== gi));
  const updateGroup = (gi, val) => setModifiers(m => m.map((g, i) => i === gi ? { ...g, groupName: val } : g));
  const addOption = (gi) => setModifiers(m => m.map((g, i) => i === gi ? { ...g, options: [...g.options, { label: '', extraPrice: 0 }] } : g));
  const removeOption = (gi, oi) => setModifiers(m => m.map((g, i) => i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g));
  const updateOption = (gi, oi, field, val) => setModifiers(m => m.map((g, i) =>
    i === gi ? { ...g, options: g.options.map((o, j) => j === oi ? { ...o, [field]: field === 'extraPrice' ? parseFloat(val) || 0 : val } : o) } : g
  ));

  const handleGenerateDesc = async () => {
    if (!name.trim()) return alert('Enter item name first');
    setGeneratingDesc(true);
    try {
      const res = await fetch('/api/ai/describe', { method: 'POST', headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ itemName: name, restaurantId }) });
      const data = await res.json();
      setDescription(data.description || '');
    } catch { /* silent */ }
    setGeneratingDesc(false);
  };

  const handleSuggestTags = async () => {
    if (!name.trim()) return alert('Enter item name first');
    setGeneratingTags(true);
    setAiTagSuggestions([]);
    try {
      const res = await fetch('/api/ai/suggest-tags', { method: 'POST', headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ itemName: name, description }) });
      const data = await res.json();
      const suggested = data.tags || [];
      setAiTagSuggestions(suggested);
      setDietaryTags(prev => [...new Set([...prev, ...suggested])]);
    } catch { /* silent */ }
    setGeneratingTags(false);
  };

  const handleGenerateImage = async () => {
    if (!name.trim()) return alert('Enter item name first');
    setGeneratingImg(true);
    try {
      const res = await fetch('/api/images/generate', { method: 'POST', headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }, body: JSON.stringify({ dishName: name, description, restaurantId }) });
      const data = await res.json();
      if (data.imageUrl) { setExistingImage(data.imageUrl); setImagePreview(data.imageUrl); setImageFile(null); }
    } catch { /* silent */ }
    setGeneratingImg(false);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !selectedCatId) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('categoryId', selectedCatId);
    formData.append('restaurantId', restaurantId);
    formData.append('isAvailable', isAvailable);
    formData.append('dietaryTags', JSON.stringify(dietaryTags));
    formData.append('modifiers', JSON.stringify(modifiers));
    formData.append('ingredients', JSON.stringify(
  ingredients.split(',').map(s => s.trim()).filter(Boolean)
));
    if (imageFile) formData.append('image', imageFile);
    if (!imageFile && existingImage) formData.append('generatedImageUrl', existingImage);
    const url = editItem ? `/api/menu/items/${editItem._id}` : '/api/menu/items';
    const method = editItem ? 'PUT' : 'POST';
    await fetch(url, { method, headers: getAuthHeader(), body: formData });
    setSaving(false);
    setShowModal(false);
    loadItems();
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/menu/items/${itemId}`, { method: 'DELETE', headers: getAuthHeader() });
    loadItems();
  };

  // ── #14: Confirmation added ──────────────────────────────────
  const toggleAvailability = async (item) => {
    const action = item.isAvailable ? 'mark as unavailable' : 'mark as available';
    if (!confirm(`Are you sure you want to ${action} "${item.name}"?`)) return;
    setItems(prev => prev.map(i =>
      i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i
    ));
    await fetch(`/api/menu/items/${item._id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeader()
    });
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('menu.title')}</h1>
        {activecat && (
          <button onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
            {t('menu.addItem')}
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Categories ── */}
        <div className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
          <div className="p-3">
            <button onClick={openAddCat}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition">
              + {t('menu.addCategory')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-center px-3">
                <span className="text-2xl mb-2">📂</span>
                <p className="text-xs">{t('menu.noCategories')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {categories.map(cat => (
                  <div key={cat._id}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition
                      ${activecat === cat._id
                        ? 'bg-orange-500 text-white font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={() => setActiveCat(cat._id)}>
                    <span className="truncate">{cat.name}</span>
                    <div className={`hidden group-hover:flex gap-1 ${activecat === cat._id ? 'text-white' : ''}`}>
                      <button onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}
                        className={`hover:opacity-70 transition text-xs px-1 ${activecat === cat._id ? 'text-white' : 'text-gray-400 hover:text-blue-500'}`}>✎</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteCat(cat._id); }}
                        className={`hover:opacity-70 transition text-xs px-1 ${activecat === cat._id ? 'text-white' : 'text-gray-400 hover:text-red-500'}`}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Items ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !activecat ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-5xl mb-3">🍽️</span>
              <p className="text-sm font-medium">{t('menu.startWithCategory')}</p>
              <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">Add a category on the left to get started</p>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              {visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                  <span className="text-4xl mb-3">🍴</span>
                  <p className="text-sm font-medium">{t('menu.noItems')}</p>
                  <button onClick={openAdd}
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition">
                    {t('menu.addItem')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleItems.map(item => (
                    <div key={item._id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-36 object-cover" />
                      ) : (
                        <div className="w-full h-36 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <span className="text-3xl">🍽️</span>
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-bold text-orange-500 shrink-0">{currency}{item.price.toFixed(2)}</span>
                        </div>
                        {item.dietaryTags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.dietaryTags.map(tag => (
                              <span key={tag} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800">
                          <button onClick={() => toggleAvailability(item)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full transition
                              ${item.isAvailable
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'}`}>
                            {item.isAvailable ? t('common.available') : t('common.unavailable')}
                          </button>
                          <div className="flex gap-3">
                            <button onClick={() => openEdit(item)}
                              className="text-xs text-blue-500 hover:text-blue-700 transition font-medium">{t('common.edit')}</button>
                            <button onClick={() => deleteItem(item._id)}
                              className="text-xs text-red-400 hover:text-red-600 transition font-medium">{t('common.delete')}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Category Modal ── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              {editCat ? t('menu.editCategory') : t('menu.addCategory')}
            </h3>
            <form onSubmit={saveCat} className="flex flex-col gap-4">
              <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
                placeholder={t('menu.categoryPlaceholder')} autoFocus
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCatModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={savingCat}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {savingCat ? t('common.loading') : editCat ? t('common.update') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Item Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {editItem ? t('menu.editItem') : t('menu.addItem')}
              </h3>
            </div>
            <form onSubmit={saveItem} className="px-6 py-5 flex flex-col gap-5">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{t('menu.selectCategory')} *</label>
                <select value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} required
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">— {t('menu.selectCategory')} —</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{t('menu.itemName')} *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder={t('menu.itemNamePlaceholder')}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('menu.description')}</label>
                  <button type="button" onClick={handleGenerateDesc} disabled={generatingDesc}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 transition">
                    {generatingDesc ? `⏳ ${t('menu.generatingDesc')}` : `✨ ${t('menu.generateDesc')}`}
                  </button>
                </div>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} placeholder={t('menu.descPlaceholder')}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{t('menu.price')} ({currency}) *</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  min="0" step="0.01" required placeholder="0.00"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('menu.photo')}</label>
                  <button type="button" onClick={handleGenerateImage} disabled={generatingImg}
                    className="text-xs text-purple-500 hover:text-purple-600 font-medium disabled:opacity-50 transition">
                    {generatingImg ? `⏳ ${t('menu.generatingImage')}` : `🎨 ${t('menu.generateImage')}`}
                  </button>
                </div>
                {generatingImg && <p className="text-xs text-gray-400 mb-1.5">{t('menu.imageNote')}</p>}
                <label className="flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl h-24 cursor-pointer hover:border-orange-300 transition overflow-hidden">
                  {(imagePreview || existingImage) ? (
                    <img src={imagePreview || existingImage} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">{t('menu.uploadPhoto')}</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setImageFile(f);
                    setImagePreview(URL.createObjectURL(f));
                    setExistingImage('');
                  }} />
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('menu.dietaryTags')}</label>
                  <button type="button" onClick={handleSuggestTags} disabled={generatingTags}
                    className="text-xs text-green-500 hover:text-green-600 font-medium disabled:opacity-50 transition">
                    {generatingTags ? `⏳ ${t('menu.suggestingTags')}` : `✨ ${t('menu.suggestTags')}`}
                  </button>
                </div>
                {aiTagSuggestions.length > 0 && (
                  <p className="text-xs text-green-500 mb-1.5">{t('menu.aiSuggestedTags')} — {t('menu.canDeselect')}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition
                        ${dietaryTags.includes(tag)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-400'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
                {/* ── Custom tag input (#2) ── */}
                <div className="flex gap-2 mt-2">
                  <input type="text" value={customTagInput} onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const tag = customTagInput.trim();
                        if (tag && !dietaryTags.includes(tag)) setDietaryTags(prev => [...prev, tag]);
                        setCustomTagInput('');
                      }
                    }}
                    placeholder="Add custom tag… (press Enter)"
                    className="flex-1 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <button type="button"
                    onClick={() => {
                      const tag = customTagInput.trim();
                      if (tag && !dietaryTags.includes(tag)) setDietaryTags(prev => [...prev, tag]);
                      setCustomTagInput('');
                    }}
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl transition font-medium">
                    + Add
                  </button>
                </div>
                {/* Custom tags (not in default list) */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {dietaryTags.filter(t => !DIETARY_OPTIONS.includes(t)).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
                      {tag}
                      <button type="button" onClick={() => setDietaryTags(prev => prev.filter(t => t !== tag))} className="hover:text-red-500 transition">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Ingredients (#4) ── */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  Ingredients
                  <span className="text-xs text-gray-400 ml-1">(optional, comma-separated)</span>
                </label>
                <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
                  rows={2} placeholder="e.g. Paneer, Tomato, Onion, Spices..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                <p className="text-xs text-gray-400 mt-1">Customers can view this on the menu</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('menu.modifiers')}</label>
                  <button type="button" onClick={addGroup}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium transition">
                    {t('menu.addGroup')}
                  </button>
                </div>
                {modifiers.map((group, gi) => (
                  <div key={gi} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="text" value={group.groupName} onChange={e => updateGroup(gi, e.target.value)}
                        placeholder={t('menu.groupName')}
                        className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      <button type="button" onClick={() => removeGroup(gi)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                    </div>
                    {group.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2 mb-1.5">
                        <input type="text" value={opt.label} onChange={e => updateOption(gi, oi, 'label', e.target.value)}
                          placeholder={t('menu.optionLabel')}
                          className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none" />
                        <input type="number" value={opt.extraPrice} onChange={e => updateOption(gi, oi, 'extraPrice', e.target.value)}
                          placeholder={t('menu.extraPrice')} min="0" step="0.5"
                          className="w-20 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                        <button type="button" onClick={() => removeOption(gi, oi)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(gi)}
                      className="text-xs text-orange-500 hover:text-orange-600 mt-1 transition">
                      {t('menu.addOption')}
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.available')}</span>
                <div onClick={() => setIsAvailable(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isAvailable ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-3 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl text-sm transition">
                  {saving ? t('common.loading') : editItem ? t('common.update') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}