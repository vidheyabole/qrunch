import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';

const ROLES       = ['manager', 'chef', 'waiter'];
const LANGS       = ['en', 'hi', 'mr'];
const LANG_LABELS = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };
const ROLE_COLORS = {
  manager: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  chef:    'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  waiter:  'bg-blue-100  dark:bg-blue-900/20  text-blue-600  dark:text-blue-400',
};

export default function StaffPage() {
  const { owner, currentRestaurant } = useAuth();
  const token        = owner?.token;
  const authHeader   = { Authorization: `Bearer ${token}` };
  const restaurantId = currentRestaurant?._id;

  const [staff,       setStaff]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editStaff,   setEditStaff]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [showPass,    setShowPass]    = useState(null);
  const [expandedId,  setExpandedId]  = useState(null);

  // Leave modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTarget,    setLeaveTarget]    = useState(null);
  const [leftAt,         setLeftAt]         = useState('');
  const [leaveReason,    setLeaveReason]    = useState('');

  // Form fields
  const [name,     setName]     = useState('');
  const [role,     setRole]     = useState('waiter');
  const [language, setLanguage] = useState('en');
  const [password, setPassword] = useState('');

  const loadStaff = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const res  = await fetch(`/api/staff?restaurant=${restaurantId}`, { headers: authHeader });
    const data = await res.json();
    setStaff(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [restaurantId, token]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const resetForm = () => { setName(''); setRole('waiter'); setLanguage('en'); setPassword(''); };

  const openAdd  = () => { resetForm(); setEditStaff(null); setShowModal(true); };
  const openEdit = (s) => { setEditStaff(s); setName(s.name); setRole(s.role); setLanguage(s.language); setPassword(''); setShowModal(true); };

  const saveStaff = async (e) => {
    e.preventDefault();
    if (!name.trim() || (!editStaff && !password.trim())) return;
    setSaving(true);
    const body = { name, role, language, restaurant: restaurantId };
    if (password) body.password = password;
    const url    = editStaff ? `/api/staff/${editStaff._id}` : '/api/staff';
    const method = editStaff ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data   = await res.json();
    setSaving(false);
    setShowModal(false);
    if (!editStaff && data.loginId) setShowPass({ loginId: data.loginId, password, name: data.name, role: data.role });
    loadStaff();
  };

  const deleteStaff = async (id) => {
    if (!confirm('Delete this staff member?')) return;
    await fetch(`/api/staff/${id}`, { method: 'DELETE', headers: authHeader });
    loadStaff();
  };

  // When deactivating — show leave modal; when reactivating — do directly
  const handleToggleActive = (s) => {
    if (s.isActive) {
      setLeaveTarget(s);
      setLeftAt(new Date().toISOString().split('T')[0]);
      setLeaveReason('');
      setShowLeaveModal(true);
    } else {
      confirmReactivate(s);
    }
  };

  const confirmReactivate = async (s) => {
    await fetch(`/api/staff/${s._id}`, {
      method:  'PUT',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: true, leftAt: null, leaveReason: '' })
    });
    loadStaff();
  };

  const confirmLeave = async (e) => {
    e.preventDefault();
    if (!leaveTarget) return;
    await fetch(`/api/staff/${leaveTarget._id}`, {
      method:  'PUT',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: false, leftAt: leftAt || new Date().toISOString(), leaveReason })
    });
    setShowLeaveModal(false);
    setLeaveTarget(null);
    loadStaff();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">👥 Staff</h1>
        <button onClick={openAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">
          + Add Staff
        </button>
      </div>

      {/* Staff login link */}
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Staff Login Page</p>
          <p className="text-xs text-orange-500 mt-0.5">{window.location.origin}/staff/login</p>
        </div>
        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/staff/login`)}
          className="text-xs text-orange-500 hover:text-orange-700 font-medium transition border border-orange-300 px-3 py-1.5 rounded-lg">
          Copy Link
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="animate-spin text-2xl">⏳</span></div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <span className="text-4xl mb-3">👥</span>
          <p className="text-sm">No staff added yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {staff.map(s => (
            <div key={s._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {/* Main row */}
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shrink-0">
                    {s.role === 'manager' ? '👔' : s.role === 'chef' ? '👨‍🍳' : '🛎️'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{s.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[s.role]}`}>{s.role}</span>
                      {!s.isActive && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {s.loginId} · {LANG_LABELS[s.language]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggleActive(s)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition
                      ${s.isActive
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition px-1">
                    {expandedId === s._id ? '▲' : '▼'}
                  </button>
                  <button onClick={() => openEdit(s)} className="text-xs text-blue-500 hover:text-blue-700 transition">Edit</button>
                  <button onClick={() => deleteStaff(s._id)} className="text-xs text-red-400 hover:text-red-600 transition">Delete</button>
                </div>
              </div>

              {/* ── Expanded info section (#10) ── */}
              {expandedId === s._id && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Joined</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{formatDate(s.joinedAt || s.createdAt)}</p>
                    </div>
                    {!s.isActive && s.leftAt && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Left</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{formatDate(s.leftAt)}</p>
                      </div>
                    )}
                    {!s.isActive && s.leaveReason && (
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Reason</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{s.leaveReason}</p>
                      </div>
                    )}
                    {s.isActive && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                        <p className="text-sm text-green-600 font-medium">Currently Active</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Leave Modal (#10) ── */}
      {showLeaveModal && leaveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Mark as Inactive</h3>
              <p className="text-sm text-gray-400 mt-0.5">{leaveTarget.name}</p>
            </div>
            <form onSubmit={confirmLeave} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Leave Date</label>
                <input type="date" value={leftAt} onChange={e => setLeftAt(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  Reason <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <input type="text" value={leaveReason} onChange={e => setLeaveReason(e.target.value)}
                  placeholder="e.g. Resigned, Contract ended..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowLeaveModal(false); setLeaveTarget(null); }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{editStaff ? 'Edit Staff' : 'Add Staff'}</h3>
            </div>
            <form onSubmit={saveStaff} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Full Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus placeholder="e.g. Rahul Sharma"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {!editStaff && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Role *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`py-2 rounded-xl text-sm font-medium border transition capitalize
                          ${role === r ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'}`}>
                        {r === 'manager' ? '👔' : r === 'chef' ? '👨‍🍳' : '🛎️'} {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Language</label>
                <div className="flex gap-2">
                  {LANGS.map(l => (
                    <button key={l} type="button" onClick={() => setLanguage(l)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition
                        ${language === l ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'}`}>
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  Password {editStaff && <span className="text-xs text-gray-400">(leave blank to keep)</span>}
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required={!editStaff} placeholder={editStaff ? 'New password (optional)' : 'Set a password'}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                  {saving ? 'Saving...' : editStaff ? 'Update' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Credentials Modal ── */}
      {showPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className="text-center mb-4">
              <span className="text-4xl">{showPass.role === 'manager' ? '👔' : showPass.role === 'chef' ? '👨‍🍳' : '🛎️'}</span>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-2">Staff Account Created!</h3>
              <p className="text-sm text-gray-400 mt-1">Share these credentials with {showPass.name}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Login ID</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-100 text-sm">{showPass.loginId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Password</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-100 text-sm">{showPass.password}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Login URL</span>
                <span className="text-xs text-orange-500">{window.location.origin}/staff/login</span>
              </div>
            </div>
            <button onClick={() => navigator.clipboard.writeText(`QRunch Staff Login\nURL: ${window.location.origin}/staff/login\nLogin ID: ${showPass.loginId}\nPassword: ${showPass.password}`)}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition mb-2">
              📋 Copy Credentials
            </button>
            <button onClick={() => setShowPass(null)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}