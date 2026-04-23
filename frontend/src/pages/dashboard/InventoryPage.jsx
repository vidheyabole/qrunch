import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../api/inventoryApi';
import { exportToCSV } from '../../utils/csvExport';
import toast from 'react-hot-toast';

const UNITS = [
  { group: 'Weight',  units: ['kg', 'grams', 'lbs', 'oz'] },
  { group: 'Volume',  units: ['litre', 'ml', 'bottles', 'gallons'] },
  { group: 'Count',   units: ['pieces', 'dozens', 'boxes', 'packets', 'bags', 'cans'] },
];

const INIT = { name: '', quantity: '', unit: '', lowStockThreshold: '5' };

export default function InventoryPage() {
  const { currentRestaurant } = useAuth();
  const { t } = useTranslation();
  const token = localStorage.getItem('qrunch_token');

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(INIT);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!currentRestaurant?._id) return;
    setLoading(true);
    getInventory(currentRestaurant._id, token)
      .then(setItems)
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, [currentRestaurant?._id]);

  const getStatus = (item) => {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.lowStockThreshold) return 'low';
    return 'ok';
  };

  const filtered = items.filter(i => {
    if (filter === 'low') return getStatus(i) === 'low';
    if (filter === 'out') return getStatus(i) === 'out';
    return true;
  });

  const lowCount = items.filter(i => getStatus(i) === 'low').length;
  const outCount = items.filter(i => getStatus(i) === 'out').length;

  const openAdd  = () => { setEditItem(null); setForm(INIT); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, quantity: item.quantity.toString(), unit: item.unit, lowStockThreshold: item.lowStockThreshold.toString() });
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.name.trim())    return toast.error('Item name is required');
    if (!form.unit.trim())    return toast.error('Unit is required');
    if (form.quantity === '' || isNaN(Number(form.quantity)) || Number(form.quantity) < 0)
      return toast.error('Valid quantity required');
    setSaving(true);
    try {
      if (editItem) {
        const updated = await updateInventoryItem(editItem._id, { name: form.name, quantity: form.quantity, unit: form.unit, lowStockThreshold: form.lowStockThreshold }, token);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
        toast.success('Item updated');
      } else {
        const newItem = await addInventoryItem({ restaurantId: currentRestaurant._id, name: form.name, quantity: form.quantity, unit: form.unit, lowStockThreshold: form.lowStockThreshold }, token);
        setItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Item added');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save item'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from inventory?`)) return;
    try {
      await deleteInventoryItem(item._id, token);
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete item'); }
  };

  const handleExport = () => {
    if (items.length === 0) return toast.error('No inventory items to export');
    exportToCSV(
      `${currentRestaurant.name} - Inventory`,
      ['Item Name', 'Quantity', 'Unit', 'Low Stock Threshold', 'Status'],
      items.map(i => [i.name, i.quantity, i.unit, i.lowStockThreshold,
        getStatus(i) === 'out' ? t('inventory.outOfStock') : getStatus(i) === 'low' ? t('inventory.lowStock') : t('inventory.inStock')
      ])
    );
    toast.success('Inventory exported!');
  };

  if (!currentRestaurant) return (
    <div className="flex items-center justify-center h-64 text-gray-400">No restaurant selected</div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('inventory.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{currentRestaurant.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium">
            📥 {t('common.exportCSV')}
          </button>
          <button onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {t('inventory.addItem')}
          </button>
        </div>
      </div>

      {outCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-3 flex items-center gap-2">
          <span>❌</span>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            {outCount} {t('inventory.outStockMsg')}
          </p>
        </div>
      )}
      {lowCount > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span>⚠️</span>
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            {lowCount} {t('inventory.lowStockMsg')}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: 'all', label: t('inventory.allItems'),   count: items.length },
          { key: 'low', label: t('inventory.lowStock'),   count: lowCount },
          { key: 'out', label: t('inventory.outOfStock'), count: outCount },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === tab.key ? 'bg-orange-500 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 gap-3">
          <span className="text-6xl">📦</span>
          <p className="text-sm">{items.length === 0 ? 'No inventory items yet — add your first item!' : 'No items in this filter'}</p>
          {items.length === 0 && (
            <button onClick={openAdd} className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {t('inventory.addItem')}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <div className="col-span-4">Item</div>
            <div className="col-span-2 text-center">{t('inventory.quantity')}</div>
            <div className="col-span-2 text-center">{t('inventory.unit')}</div>
            <div className="col-span-2 text-center">{t('inventory.alertThreshold')}</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {filtered.map((item, idx) => {
            const status = getStatus(item);
            return (
              <div key={item._id}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-5 py-4 items-center ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}>
                <div className="sm:col-span-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                </div>
                <div className="sm:col-span-2 text-center">
                  <span className={`text-sm font-bold ${status === 'out' ? 'text-red-500' : status === 'low' ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'}`}>{item.quantity}</span>
                </div>
                <div className="sm:col-span-2 text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{item.unit}</span>
                </div>
                <div className="sm:col-span-2 text-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">≤ {item.lowStockThreshold} {item.unit}</span>
                </div>
                <div className="sm:col-span-1 flex justify-center">
                  {status === 'out' ? (
                    <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-full font-medium">{t('inventory.outOfStock')}</span>
                  ) : status === 'low' ? (
                    <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-500 px-2 py-0.5 rounded-full font-medium">⚠️ {t('inventory.lowStock')}</span>
                  ) : (
                    <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-500 px-2 py-0.5 rounded-full font-medium">✅ {t('inventory.inStock')}</span>
                  )}
                </div>
                <div className="sm:col-span-1 flex justify-center gap-3">
                  <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-orange-500 transition text-sm">✏️</button>
                  <button onClick={() => handleDelete(item)} className="text-gray-400 hover:text-red-500 transition text-sm">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-center">{t('inventory.helpText')}</p>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
              {editItem ? t('inventory.editItem') : t('inventory.addItem')}
            </h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Item Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Chicken, Potatoes, Oil" autoFocus
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('inventory.quantity')} *</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="0" min="0" step="0.01"
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('inventory.unit')} *</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="" disabled>{t('inventory.selectUnit')}</option>
                    {UNITS.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.units.map(u => <option key={u} value={u}>{u}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  {t('inventory.alertThreshold')} *
                </label>
                <input type="number" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                  placeholder="5" min="1" step="0.01"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                {form.unit && <p className="text-xs text-gray-400 mt-1">{t('inventory.alertWhen')} {form.lowStockThreshold || '?'} {form.unit}</p>}
              </div>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t('common.cancel')}</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                  {saving ? t('common.loading') : editItem ? t('common.update') : t('inventory.addItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}