import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const NAV = [
    { icon: '🏠', label: 'Dashboard',   path: '/dashboard'           },
    { icon: '🍽️', label: 'Menu Builder', path: '/dashboard/menu'      },
    { icon: '📋', label: 'Orders',       path: '/dashboard/orders'    },
    { icon: '🪑', label: 'Tables & QR',  path: '/dashboard/tables'    },
    { icon: '📦', label: 'Inventory',    path: '/dashboard/inventory' },
    { icon: '📊', label: 'Analytics',    path: '/dashboard/analytics' },
    { icon: '👥', label: 'Staff',        path: '/dashboard/staff'     },
    { icon: '👤', label: 'Profile',      path: '/dashboard/profile'   },
  ];

  return (
    <aside className={`
      fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56
      bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
      z-30 transition-transform duration-200
      ${open ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      <nav className="p-3 flex flex-col gap-1">
        {NAV.map(({ icon, label, path }) => (
          <Link key={path} to={path} onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
              ${pathname === path
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
            <span>{icon}</span><span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}