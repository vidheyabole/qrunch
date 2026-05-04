import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const GST_PRESETS = [
  { label: '0% (No GST)', rate: 0 },
  { label: '5% (Small restaurants, takeaway)', rate: 5 },
  { label: '18% (AC restaurants / liquor licence)', rate: 18 },
];

export default function RestaurantSettings({ owner, currentRestaurant, restaurants, token }) {
  const [selectedRestId, setSelectedRestId] = useState(currentRestaurant?._id || '');
  const [saving,         setSaving]         = useState(false);
  const [loading,        setLoading]        = useState(false);

  // GST
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate,    setGstRate]    = useState(5);
  const [customRate, setCustomRate] = useState('');
  const [useCustom,  setUseCustom]  = useState(false);
  const [gstin,      setGstin]      = useState('');

  // Payment methods
  const [pmCash,  setPmCash]  = useState(true);
  const [pmUpi,   setPmUpi]   = useState(true);
  const [pmCard,  setPmCard]  = useState(false);
  const [pmOther, setPmOther] = useState(false);

  useEffect(() => {
    if (!selectedRestId) return;
    setLoading(true);
    fetch(`/api/restaurants/${selectedRestId}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setGstEnabled(data.gst?.enabled || false);
        const rate = data.gst?.rate || 0;
        const isPreset = GST_PRESETS.some(p => p.rate === rate);
        setGstRate(isPreset ? rate : rate);
        setUseCustom(!isPreset && rate > 0);
        setCustomRate(!isPreset && rate > 0 ? rate.toString() : '');
        setGstin(data.gst?.gstin || '');
        setPmCash(data.paymentMethods?.cash  ?? true);
        setPmUpi(data.paymentMethods?.upi    ?? true);
        setPmCard(data.paymentMethods?.card  ?? false);
        setPmOther(data.paymentMethods?.other ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedRestId, token]);

  const handleSave = async () => {
    setSaving(true);
    const finalRate = useCustom ? parseFloat(customRate) || 0 : gstRate;
    try {
      await fetch(`/api/restaurants/${selectedRestId}/settings`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          gst: { enabled: gstEnabled, rate: finalRate, gstin, inclusive: false },
          paymentMethods: { cash: pmCash, upi: pmUpi, card: pmCard, other: pmOther }
        })
      });
      toast.success('Restaurant settings saved!');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mt-6 shadow-sm">
      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">🏪 Restaurant Settings</h2>
      <p className="text-xs text-gray-400 mb-5">GST and payment configuration per restaurant</p>

      {/* Restaurant selector */}
      {restaurants?.length > 1 && (
        <div className="mb-5">
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Restaurant</label>
          <select value={selectedRestId} onChange={e => setSelectedRestId(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
            {restaurants.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><span className="animate-spin text-xl">⏳</span></div>
      ) : (
        <>
          {/* ── GST Section ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">GST</p>
                <p className="text-xs text-gray-400">Indian Goods & Services Tax</p>
              </div>
              <div onClick={() => setGstEnabled(v => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${gstEnabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gstEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>

            {gstEnabled && (
              <div className="flex flex-col gap-3 mt-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">GST Rate</label>
                  <div className="flex flex-col gap-2">
                    {GST_PRESETS.map(preset => (
                      <button key={preset.rate} type="button"
                        onClick={() => { setGstRate(preset.rate); setUseCustom(false); }}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition
                          ${!useCustom && gstRate === preset.rate
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300 bg-gray-50 dark:bg-gray-800'}`}>
                        <span>{preset.label}</span>
                        {preset.rate > 0 && (
                          <span className={`text-xs ${!useCustom && gstRate === preset.rate ? 'text-orange-100' : 'text-gray-400'}`}>
                            CGST {preset.rate / 2}% + SGST {preset.rate / 2}%
                          </span>
                        )}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => setUseCustom(true)}
                      className={`flex items-center px-4 py-2.5 rounded-xl border text-sm transition
                        ${useCustom
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300 bg-gray-50 dark:bg-gray-800'}`}>
                      Custom rate...
                    </button>
                    {useCustom && (
                      <input type="number" value={customRate} onChange={e => setCustomRate(e.target.value)}
                        min="0" max="28" step="0.5" placeholder="Enter custom rate (e.g. 12)"
                        className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                    GSTIN <span className="text-xs text-gray-400">(optional — printed on bill if provided)</span>
                  </label>
                  <input type="text" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AAPFU0939F1ZV" maxLength={15}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <p className="text-xs text-gray-400 mt-1">
                    Required for GST-registered businesses. Restaurants below ₹20 lakh turnover can leave this blank.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Payment Methods ── */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Payment Methods</p>
            <p className="text-xs text-gray-400 mb-3">Select which methods your restaurant accepts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'cash',  label: '💵 Cash',        val: pmCash,  set: setPmCash  },
                { key: 'upi',   label: '📱 UPI / GPay',  val: pmUpi,   set: setPmUpi   },
                { key: 'card',  label: '💳 Card',         val: pmCard,  set: setPmCard  },
                { key: 'other', label: '🔄 Other',        val: pmOther, set: setPmOther },
              ].map(({ key, label, val, set }) => (
                <button key={key} type="button" onClick={() => set(v => !v)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition
                    ${val
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300 bg-gray-50 dark:bg-gray-800'}`}>
                  <span>{label}</span>
                  <span className={`text-xs ${val ? 'text-orange-100' : 'text-gray-400'}`}>
                    {val ? '✓ On' : 'Off'}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Online payment processing (UPI/GPay direct) coming soon via Razorpay.
            </p>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl text-sm transition">
            {saving ? 'Saving...' : 'Save Restaurant Settings'}
          </button>
        </>
      )}
    </div>
  );
}