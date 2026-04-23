import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const NAV = [
    { icon: '🏠', key: 'dashboard', path: '/dashboard',           active: true  },
    { icon: '🍽️', key: 'menu',      path: '/dashboard/menu',      active: true  },
    { icon: '🪑', key: 'tables',    path: '/dashboard/tables',    active: true  },
    { icon: '🔔', key: 'orders',    path: '/dashboard/orders',    active: true  },
    { icon: '📊', key: 'analytics', path: '/dashboard/analytics', active: true  },
    { icon: '📦', key: 'inventory', path: '/dashboard/inventory', active: true  },
    { icon: '👥', key: 'staff',     path: '#',                    active: false },
  ];

  return (
    <aside className={`
      fixed top-14 left-0 h-[calc(100vh-56px)] w-56
      bg-white dark:bg-gray-900
      border-r border-gray-200 dark:border-gray-700
      z-30 transition-transform duration-300
      ${open ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      <nav className="p-3 flex flex-col gap-1">
        {NAV.map(({ icon, key, path, active }) =>
          active ? (
            <Link key={key} to={path} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                ${pathname === path
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
              <span>{icon}</span><span>{t(`nav.${key}`)}</span>
            </Link>
          ) : (
            <div key={key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed">
              <span>{icon}</span>
              <span>{t(`nav.${key}`)}</span>
              <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 px-1.5 py-0.5 rounded">{t('nav.soon')}</span>
            </div>
          )
        )}
      </nav>
    </aside>
  );
}