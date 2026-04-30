import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const UNITS = ['kg', 'g', 'lbs', 'oz', 'litre', 'ml', 'bottles', 'cans', 'packets', 'pieces', 'dozen', 'bags'];

export default function InventoryPage() {
  const { owner, currentRestaurant } = useAuth();
  const { t } = useTranslation();

  const restaurantId  = currentRestaurant?._id;
  const currency = owner?.region === 'india' ? '₹' : '$';
  const getAuthHeader = () => ({ Authorization: `Bearer ${owner?.token}` });

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [bulkMode,   setBulkMode]   = useState(false);
  const [bulkEdits,  setBulkEdits]  = useState({});
  const [savingBulk, setSavingBulk] = useState(false);

  const [itemName,   setItemName]   = useState('');
  const [quantity,   setQuantity]   = useState('');
  const [unit,       setUnit]       = useState('kg');
  const [customUnit, setCustomUnit] = useState('');
  const [threshold,  setThreshold]  = useState(5);

  const loadItems = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const res  = await fetch(`/api/inventory/${restaurantId}`, { headers: getAuthHeader() });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [restaurantId, owner?.token]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filteredItems = items.filter(item => {
    if (filter === 'out') return item.quantity === 0;
    if (filter === 'low') return item.quantity > 0 && item.quantity <= item.lowStockThreshold;
    return true;
  });

  const resetForm = () => {
    setItemName(''); setQuantity(''); setUnit('kg'); setCustomUnit(''); setThreshold(5);
  };

  const openAdd  = () => { resetForm(); setEditItem(null); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setItemName(item.name);
    setQuantity(item.quantity.toString());
    const knownUnit = UNITS.includes(item.unit);
    setUnit(knownUnit ? item.unit : 'custom');
    setCustomUnit(knownUnit ? '' : item.unit);
    setThreshold(item.lowStockThreshold ?? 5);
    setShowModal(true);
  };

  const finalUnit = unit === 'custom' ? customUnit : unit;

  const saveItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || quantity === '' || !finalUnit) return;
    setSaving(true);
    const body = {
      name:              itemName,
      quantity:          parseFloat(quantity),
      unit:              finalUnit,
      lowStockThreshold: parseFloat(threshold),
      restaurantId:      restaurantId
    };
    const url    = editItem ? `/api/inventory/${editItem._id}` : '/api/inventory';
    const method = editItem ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    setSaving(false);
    setShowModal(false);
    loadItems();
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this inventory item?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE', headers: getAuthHeader() });
    loadItems();
  };

  const startBulk = () => {
    const edits = {};
    items.forEach(i => { edits[i._id] = { quantity: i.quantity, lowStockThreshold: i.lowStockThreshold }; });
    setBulkEdits(edits);
    setBulkMode(true);
  };

  const saveBulk = async () => {
    setSavingBulk(true);
    await Promise.all(
      Object.entries(bulkEdits).map(([id, vals]) =>
        fetch(`/api/inventory/${id}`, {
          method:  'PUT',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body:    JSON.stringify(vals)
        })
      )
    );
    setSavingBulk(false);
    setBulkMode(false);
    loadItems();
  };

  const exportCSV = () => {
    const header = 'Name,Quantity,Unit,Low Stock Threshold,Status\n';
    const rows   = items.map(i => {
      const status = i.quantity === 0 ? 'Out of Stock'
        : i.quantity <= i.lowStockThreshold ? 'Low Stock' : 'In Stock';
      return `"${i.name}",${i.quantity},${i.unit},${i.lowStockThreshold},${status}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: t('inventory.outOfStock'), color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    if (item.quantity <= item.lowStockThreshold) return { label: t('inventory.lowStock'), color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' };
    return { label: t('inventory.inStock'), color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('inventory.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          {bulkMode ? (
            <>
              <button onClick={() => setBulkMode(false)}
                className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {t('inventory.cancelBulk')}
              </button>
              <button onClick={saveBulk} disabled={savingBulk}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
                {savingBulk ? t('common.loading') : t('inventory.saveAll')}
              </button>
            </>
          ) : (
            <>
              <button onClick={exportCSV}
                className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                📥 {t('common.exportCSV')}
              </button>
              <button onClick={startBulk}
                className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {t('inventory.bulkEdit')}
              </button>
              <button onClick={openAdd}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
                {t('inventory.addItem')}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('inventory.helpText')}</p>

      <div className="flex gap-2 mb-5">
        {[
          { key: 'all', label: t('inventory.allItems') },
          { key: 'low', label: `⚠️ ${t('inventory.lowStock')}` },
          { key: 'out', label: `🚫 ${t('inventory.outOfStock')}` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition
              ${filter === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <span className="animate-spin text-2xl">⏳</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <span className="text-4xl mb-3">📦</span>
          <p className="text-sm">{items.length === 0 ? t('inventory.noItems') : 'No items match this filter'}</p>
          {items.length === 0 && <p className="text-xs mt-1">{t('inventory.addFirst')}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>{t('inventory.itemName')}</span>
            <span>{t('inventory.quantity')}</span>
            <span>{t('inventory.unit')}</span>
            <span>Status</span>
            <span></span>
          </div>

          {filteredItems.map(item => {
            const { label, color } = getStockStatus(item);
            return (
              <div key={item._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 shadow-sm">
                {bulkMode ? (
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 items-center">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</span>
                    <div>
                      <label className="text-xs text-gray-400 block mb-0.5">{t('inventory.quantity')}</label>
                      <input type="number" min="0" step="0.1"
                        value={bulkEdits[item._id]?.quantity ?? item.quantity}
                        onChange={e => setBulkEdits(b => ({ ...b, [item._id]: { ...b[item._id], quantity: parseFloat(e.target.value) || 0 } }))}
                        className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-0.5">{t('inventory.alertWhen')}</label>
                      <input type="number" min="0" step="0.5"
                        value={bulkEdits[item._id]?.lowStockThreshold ?? item.lowStockThreshold}
                        onChange={e => setBulkEdits(b => ({ ...b, [item._id]: { ...b[item._id], lowStockThreshold: parseFloat(e.target.value) || 0 } }))}
                        className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.quantity === null ? t('inventory.unlimited') : `${item.quantity} ${item.unit}`}
                        {' · '}
                        {t('inventory.alertWhen')} {item.lowStockThreshold} {item.unit}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${color}`}>{label}</span>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={() => openEdit(item)}
                        className="text-xs text-blue-500 hover:text-blue-700 transition">{t('common.edit')}</button>
                      <button onClick={() => deleteItem(item._id)}
                        className="text-xs text-red-400 hover:text-red-600 transition">{t('common.delete')}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {editItem ? t('inventory.editItem') : t('inventory.addItem')}
              </h3>
            </div>
            <form onSubmit={saveItem} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{t('inventory.itemName')} *</label>
                <input type="text" value={itemName} onChange={e => setItemName(e.target.value)}
                  placeholder={t('inventory.itemNamePlaceholder')} required autoFocus
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  {t('inventory.quantity')} <span className="text-gray-400 text-xs">(leave blank = unlimited)</span>
                </label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                  min="0" step="0.1" placeholder="e.g. 10"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{t('inventory.unit')} *</label>
                <select value={unit} onChange={e => setUnit(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="custom">Custom…</option>
                </select>
                {unit === 'custom' && (
                  <input type="text" value={customUnit} onChange={e => setCustomUnit(e.target.value)}
                    placeholder={t('inventory.unitPlaceholder')} required
                    className="mt-2 w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  {t('inventory.alertWhen')} {finalUnit || 'units'}
                </label>
                <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
                  min="0" step="0.5"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">
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