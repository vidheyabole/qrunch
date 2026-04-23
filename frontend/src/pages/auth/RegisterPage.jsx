import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { initiateGoogleLogin } from '../../api/authApi';

const INIT = { ownerName: '', restaurantName: '', email: '', password: '', region: '' };

export default function RegisterPage() {
  const { register }           = useAuth();
  const { dark, toggleTheme }  = useTheme();
  const navigate               = useNavigate();
  const [form, setForm]        = useState(INIT);
  const [loading, setLoading]  = useState(false);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    if (!form.region) return toast.error('Please select your region');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to QRunch 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fields = [
    { label: 'Your Name',       name: 'ownerName',      type: 'text',     placeholder: 'e.g. Rahul Sharma' },
    { label: 'Restaurant Name', name: 'restaurantName', type: 'text',     placeholder: "e.g. Sharma's Kitchen" },
    { label: 'Email',           name: 'email',          type: 'email',    placeholder: 'you@restaurant.com' },
    { label: 'Password',        name: 'password',       type: 'password', placeholder: 'At least 6 characters' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-10 transition-colors">
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-lg">
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">QRunch</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Set up your restaurant in minutes.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Create your account</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">1 month free — no credit card required.</p>

          {/* Google Sign Up */}
          <button onClick={initiateGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition mb-5">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">or register with email</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {fields.map(f => (
              <div key={f.name}>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{f.label}</label>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={onChange}
                  placeholder={f.placeholder} required
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400 dark:placeholder-gray-600" />
              </div>
            ))}

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Region</label>
              <select name="region" value={form.region} onChange={onChange} required
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="" disabled>Select your region</option>
                <option value="india">🇮🇳 India</option>
                <option value="usa">🇺🇸 USA</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="mt-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}