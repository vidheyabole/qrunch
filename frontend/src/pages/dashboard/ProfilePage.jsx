import { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, updateProfilePicture, updateRestaurantLogo, initiateGoogleLogin, disconnectGoogleAccount } from '../../api/authApi';
import toast from 'react-hot-toast';
import FeedbackForm from '../../components/common/FeedbackForm';

export default function ProfilePage() {
  const { owner, restaurants, currentRestaurant, updateOwner, updateRestaurants } = useAuth();
  const token = owner?.token;

  // ── Upload refs ──────────────────────────────────────────
  const profileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [profilePreview, setProfilePreview] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ── Selected restaurant for logo ─────────────────────────
  const [selectedRestId, setSelectedRestId] = useState(currentRestaurant?._id || '');
  const selectedRest = restaurants.find(r => r._id === selectedRestId) || currentRestaurant;

  // ── Profile form ─────────────────────────────────────────
  const [ownerName, setOwnerName] = useState(owner?.ownerName || '');
  const [restaurantName, setRestaurantName] = useState(currentRestaurant?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const trialDaysLeft = owner?.trialEnds
    ? Math.max(0, Math.ceil((new Date(owner.trialEnds) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  // ── Profile picture ──────────────────────────────────────
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePreview(URL.createObjectURL(file));
    setUploadingProfile(true);
    try {
      const data = await updateProfilePicture(file, token);
      updateOwner({ profilePicture: data.profilePicture });
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Failed to upload profile picture');
      setProfilePreview('');
    }
    setUploadingProfile(false);
  };

  // ── Restaurant logo ──────────────────────────────────────
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    try {
      const data = await updateRestaurantLogo(file, selectedRestId, token);
      updateRestaurants(data.restaurants);
      toast.success(`Logo updated for ${selectedRest?.name}!`);
    } catch {
      toast.error('Failed to upload logo');
      setLogoPreview('');
    }
    setUploadingLogo(false);
  };

  // ── Save profile ─────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword)
      return toast.error('New passwords do not match');
    if (newPassword && newPassword.length < 6)
      return toast.error('Password must be at least 6 characters');
    setSavingProfile(true);
    try {
      const payload = {
        ownerName,
        restaurantName,
        restaurantId: currentRestaurant?._id,
        ...(newPassword ? { currentPassword, newPassword } : {})
      };
      const data = await updateProfile(payload, token);
      updateOwner({ ownerName: data.ownerName });
      updateRestaurants(data.restaurants);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSavingProfile(false);
  };

  // ── Google disconnect ────────────────────────────────────
  const handleDisconnectGoogle = async () => {
    if (!confirm('Disconnect your Google account?')) return;
    setDisconnecting(true);
    try {
      await disconnectGoogleAccount(token);
      updateOwner({ authMethod: 'email', googleId: null });
      toast.success('Google account disconnected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disconnect');
    }
    setDisconnecting(false);
  };

  const profilePic = profilePreview || owner?.profilePicture || owner?.avatar || '';
  const currentLogo = logoPreview || selectedRest?.logo || '';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">👤 Profile</h1>

      {/* ── Subscription Status ── */}
      <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between gap-4
        ${owner?.subscriptionActive
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${owner?.subscriptionActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {owner?.subscriptionActive ? 'Subscription Active ✅' : 'Subscription Inactive ❌'}
            </p>
            {owner?.subscriptionActive && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {trialDaysLeft > 0
                  ? `Free trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`
                  : 'Pro plan active'}
              </p>
            )}
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full
          ${owner?.region === 'india'
            ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
          {owner?.region === 'india' ? '🇮🇳 India' : '🇺🇸 USA'}
        </span>
      </div>

      {/* ── Photos Section ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-5">Photos</h2>
        <div className="flex flex-col sm:flex-row gap-8">

          {/* Profile picture */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow">
                {profilePic
                  ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-3xl">👤</span>}
              </div>
              {uploadingProfile && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium transition disabled:opacity-50">
              {uploadingProfile ? 'Uploading...' : '📷 Change Photo'}
            </button>
            <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
            <p className="text-xs text-gray-400">Your Profile Picture</p>
          </div>

          {/* Restaurant logo */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow">
                {currentLogo
                  ? <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="text-3xl">🍽️</span>}
              </div>
              {uploadingLogo && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Restaurant picker */}
            {restaurants.length > 1 && (
              <select value={selectedRestId} onChange={e => { setSelectedRestId(e.target.value); setLogoPreview(''); }}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400">
                {restaurants.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            )}

            <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium transition disabled:opacity-50">
              {uploadingLogo ? 'Uploading...' : '🖼️ Upload Logo'}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <p className="text-xs text-gray-400 text-center">
              Restaurant Logo
              <span className="block text-gray-300 dark:text-gray-600">(optional)</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Profile Form ── */}
      <form onSubmit={handleSaveProfile}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-5">Account Details</h2>
        <div className="flex flex-col gap-4">

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Your Name</label>
            <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">Email</label>
            <input type="email" value={owner?.email || ''} disabled
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-400 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
              Current Restaurant Name
              <span className="text-xs text-gray-400 ml-1">(updates selected restaurant)</span>
            </label>
            <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          {/* Change Password */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Change Password</p>
            {owner?.authMethod === 'google' ? (
              <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                Your account uses Google Sign-In. Password change is not available.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full border bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400
                    ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

          <button type="submit" disabled={savingProfile}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl text-sm transition mt-2">
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* ── Google Account ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Google Account</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {owner?.authMethod === 'google' || owner?.authMethod === 'both'
                  ? `Connected — ${owner.email}`
                  : 'Not connected'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {owner?.authMethod === 'both'
                  ? 'You can sign in with both email and Google'
                  : owner?.authMethod === 'google'
                    ? 'Google-only account'
                    : 'Connect to enable Google Sign-In'}
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
              className="text-sm border border-red-200 dark:border-red-900 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-1.5 rounded-lg transition disabled:opacity-50">
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <span className="text-xs text-green-500 font-medium">✅ Google only</span>
          )}
        </div>
      </div>

      {/* ── Account Info ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Account Info</h2>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Member since</span>
            <span className="text-gray-800 dark:text-gray-100 font-medium">
              {owner?.createdAt
                ? new Date(owner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Sign-in method</span>
            <span className="text-gray-800 dark:text-gray-100 font-medium">
              {owner?.authMethod === 'both' ? '🔐 Email + Google' : owner?.authMethod === 'google' ? '🔵 Google' : '✉️ Email'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Plan</span>
            <span className={`font-semibold ${owner?.subscriptionActive ? 'text-green-600' : 'text-red-500'}`}>
              {owner?.subscriptionActive
                ? trialDaysLeft > 0 ? `🎁 Free Trial (${trialDaysLeft}d left)` : '⭐ Pro'
                : '❌ Inactive'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Restaurants</span>
            <span className="text-gray-800 dark:text-gray-100 font-medium">{restaurants.length}</span>
          </div>
        </div>
      </div>
      {/* ── Feedback Section ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mt-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">💬 Send Feedback</h2>
        <p className="text-xs text-gray-400 mb-5">Help us improve QRunch — your feedback goes directly to the team.</p>
        <FeedbackForm
          senderType="owner"
          senderName={owner?.ownerName || ''}
          senderRole="owner"
          restaurantName={currentRestaurant?.name || ''}
          ownerName={owner?.ownerName || ''}
        />
      </div>
    </div>
  );
}