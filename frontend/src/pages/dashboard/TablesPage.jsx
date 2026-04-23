// Replace your entire TablesPage.jsx with this version
// Only the handlePrintQR function and the hidden iframe have changed

import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { getTables, addTable, updateTable, deleteTable, updateTableStatus } from '../../api/tableApi';

const STATUS_CONFIG = {
  empty:          { label: 'Empty',          color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',    dot: 'bg-green-500'  },
  occupied:       { label: 'Occupied',        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',        dot: 'bg-blue-500'   },
  order_pending:  { label: 'Order Pending',   color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  bill_requested: { label: 'Bill Requested',  color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',            dot: 'bg-red-500'    },
};

const INIT_FORM = { tableName: '', seats: '' };

const getQRUrl = (restaurantId, tableId) =>
  `${window.location.origin}/order/${restaurantId}/${tableId}`;

export default function TablesPage() {
  const { currentRestaurant } = useAuth();
  const token = localStorage.getItem('qrunch_token');

  const [tables, setTables]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState(null);
  const [form, setForm]           = useState(INIT_FORM);
  const [saving, setSaving]       = useState(false);
  const iframeRef                 = useRef(null);

  useEffect(() => {
    if (!currentRestaurant?._id) return;
    setLoading(true);
    getTables(currentRestaurant._id, token)
      .then(setTables)
      .catch(() => toast.error('Failed to load tables'))
      .finally(() => setLoading(false));
  }, [currentRestaurant?._id]);

  // ── CRUD ─────────────────────────────────────────────────
  const openAdd  = () => { setEditTable(null); setForm(INIT_FORM); setShowModal(true); };
  const openEdit = (t) => { setEditTable(t); setForm({ tableName: t.tableName, seats: t.seats.toString() }); setShowModal(true); };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.seats || isNaN(Number(form.seats)) || Number(form.seats) < 1)
      return toast.error('Please enter a valid number of seats');
    setSaving(true);
    try {
      if (editTable) {
        const updated = await updateTable(editTable._id, { tableName: form.tableName, seats: form.seats }, token);
        setTables(prev => prev.map(t => t._id === updated._id ? updated : t));
        toast.success('Table updated');
      } else {
        const newTable = await addTable({ restaurantId: currentRestaurant._id, tableName: form.tableName, seats: form.seats }, token);
        setTables(prev => [...prev, newTable]);
        toast.success(`Table ${newTable.tableNumber} added!`);
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save table');
    } finally { setSaving(false); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete Table ${t.tableNumber}${t.tableName ? ` (${t.tableName})` : ''}?`)) return;
    try {
      await deleteTable(t._id, token);
      setTables(prev => prev.filter(x => x._id !== t._id));
      toast.success('Table deleted');
    } catch { toast.error('Failed to delete table'); }
  };

  const handleStatusChange = async (t, status) => {
    try {
      const updated = await updateTableStatus(t._id, status, token);
      setTables(prev => prev.map(x => x._id === updated._id ? updated : x));
    } catch { toast.error('Failed to update status'); }
  };

  // ── QR CODE ACTIONS ──────────────────────────────────────
  const handleDownloadQR = (table) => {
    const canvas = document.getElementById(`qr-canvas-${table._id}`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QRunch-Table-${table.tableNumber}${table.tableName ? `-${table.tableName}` : ''}.png`;
    a.click();
    toast.success('QR code downloaded!');
  };

  const handlePrintQR = (table) => {
    const canvas = document.getElementById(`qr-canvas-${table._id}`);
    if (!canvas) return;
    const imgUrl = canvas.toDataURL('image/png');
    const isDark = document.documentElement.classList.contains('dark');

    const html = `
      <html>
        <head>
          <title>QRunch — Table ${table.tableNumber}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              min-height: 100vh; margin: 0;
              background: ${isDark ? '#111' : '#fff'};
              color: ${isDark ? '#fff' : '#111'};
            }
            .brand  { font-size: 22px; font-weight: 800; color: #f97316; margin-bottom: 16px; }
            img     { width: 280px; height: 280px; border: 1px solid ${isDark ? '#333' : '#eee'}; border-radius: 12px; padding: 12px; }
            h2      { margin: 16px 0 4px; font-size: 24px; }
            p       { margin: 0; font-size: 14px; color: ${isDark ? '#aaa' : '#666'}; }
            .btn    { margin-top: 24px; padding: 10px 24px; background: #f97316; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="brand">QRunch</div>
          <img src="${imgUrl}" alt="QR Code" />
          <h2>Table ${table.tableNumber}${table.tableName ? ` — ${table.tableName}` : ''}</h2>
          <p>Scan to view menu &amp; order</p>
          <button class="btn no-print" onclick="window.print()">🖨️ Print</button>
        </body>
      </html>
    `;

    const iframe = iframeRef.current;
    iframe.srcdoc = html;
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
  };

  if (!currentRestaurant) return (
    <div className="flex items-center justify-center h-64 text-gray-400">No restaurant selected</div>
  );

  return (
    <div>
      {/* Hidden iframe for printing — no popup needed */}
      <iframe ref={iframeRef} style={{ display: 'none' }} title="print-frame" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Table Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {currentRestaurant.name} — {tables.length} table{tables.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + Add Table
        </button>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, { label, dot }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Table Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 gap-3">
          <span className="text-6xl">🪑</span>
          <p className="text-sm">No tables yet — add your first table!</p>
          <button onClick={openAdd} className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + Add Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map(table => {
            const st = STATUS_CONFIG[table.status];
            const qrUrl = getQRUrl(currentRestaurant._id, table._id);
            return (
              <div key={table._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3 hover:shadow-md transition">

                {/* Table number + status */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">T{table.tableNumber}</p>
                    {table.tableName && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[100px]">{table.tableName}</p>
                    )}
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${st.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    <span className="hidden sm:inline">{st.label}</span>
                  </div>
                </div>

                {/* Seats */}
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                  <span className="text-sm">🪑</span>
                  <span className="text-xs">{table.seats} seat{table.seats !== 1 ? 's' : ''}</span>
                </div>

                {/* QR Code preview (display only) */}
                <div className="flex justify-center py-1">
                  <QRCodeCanvas
                    value={qrUrl}
                    size={80}
                    bgColor="transparent"
                    fgColor={document.documentElement.classList.contains('dark') ? '#ffffff' : '#111111'}
                    level="M"
                  />
                </div>

                {/* Hidden QR canvas for download/print — always black on white */}
                <div style={{ display: 'none' }}>
                  <QRCodeCanvas
                    id={`qr-canvas-${table._id}`}
                    value={qrUrl}
                    size={300}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                </div>

                {/* Status selector */}
                <select
                  value={table.status}
                  onChange={e => handleStatusChange(table, e.target.value)}
                  className="w-full text-xs border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="empty">Empty</option>
                  <option value="occupied">Occupied</option>
                  <option value="order_pending">Order Pending</option>
                  <option value="bill_requested">Bill Requested</option>
                </select>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => handleDownloadQR(table)}
                    className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 py-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition font-medium">
                    ⬇ Download
                  </button>
                  <button onClick={() => handlePrintQR(table)}
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition font-medium">
                    🖨 Print
                  </button>
                  <button onClick={() => openEdit(table)}
                    className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(table)}
                    className="text-xs bg-red-50 dark:bg-red-900/20 text-red-400 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
              {editTable ? `Edit Table ${editTable.tableNumber}` : 'Add New Table'}
            </h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Table Name <span className="text-gray-400 dark:text-gray-600">(optional)</span>
                </label>
                <input type="text" value={form.tableName}
                  onChange={e => setForm(f => ({ ...f, tableName: e.target.value }))}
                  placeholder="e.g. Window Table, VIP, Terrace"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Number of Seats *</label>
                <input type="number" value={form.seats} min="1" max="20"
                  onChange={e => setForm(f => ({ ...f, seats: e.target.value }))}
                  placeholder="e.g. 4"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {!editTable && (
                <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  ℹ️ Table number will be assigned automatically.
                </p>
              )}
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                  {saving ? 'Saving...' : editTable ? 'Update' : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}