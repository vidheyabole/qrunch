import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../utils/languages';
import i18n from '../../i18n';

// variant: 'dropdown' (navbar) | 'grid' (landing page) | 'compact' (menu page)
export default function LanguageSelector({ variant = 'dropdown', selectedLang, onSelect, className = '' }) {
  const { t } = useTranslation();

  const handleDashboardChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('qrunch_ui_lang', code);
    if (onSelect) onSelect(code);
  };

  const handleCustomerChange = (code) => {
    if (onSelect) onSelect(code);
  };

  if (variant === 'dropdown') {
    // Dashboard navbar dropdown
    const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
    return (
      <select
        value={i18n.language}
        onChange={e => handleDashboardChange(e.target.value)}
        className={`text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 ${className}`}>
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
        ))}
      </select>
    );
  }

  if (variant === 'grid') {
    // Customer landing page — full language grid
    return (
      <div className={`grid grid-cols-3 gap-2 ${className}`}>
        {LANGUAGES.map(l => (
          <button key={l.code} onClick={() => handleCustomerChange(l.code)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
              selectedLang === l.code
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300 bg-white'
            }`}>
            <span className="text-xl">{l.flag}</span>
            <span className="text-xs font-semibold text-gray-700 leading-tight text-center">{l.native}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    // Customer menu page — compact horizontal selector
    const current = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];
    return (
      <select
        value={selectedLang || 'en'}
        onChange={e => handleCustomerChange(e.target.value)}
        className={`text-sm bg-orange-400/50 text-white border border-orange-300/50 rounded-full px-3 py-1 focus:outline-none ${className}`}>
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code} className="text-gray-800 bg-white">
            {l.flag} {l.native}
          </option>
        ))}
      </select>
    );
  }

  return null;
}