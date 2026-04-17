import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import { signup as signupApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  const passed = checks.filter(c => c.ok).length;
  const color = passed === 3 ? 'bg-emerald-500' : passed === 2 ? 'bg-amber-400' : 'bg-red-400';

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passed ? color : 'bg-slate-200'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(c => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
            <CheckCircle className="w-3 h-3" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Signup() {
  const navigate  = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ name: '', identifier: '', password: '', confirm: '' });
  const [showPw, setShowPw]    = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');
  const [emailSent, setEmailSent] = useState(false);  // show check-email screen
  const [signedUpEmail, setSignedUpEmail] = useState('');

  if (!authLoading && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app/dashboard'} replace />;
  }

  const isEmail = form.identifier.includes('@');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.identifier || !form.password) return setError('All fields are required.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        [isEmail ? 'email' : 'phone']: form.identifier.trim(),
        password: form.password,
      };
      const res = await signupApi(payload);
      const { token, user, verificationEmailSent } = res.data;
      login(token, user);

      // If email was provided, show verify screen; otherwise go straight to onboard
      if (verificationEmailSent && isEmail) {
        setSignedUpEmail(form.identifier.trim());
        setEmailSent(true);
      } else {
        navigate('/app/onboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Email sent confirmation screen ──────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-indigo-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox 📬</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            We sent a verification link to
          </p>
          <p className="font-bold text-slate-900 mb-6">{signedUpEmail}</p>
          <p className="text-slate-400 text-xs mb-8 leading-relaxed">
            Click the link in your email to activate your account. It expires in 24 hours.
            <br />Can't find it? Check your spam folder.
          </p>
          <Link to="/verify-email" className="btn btn-primary w-full py-3 mb-3 flex items-center justify-center">
            Resend Verification Email
          </Link>
          <Link to="/login" className="text-sm text-indigo-600 font-semibold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-2xl text-slate-900">Work<span className="text-indigo-600">Safe</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start protecting your income today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="Arjun Mehta"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="signup-identifier">Email or Phone Number</label>
              <input
                id="signup-identifier"
                type={isEmail ? 'email' : 'text'}
                className="form-input"
                placeholder="you@email.com or 9876543210"
                value={form.identifier}
                onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div>
              <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                className="form-input"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password"
              />
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
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
            </button>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              By signing up you agree to our coverage terms. WorkSafe covers lost income only — not health, accidents, or vehicle damage.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
