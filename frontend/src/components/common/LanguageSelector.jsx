import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LANGUAGES from '../../utils/languages';

export default function LanguageSelector({ variant = 'dropdown', onSelect }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('qrunch_ui_lang', code);
    setOpen(false);
    if (onSelect) onSelect(code);
  };

  // ── Dropdown (Navbar) ───────────────────────────────────────
  if (variant === 'dropdown') {
    const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
    return (
      <>
        {/* Click outside to close */}
        {open && (
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        )}
        <div className="relative z-50">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <span>{current.flag}</span>
            <span className="hidden sm:block">{current.native}</span>
            <span className="text-xs">{open ? '▴' : '▾'}</span>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => handleChange(lang.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition
                    ${i18n.language === lang.code ? 'text-orange-500 font-semibold bg-orange-50 dark:bg-orange-900/20' : 'text-gray-700 dark:text-gray-300'}`}>
                  <span>{lang.flag}</span>
                  <span>{lang.native}</span>
                  {i18n.language === lang.code && <span className="ml-auto text-orange-500">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Grid (Customer Landing Page) ────────────────────────────
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm mx-auto">
        {LANGUAGES.map(lang => (
          <button key={lang.code} onClick={() => handleChange(lang.code)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition active:scale-95
              ${i18n.language === lang.code
                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-300'
              }`}>
            <span>{lang.flag}</span>
            <span>{lang.native}</span>
          </button>
        ))}
      </div>
    );
  }

  // ── Compact (CustomerMenuPage header) ───────────────────────
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <div className="relative z-50">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          <span>{current.flag}</span>
          <span>{current.native}</span>
          <span>{open ? '▴' : '▾'}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
            {LANGUAGES.map(lang => (
              <button key={lang.code} onClick={() => handleChange(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition
                  ${i18n.language === lang.code ? 'text-orange-500 font-semibold bg-orange-50 dark:bg-orange-900/20' : 'text-gray-700 dark:text-gray-300'}`}>
                <span>{lang.flag}</span>
                <span>{lang.native}</span>
                {i18n.language === lang.code && <span className="ml-auto text-orange-500">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}