import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import toast from 'react-hot-toast';
import { connectGoogleAccount, disconnectGoogleAccount, initiateGoogleLogin } from '../../api/authApi';

const COMING_SOON = [
  { icon: '📱', title: 'QR Code Generator',  desc: 'Generate unique QR codes for each table.' },
  { icon: '📊', title: 'Analytics',          desc: 'View revenue, top items, and peak hours.' },
  { icon: '📦', title: 'Inventory Tracking', desc: 'Manage stock and hide sold-out items automatically.' },
  { icon: '👥', title: 'Staff Roles',        desc: 'Give your team the right level of access.' },
];

export default function DashboardHome() {
  const { owner, currentRestaurant, restaurants, addRestaurant, updateOwner } = useAuth();
  const { dark } = useTheme();
  const token = localStorage.getItem('qrunch_token');

  const [showModal, setShowModal]     = useState(false);
  const [newName, setNewName]         = useState('');
  const [adding, setAdding]           = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const trialDaysLeft = owner?.trialEnds
    ? Math.max(0, Math.ceil((new Date(owner.trialEnds) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleAdd = async e => {
    e.preventDefault();
    if (!newName.trim()) return toast.error('Please enter a restaurant name');
    setAdding(true);
    try {
      await addRestaurant(newName.trim());
      toast.success(`${newName.trim()} added! 🎉`);
      setNewName(''); setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add restaurant');
    } finally { setAdding(false); }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Disconnect your Google account?')) return;
    setDisconnecting(true);
    try {
      await disconnectGoogleAccount(token);
      updateOwner({ authMethod: 'email', googleId: null });
      toast.success('Google account disconnected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disconnect');
    } finally { setDisconnecting(false); }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-orange-500 text-white rounded-2xl p-6 mb-6 shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {owner?.avatar && (
              <img src={owner.avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white/40 shrink-0" />
            )}
            <div>
              <h2 className="text-2xl font-bold">Welcome to QRunch, {owner?.ownerName?.split(' ')[0]}! 🎉</h2>
              <p className="mt-1 text-orange-100 text-sm">
                Currently viewing: <span className="font-semibold">{currentRestaurant?.name}</span>
                {restaurants.length > 1 && <span className="ml-2 opacity-75">({restaurants.length} restaurants total)</span>}
              </p>
              <div className="mt-3 inline-block bg-white text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                🎁 Free Trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              </div>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="shrink-0 bg-white text-orange-500 hover:bg-orange-50 text-sm font-semibold px-4 py-2 rounded-xl transition">
            + Add Restaurant
          </button>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${owner?.subscriptionActive ? 'bg-green-400' : 'bg-red-400'}`} />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Subscription:{' '}
          <span className={`font-semibold ${owner?.subscriptionActive ? 'text-green-600' : 'text-red-500'}`}>
            {owner?.subscriptionActive ? 'Active' : 'Inactive'}
          </span>
        </p>
      </div>

      {/* Google Account Connection */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Account</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {owner?.authMethod === 'google' || owner?.authMethod === 'both'
                ? `Connected — ${owner.email}`
                : 'Not connected'}
            </p>
          </div>
        </div>
        {owner?.authMethod === 'email' ? (
          <button onClick={initiateGoogleLogin}
            className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg transition font-medium">
            Connect
          </button>
        ) : owner?.authMethod === 'both' ? (
          <button onClick={handleDisconnectGoogle} disabled={disconnecting}
            className="text-sm border border-red-200 dark:border-red-900 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-1.5 rounded-lg transition">
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <span className="text-xs text-green-500 font-medium">✅ Google only</span>
        )}
      </div>

      {/* Coming Soon */}
      <h3 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-4">Coming your way 🚀</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COMING_SOON.map(({ icon, title, desc }) => (
          <div key={title} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition">
            <div className="text-3xl mb-3">{icon}</div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{title}</h4>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Add Restaurant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Add New Restaurant</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
              This will be added to your account and you can switch between restaurants from the navbar.
            </p>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Sharma's Kitchen - Bandra" autoFocus
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setNewName(''); }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button type="submit" disabled={adding}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                  {adding ? 'Adding...' : 'Add Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}