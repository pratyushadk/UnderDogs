import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Loader, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';

const authApi = axios.create({ baseURL: '/auth', timeout: 15000 });

export default function VerifyEmail() {
  const [params]  = useSearchParams();
  const token     = params.get('token');

  const [status,    setStatus]    = useState('loading'); // loading | success | error | no_token
  const [message,   setMessage]   = useState('');
  const [email,     setEmail]     = useState('');
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('no_token'); return; }

    authApi.get(`/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setResending(true);
    setResendMsg('');
    try {
      const jwt = localStorage.getItem('ws_jwt');
      const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
      const res = await authApi.post('/resend-verification', { email: email.trim() }, { headers });
      setResent(true);
      setResendMsg(res.data.message || 'Check your inbox.');
      // If already verified, show success state so they can log in
      if (res.data.already_verified) {
        setStatus('success');
        setMessage('Your email is already verified! You can log in now.');
      }
    } catch (err) {
      setResendMsg(err.response?.data?.error || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            WorkSafe<span className="text-indigo-500">.</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">

          {/* Loading */}
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader className="w-12 h-12 text-indigo-500 mx-auto animate-spin" />
              <h2 className="text-xl font-bold text-slate-900">Verifying your email…</h2>
              <p className="text-slate-500 text-sm">Please wait a moment.</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="space-y-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Email Verified! 🎉</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
              <p className="text-slate-400 text-sm">Your WorkSafe account is ready. Log in to start your income protection.</p>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md hover:shadow-lg"
              >
                Continue to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Error — with email resend form */}
          {status === 'error' && (
            <div className="space-y-5 text-left">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 text-center">Verification Failed</h2>
              <p className="text-slate-500 text-sm leading-relaxed text-center">{message}</p>

              {!resent ? (
                <form onSubmit={handleResend} className="space-y-3 pt-2">
                  <p className="text-sm font-semibold text-slate-700">Get a new verification link:</p>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  {resendMsg && (
                    <p className="text-sm text-red-500">{resendMsg}</p>
                  )}
                  <button
                    type="submit"
                    disabled={resending}
                    className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition"
                  >
                    {resending
                      ? <><Loader className="w-4 h-4 animate-spin" /> Sending…</>
                      : <><Mail className="w-4 h-4" /> Send New Verification Link</>
                    }
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl py-3 px-4 text-sm font-semibold text-center">
                  ✅ {resendMsg}
                </div>
              )}

              <Link to="/login" className="block text-sm text-indigo-500 hover:text-indigo-700 font-medium text-center pt-1">
                Back to Login
              </Link>
            </div>
          )}

          {/* No token — check inbox + resend form */}
          {status === 'no_token' && (
            <div className="space-y-5 text-left">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 text-center">Verify Your Email</h2>
              <p className="text-slate-500 text-sm leading-relaxed text-center">
                Enter your email below to receive a new verification link.
              </p>

              {!resent ? (
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {resendMsg && <p className="text-sm text-red-500">{resendMsg}</p>}
                  <button
                    type="submit"
                    disabled={resending}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition"
                  >
                    {resending
                      ? <><Loader className="w-4 h-4 animate-spin" /> Sending…</>
                      : <><Mail className="w-4 h-4" /> Send Verification Link</>
                    }
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl py-3 px-4 text-sm font-semibold text-center">
                  ✅ {resendMsg}
                </div>
              )}

              <Link to="/login" className="block text-sm text-indigo-500 hover:text-indigo-700 font-medium text-center">
                Back to Login
              </Link>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 WorkSafe · DEVTrails · All rights reserved
        </p>
      </div>
    </div>
  );
}
