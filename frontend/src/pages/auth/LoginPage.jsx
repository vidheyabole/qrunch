import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { initiateGoogleLogin } from '../../api/authApi';

export default function LoginPage() {
  const { login }          = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate           = useNavigate();
  const [params]           = useSearchParams();
  const [form, setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Show error if Google auth failed
  useState(() => {
    if (params.get('error') === 'google_failed')
      toast.error('Google sign-in failed. Please try again.');
  }, []);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors">
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-lg">
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">QRunch</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Restaurant ordering, simplified.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Sign in to your account</h2>

          {/* Google Sign In */}
          <button onClick={initiateGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition mb-5">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Email</label>
              <input type="email" name="email" value={form.email} onChange={onChange}
                placeholder="you@restaurant.com" required
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400 dark:placeholder-gray-600" />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Password</label>
              <input type="password" name="password" value={form.password} onChange={onChange}
                placeholder="••••••••" required
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400 dark:placeholder-gray-600" />
            </div>
            <button type="submit" disabled={loading}
              className="mt-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-orange-500 hover:underline font-medium">
              Register your restaurant
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}