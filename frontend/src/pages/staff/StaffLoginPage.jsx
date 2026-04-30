import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import i18n from '../../i18n';

const STAFF_LANGS = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी'   },
  { code: 'mr', label: 'Marathi',  native: 'मराठी'    },
];

const LABELS = {
  en: { title: 'Staff Login', loginId: 'Login ID', password: 'Password', login: 'Login', logging: 'Logging in...', error: 'Invalid login ID or password' },
  hi: { title: 'स्टाफ लॉगिन', loginId: 'लॉगिन ID', password: 'पासवर्ड', login: 'लॉगिन', logging: 'लॉगिन हो रहा है...', error: 'गलत लॉगिन ID या पासवर्ड' },
  mr: { title: 'स्टाफ लॉगिन', loginId: 'लॉगिन ID', password: 'पासवर्ड', login: 'लॉगिन', logging: 'लॉगिन होत आहे...', error: 'चुकीचे लॉगिन ID किंवा पासवर्ड' },
};

export default function StaffLoginPage() {
  const navigate        = useNavigate();
  const { staffLogin }  = useStaffAuth();
  const [lang,     setLang]     = useState('en');
  const [loginId,  setLoginId]  = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const L = LABELS[lang];

  const handleLang = (code) => {
    setLang(code);
    i18n.changeLanguage(code);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await staffLogin(loginId, password);
      navigate('/staff');
    } catch (err) {
      setError(L.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-4xl">🍽️</span>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-2">{L.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5">QRunch</p>
        </div>

        {/* Language selector */}
        <div className="flex gap-2 justify-center mb-5">
          {STAFF_LANGS.map(l => (
            <button key={l.code} onClick={() => handleLang(l.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                ${lang === l.code
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
              {l.native}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-sm px-4 py-2.5 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="text" value={loginId} onChange={e => setLoginId(e.target.value)}
            placeholder={L.loginId} required autoFocus
            className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={L.password} required
            className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-2xl transition mt-1">
            {loading ? L.logging : L.login}
          </button>
        </form>
      </div>
    </div>
  );
}