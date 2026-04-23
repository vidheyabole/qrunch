import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import LanguageSelector from './LanguageSelector';

export default function Navbar({ onMenuClick }) {
  const { owner, restaurants, currentRestaurant, switchRestaurant, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300">
            ☰
          </button>
          <span className="text-orange-500 text-2xl font-bold tracking-tight">QRunch</span>
          {restaurants.length > 0 && (
            <select value={currentRestaurant?._id || ''} onChange={e => switchRestaurant(e.target.value)}
              className="hidden sm:block text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400">
              {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300 text-sm hidden sm:block">
            Hey, {owner?.ownerName?.split(' ')[0]} 👋
          </span>
          {/* Language selector for owner/staff */}
          <LanguageSelector variant="dropdown" className="hidden sm:block" />
          <button onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-lg">
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={handleLogout}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-1.5 rounded-lg transition">
            {t('common.logout')}
          </button>
        </div>
      </div>

      {/* Mobile second row */}
      <div className="sm:hidden px-4 pb-2 flex gap-2">
        {restaurants.length > 0 && (
          <select value={currentRestaurant?._id || ''} onChange={e => switchRestaurant(e.target.value)}
            className="flex-1 text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
            {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        )}
        <LanguageSelector variant="dropdown" />
      </div>
    </nav>
  );
}