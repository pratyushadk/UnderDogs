import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader } from 'lucide-react';
import { login as loginApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate   = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (!authLoading && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app/dashboard'} replace />;
  }

  const isEmail = form.identifier.includes('@');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) return setError('All fields are required.');
    setLoading(true); setError('');

    try {
      const payload = {
        [isEmail ? 'email' : 'phone']: form.identifier,
        password: form.password,
      };
      const res = await loginApi(payload);
      const { token, user, onboardingRequired } = res.data;

      login(token, user);

      // Enforce email verification before allowing access
      if (user.email && !user.is_verified) {
        navigate('/verify-email'); // shows "check your inbox" screen
        return;
      }

      if (user.role === 'ADMIN') {
        navigate('/admin/overview');
      } else if (onboardingRequired) {
        navigate('/app/onboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-2xl text-slate-900">Work<span className="text-indigo-600">Safe</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your protection account</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label" htmlFor="login-identifier">Email or Phone</label>
              <input
                id="login-identifier"
                type={isEmail ? 'email' : 'text'}
                className="form-input"
                placeholder="you@email.com or 9876543210"
                value={form.identifier}
                onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
