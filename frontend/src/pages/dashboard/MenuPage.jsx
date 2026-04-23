import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  getCategories, addCategory, updateCategory, deleteCategory,
  getItems, addItem, updateItem, deleteItem, toggleItemAvailability
} from '../../api/menuApi';
import { generateDescription, suggestDietaryTags } from '../../api/aiApi';
import { generateDishImage } from '../../api/imageApi';

const DIETARY_TAGS = ['Vegan','Vegetarian','Gluten-Free','Dairy-Free','Spicy','Contains Nuts','Egg-Free','Halal','Jain'];
const INIT_ITEM = { name: '', description: '', price: '', dietaryTags: [], modifiers: [], isAvailable: true };

export default function MenuPage() {
  const { owner, currentRestaurant } = useAuth();
  const { t } = useTranslation();
  const currency = owner?.region === 'india' ? '₹' : '$';
  const token    = localStorage.getItem('qrunch_token');

  const [categories, setCategories]         = useState([]);
  const [selectedCat, setSelectedCat]       = useState(null);
  const [items, setItems]                   = useState([]);
  const [loadingCats, setLoadingCats]       = useState(true);
  const [loadingItems, setLoadingItems]     = useState(false);

  const [showCatModal, setShowCatModal]     = useState(false);
  const [editCat, setEditCat]               = useState(null);
  const [catName, setCatName]               = useState('');
  const [savingCat, setSavingCat]           = useState(false);

  const [showItemModal, setShowItemModal]   = useState(false);
  const [editItem, setEditItem]             = useState(null);
  const [itemForm, setItemForm]             = useState(INIT_ITEM);
  const [imagePreview, setImagePreview]     = useState('');
  const [imageFile, setImageFile]           = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [savingItem, setSavingItem]         = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingImg, setGeneratingImg]   = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [descError, setDescError]           = useState('');
  const [suggestedTags, setSuggestedTags]   = useState([]);

  useEffect(() => {
    if (!currentRestaurant?._id) return;
    setSelectedCat(null); setItems([]); setLoadingCats(true);
    getCategories(currentRestaurant._id, token)
      .then(data => { setCategories(data); if (data.length) setSelectedCat(data[0]); })
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoadingCats(false));
  }, [currentRestaurant?._id]);

  useEffect(() => {
    if (!selectedCat?._id) return;
    setLoadingItems(true);
    getItems(selectedCat._id, token)
      .then(setItems)
      .catch(() => toast.error('Failed to load items'))
      .finally(() => setLoadingItems(false));
  }, [selectedCat?._id]);

  const openAddCat  = () => { setEditCat(null); setCatName(''); setShowCatModal(true); };
  const openEditCat = (cat) => { setEditCat(cat); setCatName(cat.name); setShowCatModal(true); };

  const handleSaveCat = async e => {
    e.preventDefault();
    if (!catName.trim()) return toast.error('Category name is required');
    setSavingCat(true);
    try {
      if (editCat) {
        const updated = await updateCategory(editCat._id, catName.trim(), token);
        setCategories(prev => prev.map(c => c._id === updated._id ? updated : c));
        if (selectedCat?._id === updated._id) setSelectedCat(updated);
        toast.success('Category updated');
      } else {
        const newCat = await addCategory(currentRestaurant._id, catName.trim(), token);
        setCategories(prev => [...prev, newCat]);
        setSelectedCat(newCat);
        toast.success('Category added');
      }
      setShowCatModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally { setSavingCat(false); }
  };

  const handleDeleteCat = async (cat, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${cat.name}" and all its items?`)) return;
    try {
      await deleteCategory(cat._id, token);
      const rest = categories.filter(c => c._id !== cat._id);
      setCategories(rest);
      if (selectedCat?._id === cat._id) { setSelectedCat(rest[0] || null); setItems([]); }
      toast.success('Category deleted');
    } catch { toast.error('Failed to delete category'); }
  };

  const openAddItem = () => {
    setEditItem(null); setItemForm(INIT_ITEM);
    setImagePreview(''); setImageFile(null);
    setGeneratedImageUrl(''); setDescError(''); setSuggestedTags([]);
    setShowItemModal(true);
  };

  const openEditItem = (item) => {
    setEditItem(item);
    setItemForm({ name: item.name, description: item.description, price: item.price.toString(), dietaryTags: item.dietaryTags || [], modifiers: item.modifiers || [], isAvailable: item.isAvailable });
    setImagePreview(item.imageUrl || '');
    setImageFile(null); setGeneratedImageUrl(''); setDescError(''); setSuggestedTags([]);
    setShowItemModal(true);
  };

  const handleImageChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f); setImagePreview(URL.createObjectURL(f)); setGeneratedImageUrl('');
  };

  const handleGenerateDesc = async () => {
    if (!itemForm.name.trim()) return toast.error('Enter item name first');
    setGeneratingDesc(true); setDescError('');
    try {
      const { description } = await generateDescription(itemForm.name, token);
      setItemForm(f => ({ ...f, description }));
      toast.success('Description generated! ✨');
    } catch (err) {
      const code = err.response?.data?.code;
      const msg  = err.response?.data?.message || 'Failed to generate description';
      if (code === 'RATE_LIMIT')        setDescError('⏳ AI is busy — wait a moment and try again.');
      else if (code === 'SERVICE_DOWN') setDescError('🔴 AI service is temporarily down.');
      else                              setDescError('❌ ' + msg);
    } finally { setGeneratingDesc(false); }
  };

  const handleGenerateImage = async () => {
    if (!itemForm.name.trim()) return toast.error('Enter item name first');
    setGeneratingImg(true);
    try {
      const { imageUrl, fromCache } = await generateDishImage(itemForm.name, token);
      setGeneratedImageUrl(imageUrl); setImagePreview(imageUrl); setImageFile(null);
      toast.success(fromCache ? 'Image loaded from cache ⚡' : 'Image generated! 🎨');
    } catch {
      toast.error('Image generation timed out. Try again or upload your own photo.');
    } finally { setGeneratingImg(false); }
  };

  const handleSuggestTags = async () => {
    if (!itemForm.name.trim()) return toast.error('Enter item name first');
    setGeneratingTags(true);
    try {
      const { tags } = await suggestDietaryTags(itemForm.name, token);
      if (tags.length === 0) {
        toast('No specific dietary tags found for this dish.', { icon: 'ℹ️' });
      } else {
        setSuggestedTags(tags);
        setItemForm(f => ({ ...f, dietaryTags: [...new Set([...f.dietaryTags, ...tags])] }));
        toast.success(`${tags.length} tag${tags.length > 1 ? 's' : ''} suggested! ✨`);
      }
    } catch { toast.error('Failed to suggest tags'); }
    finally { setGeneratingTags(false); }
  };

  const toggleTag = tag =>
    setItemForm(f => ({
      ...f,
      dietaryTags: f.dietaryTags.includes(tag) ? f.dietaryTags.filter(t => t !== tag) : [...f.dietaryTags, tag]
    }));

  const addModGroup    = () => setItemForm(f => ({ ...f, modifiers: [...f.modifiers, { groupName: '', options: [{ label: '', extraPrice: 0 }] }] }));
  const removeModGroup = idx => setItemForm(f => ({ ...f, modifiers: f.modifiers.filter((_, i) => i !== idx) }));
  const updateModGroup = (idx, val) => setItemForm(f => { const m = [...f.modifiers]; m[idx] = { ...m[idx], groupName: val }; return { ...f, modifiers: m }; });
  const addModOption   = gIdx => setItemForm(f => { const m = [...f.modifiers]; m[gIdx] = { ...m[gIdx], options: [...m[gIdx].options, { label: '', extraPrice: 0 }] }; return { ...f, modifiers: m }; });
  const removeModOption= (gIdx, oIdx) => setItemForm(f => { const m = [...f.modifiers]; m[gIdx] = { ...m[gIdx], options: m[gIdx].options.filter((_, i) => i !== oIdx) }; return { ...f, modifiers: m }; });
  const updateModOption= (gIdx, oIdx, key, val) => setItemForm(f => { const m = [...f.modifiers]; const o = [...m[gIdx].options]; o[oIdx] = { ...o[oIdx], [key]: val }; m[gIdx] = { ...m[gIdx], options: o }; return { ...f, modifiers: m }; });

  const handleSaveItem = async e => {
    e.preventDefault();
    if (!itemForm.name.trim()) return toast.error('Item name is required');
    if (!itemForm.price || isNaN(Number(itemForm.price))) return toast.error('Valid price is required');
    setSavingItem(true);
    try {
      const fd = new FormData();
      fd.append('name', itemForm.name.trim()); fd.append('description', itemForm.description);
      fd.append('price', itemForm.price); fd.append('dietaryTags', JSON.stringify(itemForm.dietaryTags));
      fd.append('modifiers', JSON.stringify(itemForm.modifiers));
      fd.append('categoryId', selectedCat._id); fd.append('restaurantId', currentRestaurant._id);
      if (imageFile) fd.append('image', imageFile);
      if (!imageFile && generatedImageUrl) fd.append('generatedImageUrl', generatedImageUrl);
      if (editItem) {
        const updated = await updateItem(editItem._id, fd, token);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
        toast.success('Item updated');
      } else {
        const newItem = await addItem(fd, token);
        setItems(prev => [...prev, newItem]);
        toast.success('Item added');
      }
      setShowItemModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save item'); }
    finally { setSavingItem(false); }
  };

  const handleDeleteItem = async item => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try { await deleteItem(item._id, token); setItems(prev => prev.filter(i => i._id !== item._id)); toast.success('Item deleted'); }
    catch { toast.error('Failed to delete item'); }
  };

  const handleToggleItem = async item => {
    try {
      const updated = await toggleItemAvailability(item._id, token);
      setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
    } catch { toast.error('Failed to update availability'); }
  };

  if (!currentRestaurant) return (
    <div className="flex items-center justify-center h-64 text-gray-400">No restaurant selected</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('menu.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{currentRestaurant.name}</p>
      </div>

      {/* Mobile category dropdown */}
      <div className="md:hidden mb-3 flex gap-2">
        <select value={selectedCat?._id || ''} onChange={e => setSelectedCat(categories.find(c => c._id === e.target.value) || null)}
          className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="" disabled>{t('menu.selectCategory')}</option>
          {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>
        <button onClick={openAddCat} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2.5 rounded-lg transition shrink-0">+ {t('common.add')}</button>
        {selectedCat && <button onClick={() => openEditCat(selectedCat)} className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm px-3 py-2.5 rounded-lg transition shrink-0">✏️</button>}
        {selectedCat && <button onClick={e => handleDeleteCat(selectedCat, e)} className="border border-red-200 dark:border-red-900 text-red-400 text-sm px-3 py-2.5 rounded-lg transition shrink-0">🗑️</button>}
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Left — Categories (desktop) */}
        <div className="hidden md:flex w-52 shrink-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <button onClick={openAddCat} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition">
              + {t('menu.addCategory')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loadingCats ? <p className="text-center text-sm text-gray-400 py-6">{t('common.loading')}</p>
            : categories.length === 0 ? <p className="text-center text-sm text-gray-400 py-6">{t('menu.noCategories')}</p>
            : categories.map(cat => (
              <div key={cat._id} onClick={() => setSelectedCat(cat)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 cursor-pointer group transition
                  ${selectedCat?._id === cat._id ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <span className="text-sm font-medium truncate">{cat.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button onClick={e => { e.stopPropagation(); openEditCat(cat); }} className="text-xs hover:text-orange-500">✏️</button>
                  <button onClick={e => handleDeleteCat(cat, e)} className="text-xs hover:text-red-500">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Items */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {!selectedCat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
              <span className="text-5xl">🍽️</span>
              <p className="text-sm">{t('menu.startWithCategory')}</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">{selectedCat.name}</h2>
                <button onClick={openAddItem} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  {t('menu.addItem')}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loadingItems ? <p className="text-center text-sm text-gray-400 py-10">{t('common.loading')}</p>
                : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 gap-2">
                    <span className="text-5xl">🍴</span>
                    <p className="text-sm">{t('menu.noItems')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map(item => (
                      <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition">
                        <div className="h-36 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300 dark:text-gray-600">🍽️</div>}
                        </div>
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{item.name}</h3>
                              {item.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                              {item.dietaryTags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item.dietaryTags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">{tag}</span>
                                  ))}
                                  {item.dietaryTags.length > 2 && <span className="text-xs text-gray-400">+{item.dietaryTags.length - 2}</span>}
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-orange-500 text-sm shrink-0">{currency}{item.price}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => handleToggleItem(item)}
                              className={`text-xs font-medium px-2 py-1 rounded-full transition ${item.isAvailable ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'}`}>
                              {item.isAvailable ? `✅ ${t('common.available')}` : `❌ ${t('common.unavailable')}`}
                            </button>
                            <div className="flex gap-2">
                              <button onClick={() => openEditItem(item)} className="text-gray-400 hover:text-orange-500 transition text-sm">✏️</button>
                              <button onClick={() => handleDeleteItem(item)} className="text-gray-400 hover:text-red-500 transition text-sm">🗑️</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {editCat ? t('menu.editCategory') : t('menu.addCategory')}
            </h3>
            <form onSubmit={handleSaveCat} className="flex flex-col gap-4">
              <input autoFocus type="text" value={catName} onChange={e => setCatName(e.target.value)}
                placeholder={t('menu.categoryPlaceholder')}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCatModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t('common.cancel')}</button>
                <button type="submit" disabled={savingCat}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                  {savingCat ? t('common.loading') : editCat ? t('common.update') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-lg my-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
              {editItem ? t('menu.editItem') : t('menu.addItem')}
            </h3>
            <form onSubmit={handleSaveItem} className="flex flex-col gap-4">

              {/* Name */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('menu.itemName')} *</label>
                <input type="text" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('menu.itemNamePlaceholder')}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('menu.description')}</label>
                  <button type="button" onClick={handleGenerateDesc} disabled={generatingDesc}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 transition">
                    {generatingDesc ? `⏳ ${t('menu.generatingDesc')}` : `✨ ${t('menu.generateDesc')}`}
                  </button>
                </div>
                <textarea value={itemForm.description} onChange={e => { setItemForm(f => ({ ...f, description: e.target.value })); setDescError(''); }}
                  placeholder={t('menu.descPlaceholder')} rows={3}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                {descError && (
                  <div className="mt-1.5 flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400">{descError}</p>
                    <button type="button" onClick={handleGenerateDesc} disabled={generatingDesc}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium ml-3 shrink-0 disabled:opacity-50">Retry</button>
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('menu.price')} ({currency}) *</label>
                <input type="number" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0" min="0" step="0.01"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              {/* Photo */}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t('menu.photo')}</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-orange-400 transition">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">📁 {imageFile ? imageFile.name : t('menu.uploadPhoto')}</p>
                    </label>
                    <button type="button" onClick={handleGenerateImage} disabled={generatingImg}
                      className="w-full border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-3 text-center hover:border-purple-400 transition disabled:opacity-50">
                      <p className="text-sm text-purple-500 dark:text-purple-400 font-medium">
                        {generatingImg ? `⏳ ${t('menu.generatingImage')}` : `🎨 ${t('menu.generateImage')}`}
                      </p>
                      {generatingImg && <p className="text-xs text-gray-400 mt-1">{t('menu.imageNote')}</p>}
                    </button>
                  </div>
                  {imagePreview && (
                    <div className="relative shrink-0">
                      <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
                      {generatedImageUrl && <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">AI</span>}
                      <button type="button" onClick={() => { setImagePreview(''); setImageFile(null); setGeneratedImageUrl(''); }}
                        className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600">✕</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Dietary Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('menu.dietaryTags')}</label>
                  <button type="button" onClick={handleSuggestTags} disabled={generatingTags}
                    className="text-xs text-green-500 hover:text-green-600 font-medium disabled:opacity-50 transition">
                    {generatingTags ? `⏳ ${t('menu.suggestingTags')}` : `✨ ${t('menu.suggestTags')}`}
                  </button>
                </div>
                {suggestedTags.length > 0 && (
                  <p className="text-xs text-green-500 dark:text-green-400 mb-2">
                    ✅ {t('menu.aiSuggestedTags')}: {suggestedTags.join(', ')} — {t('menu.canDeselect')}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        itemForm.dietaryTags.includes(tag)
                          ? suggestedTags.includes(tag) ? 'bg-green-500 border-green-500 text-white ring-2 ring-green-300' : 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400'
                      }`}>{tag}</button>
                  ))}
                </div>
              </div>

              {/* Modifiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{t('menu.modifiers')}</label>
                  <button type="button" onClick={addModGroup} className="text-xs text-orange-500 hover:text-orange-600 font-medium">{t('menu.addGroup')}</button>
                </div>
                {itemForm.modifiers.map((group, gIdx) => (
                  <div key={gIdx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-2">
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={group.groupName} onChange={e => updateModGroup(gIdx, e.target.value)}
                        placeholder={t('menu.groupName')}
                        className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <button type="button" onClick={() => removeModGroup(gIdx)} className="text-red-400 hover:text-red-600 px-2">🗑️</button>
                    </div>
                    {group.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2 mb-1.5">
                        <input type="text" value={opt.label} onChange={e => updateModOption(gIdx, oIdx, 'label', e.target.value)}
                          placeholder={t('menu.optionLabel')}
                          className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        <input type="number" value={opt.extraPrice} onChange={e => updateModOption(gIdx, oIdx, 'extraPrice', Number(e.target.value))}
                          placeholder={t('menu.extraPrice')} min="0"
                          className="w-20 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        <button type="button" onClick={() => removeModOption(gIdx, oIdx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addModOption(gIdx)} className="text-xs text-orange-500 hover:text-orange-600 mt-1">{t('menu.addOption')}</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t('common.cancel')}</button>
                <button type="submit" disabled={savingItem}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                  {savingItem ? t('common.loading') : editItem ? t('common.update') : t('menu.addItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}