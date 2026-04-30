import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import LanguageSelector from './LanguageSelector';

export default function Navbar({ onMenuClick }) {
  const { owner, restaurants, currentRestaurant, switchRestaurant, addRestaurant, logout } = useAuth();
  const { dark, toggleTheme: toggleDark } = useTheme();
  const { t } = useTranslation();
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false);
  const [showAddModal,       setShowAddModal]       = useState(false);
  const [newName,            setNewName]            = useState('');
  const [adding,             setAdding]             = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    await addRestaurant(newName.trim());
    setAdding(false);
    setNewName('');
    setShowAddModal(false);
  };

  return (
    <>
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 gap-3 sticky top-0 z-30">

        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            ☰
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-bold text-orange-500 text-sm hidden sm:block">QRunch</span>
          </Link>
        </div>

        {/* Centre: restaurant selector */}
        {restaurants.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowRestaurantMenu(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:border-orange-300 transition max-w-[220px]">
              {/* Logo thumbnail */}
              {currentRestaurant?.logo ? (
                <img src={currentRestaurant.logo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
              ) : (
                <span className="text-base shrink-0">🍽️</span>
              )}
              <span className="truncate font-medium">{currentRestaurant?.name || 'Select restaurant'}</span>
              <span className="text-gray-400 text-xs shrink-0">▾</span>
            </button>

            {showRestaurantMenu && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
                {restaurants.map(r => (
                  <button key={r._id}
                    onClick={() => { switchRestaurant(r._id); setShowRestaurantMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition first:rounded-t-xl flex items-center gap-2
                      ${currentRestaurant?._id === r._id ? 'text-orange-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {/* Logo per restaurant */}
                    {r.logo ? (
                      <img src={r.logo} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                        <span className="text-xs">🍽️</span>
                      </div>
                    )}
                    <span className="truncate">{r.name}</span>
                    {currentRestaurant?._id === r._id && <span className="ml-auto text-orange-500 shrink-0">✓</span>}
                  </button>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => { setShowRestaurantMenu(false); setShowAddModal(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition rounded-b-xl">
                    + Add restaurant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right: dark mode + language + logout */}
        <div className="flex items-center gap-2">
          <button onClick={toggleDark}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-base"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <LanguageSelector variant="dropdown" />
          {owner && (
            <button onClick={logout}
              className="text-xs text-gray-500 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              {t('common.logout')}
            </button>
          )}
        </div>
      </header>

      {showRestaurantMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowRestaurantMenu(false)} />
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Add Restaurant</h3>
            <p className="text-sm text-gray-400 mb-4">Give your new restaurant a name.</p>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Sharma's Kitchen - Bandra" autoFocus
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowAddModal(false); setNewName(''); }}
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
    </>
  );
}