import { useState } from 'react';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { useTheme } from '../../hooks/useTheme';
import FeedbackForm from '../../components/common/FeedbackForm';
import i18n from '../../i18n';

const STAFF_LANGS = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिन्दी'  },
  { code: 'mr', native: 'मराठी'   },
];

const ROLE_LABELS = {
  en: { manager: 'Manager', chef: 'Chef',          waiter: 'Waiter', logout: 'Logout'   },
  hi: { manager: 'मैनेजर',  chef: 'शेफ',            waiter: 'वेटर',   logout: 'लॉगआउट'  },
  mr: { manager: 'व्यवस्थापक', chef: 'शेफ',         waiter: 'वेटर',   logout: 'लॉगआउट'  },
};

const ROLE_COLORS = {
  manager: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  chef:    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  waiter:  'bg-blue-100   dark:bg-blue-900/30   text-blue-600   dark:text-blue-400',
};

export default function StaffLayout({ children }) {
  const { staff, staffLogout, updateStaffLanguage } = useStaffAuth();
  const { dark, toggleTheme } = useTheme();
  const [showFeedback, setShowFeedback] = useState(false);
  const lang = i18n.language || 'en';
  const L    = ROLE_LABELS[lang] || ROLE_LABELS.en;

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('qrunch_ui_lang', code);
    if (staff?.token) updateStaffLanguage(code, staff.token);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-30">
        {/* Left */}
        <div className="flex items-center gap-3">
          <span className="text-xl">🍽️</span>
          <span className="font-bold text-orange-500 text-sm">QRunch</span>
          <span className="text-xs text-gray-400 hidden sm:block">{staff?.restaurant?.name}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button onClick={toggleTheme}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-base">
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Language selector */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {STAFF_LANGS.map(l => (
              <button key={l.code} onClick={() => handleLanguageChange(l.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition
                  ${lang === l.code
                    ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {l.native}
              </button>
            ))}
          </div>

          {/* Feedback button */}
          <button onClick={() => setShowFeedback(true)}
            className="text-xs text-gray-400 hover:text-orange-500 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hidden sm:block">
            💬 Feedback
          </button>

          {/* Role badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:block ${ROLE_COLORS[staff?.role]}`}>
            {L[staff?.role]}
          </span>

          {/* Staff name */}
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{staff?.name}</span>

          {/* Logout */}
          <button onClick={staffLogout}
            className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {L.logout}
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6">
        {children}
      </main>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">💬 Give Feedback</h3>
              <button onClick={() => setShowFeedback(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
            </div>
            <div className="px-6 py-5">
              <FeedbackForm
                senderType="staff"
                senderName={staff?.name || ''}
                senderRole={staff?.role || ''}
                restaurantName={staff?.restaurant?.name || ''}
                compact={true}
                onSuccess={() => setTimeout(() => setShowFeedback(false), 2000)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}