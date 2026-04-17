import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader, Eye, EyeOff } from 'lucide-react';
import { login as loginApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]   = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const isEmail = form.identifier.includes('@');
      const res = await loginApi({
        [isEmail ? 'email' : 'phone']: form.identifier,
        password: form.password,
      });
      const { token, user } = res.data;
      if (user.role !== 'ADMIN') {
        setError('Access denied. Admin credentials required.');
        return;
      }
      login(token, user);
      navigate('/admin/overview');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">WorkSafe Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Internal monitoring portal</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="admin-id">
                Admin Email or Phone
              </label>
              <input
                id="admin-id" type="text" required
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin@worksafe.in"
                value={form.identifier}
                onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="admin-pw">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-pw"
                  type={showPw ? 'text' : 'password'} required
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <div className="p-3 bg-red-900/40 border border-red-700 rounded-xl text-red-400 text-sm">{error}</div>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
