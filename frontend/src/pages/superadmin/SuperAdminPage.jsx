import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SuperAdminPage() {
  const [secret,      setSecret]      = useState('');
  const [authed,      setAuthed]      = useState(false);
  const [owners,      setOwners]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [toggling,    setToggling]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [expandedId,  setExpandedId]  = useState(null);

  const headers = {
    'Content-Type':        'application/json',
    'x-super-admin-secret': secret
  };

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/superadmin/owners', { headers });
      if (!res.ok) { toast.error('Invalid secret key'); setAuthed(false); setLoading(false); return; }
      const data = await res.json();
      setOwners(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to connect to server'); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    const res = await fetch('/api/superadmin/owners', {
      headers: { 'x-super-admin-secret': secret }
    });
    if (res.ok) {
      const data = await res.json();
      setOwners(Array.isArray(data) ? data : []);
      setAuthed(true);
      localStorage.setItem('qrunch_sa_secret', secret);
    } else {
      toast.error('Invalid secret key');
    }
    setLoading(false);
  };

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('qrunch_sa_secret');
    if (saved) { setSecret(saved); }
  }, []);

  const handleToggle = async (owner) => {
    if (!confirm(`${owner.subscriptionActive ? 'Deactivate' : 'Activate'} subscription for ${owner.ownerName}?`)) return;
    setToggling(owner._id);
    try {
      const res  = await fetch(`/api/superadmin/owners/${owner._id}/toggle-subscription`, {
        method: 'PATCH', headers
      });
      const data = await res.json();
      setOwners(prev => prev.map(o =>
        o._id === owner._id ? { ...o, subscriptionActive: data.subscriptionActive } : o
      ));
      toast.success(data.message);
    } catch { toast.error('Failed to toggle subscription'); }
    setToggling(null);
  };

  const handleLogout = () => {
    setAuthed(false);
    setSecret('');
    setOwners([]);
    localStorage.removeItem('qrunch_sa_secret');
  };

  const filtered = owners.filter(o =>
    o.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.restaurants?.some(r => r.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRestaurants = owners.reduce((s, o) => s + (o.restaurants?.length || 0), 0);
  const activeCount      = owners.filter(o => o.subscriptionActive).length;
  const inactiveCount    = owners.length - activeCount;

  // ── Login Screen ─────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🛡️</span>
          <h1 className="text-2xl font-bold text-white mt-3">Super Admin</h1>
          <p className="text-gray-500 text-sm mt-1">QRunch Platform Control</p>
        </div>
        <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <label className="text-sm text-gray-400 mb-2 block">Secret Key</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Enter superadmin secret"
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
          />
          <button type="submit" disabled={loading || !secret.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white font-semibold py-3 rounded-xl transition text-sm">
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-700 mt-4">
          This page is not publicly accessible
        </p>
      </div>
    </div>
  );

  // ── Dashboard ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h1 className="font-bold text-white text-sm">QRunch Super Admin</h1>
            <p className="text-xs text-gray-500">Platform Control Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOwners}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition">
            🔄 Refresh
          </button>
          <button onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-3 py-1.5 rounded-lg transition">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Owners',      value: owners.length,      color: 'text-white'        },
            { label: 'Total Restaurants', value: totalRestaurants,   color: 'text-blue-400'     },
            { label: 'Active Subs',       value: activeCount,        color: 'text-green-400'    },
            { label: 'Inactive Subs',     value: inactiveCount,      color: 'text-red-400'      },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by owner name, email, or restaurant..."
            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600"
          />
        </div>

        {/* ── Owners List ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <span className="text-5xl block mb-3">👤</span>
            <p className="text-sm">No owners found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(owner => {
              const isExpanded = expandedId === owner._id;
              return (
                <div key={owner._id}
                  className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

                  {/* Owner Row */}
                  <div className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 font-bold text-orange-400 text-sm">
                      {owner.ownerName?.[0]?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : owner._id)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">{owner.ownerName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          owner.subscriptionActive
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}>
                          {owner.subscriptionActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {owner.region === 'india' ? '🇮🇳' : '🇺🇸'} {owner.region}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{owner.email}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {owner.restaurants?.length || 0} restaurant{(owner.restaurants?.length || 0) !== 1 ? 's' : ''} ·
                        Joined {new Date(owner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : owner._id)}
                        className="text-gray-600 hover:text-gray-400 text-xs px-2 py-1 rounded-lg transition">
                        {isExpanded ? '▲' : '▼'}
                      </button>
                      <button
                        onClick={() => handleToggle(owner)}
                        disabled={toggling === owner._id}
                        className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                          owner.subscriptionActive
                            ? 'bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900'
                            : 'bg-green-900/30 hover:bg-green-900/60 text-green-400 border border-green-900'
                        } disabled:opacity-40`}>
                        {toggling === owner._id
                          ? '...'
                          : owner.subscriptionActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded — restaurants list */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 px-4 py-3 bg-gray-950/50">
                      {!owner.restaurants?.length ? (
                        <p className="text-xs text-gray-600 py-2">No restaurants registered</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                            Restaurants ({owner.restaurants.length})
                          </p>
                          {owner.restaurants.map(r => (
                            <div key={r._id}
                              className="flex items-center justify-between bg-gray-900 rounded-xl px-3 py-2.5 border border-gray-800">
                              <div>
                                <p className="text-sm text-white font-medium">{r.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  ID: <span className="font-mono">{r._id}</span>
                                </p>
                                {r.gst?.enabled && (
                                  <p className="text-xs text-blue-400 mt-0.5">
                                    GST {r.gst.rate}%
                                    {r.gst.gstin ? ` · ${r.gst.gstin}` : ''}
                                  </p>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                r.region === 'india'
                                  ? 'bg-orange-900/30 text-orange-400'
                                  : 'bg-blue-900/30 text-blue-400'
                              }`}>
                                {r.region === 'india' ? '🇮🇳 India' : '🇺🇸 USA'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Owner details */}
                      <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-2">
                        <div className="bg-gray-900 rounded-xl px-3 py-2 border border-gray-800">
                          <p className="text-xs text-gray-500">Owner ID</p>
                          <p className="text-xs font-mono text-gray-400 mt-0.5 break-all">{owner._id}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl px-3 py-2 border border-gray-800">
                          <p className="text-xs text-gray-500">Sign-in Method</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {owner.googleId ? '🔵 Google' : '📧 Email'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}