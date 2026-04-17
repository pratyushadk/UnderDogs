/**
 * WorkSafe API Service — Axios client
 * All calls go through /api (proxied by Vite to port 4000)
 */
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE_URL    = `${BACKEND_URL}/api`;
const AUTH_URL    = `${BACKEND_URL}/auth`;
const ADMIN_URL   = `${BACKEND_URL}/admin`;

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });
const authApi  = axios.create({ baseURL: AUTH_URL,  timeout: 15000 });
const adminApi = axios.create({ baseURL: ADMIN_URL,  timeout: 15000 });

// ── Auto-inject JWT on every request ──────────────────────────
const injectToken = cfg => {
  const token = localStorage.getItem('ws_jwt');
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  return cfg;
};
api.interceptors.request.use(injectToken);
authApi.interceptors.request.use(injectToken);
adminApi.interceptors.request.use(injectToken);

// ── Auth ───────────────────────────────────────────────────────
export const signup               = (data)  => authApi.post('/signup', data);
export const login                = (data)  => authApi.post('/login',  data);
export const getMe                = ()      => authApi.get('/me');
export const verifyEmail          = (token) => authApi.get(`/verify-email?token=${token}`);
export const resendVerification   = ()      => authApi.post('/resend-verification');

// ── Onboarding ────────────────────────────────────────────────
export const fetchProfile     = (id)   => api.get(`/onboarding/profile?platform_rider_id=${encodeURIComponent(id)}`);
export const submitOnboarding = (data) => api.post('/onboarding/subscribe', data);
export const pingLocation     = (data) => api.post('/onboarding/ping', data);

// ── Zones ─────────────────────────────────────────────────────
export const fetchZones = () => api.get('/zones');

// ── Claims & Policy ───────────────────────────────────────────
export const fetchClaims       = ()    => api.get('/claims/mine');
export const fetchDashboard    = ()    => api.get('/claims/dashboard');
export const fetchPolicyStatus = ()    => api.get('/claims/policy-status');
export const fetchEvent        = (id)  => api.get(`/claims/event/${id}`);

// ── Reports ───────────────────────────────────────────────────
export const submitReport = (data) => api.post('/reports/submit', data);

// ── Payments ──────────────────────────────────────────────────
export const createPaymentOrder  = (data) => api.post('/payments/create-order', data);
export const verifyPayment       = (data) => api.post('/payments/verify', data);
export const fetchPaymentHistory = ()     => api.get('/payments/history');

// ── Notifications ─────────────────────────────────────────────
export const fetchNotifications  = ()    => api.get('/notifications');
export const markNotifRead       = (id)  => api.put(`/notifications/${id}/read`);
export const markAllNotifsRead   = ()    => api.put('/notifications/read-all');

// ── Admin ─────────────────────────────────────────────────────
export const adminOverview      = ()      => adminApi.get('/overview');
export const adminZones         = ()      => adminApi.get('/zones');
export const adminUsers         = (page)  => adminApi.get(`/users?page=${page || 1}`);
export const adminTransactions  = (q)     => adminApi.get(`/transactions?${new URLSearchParams(q || {}).toString()}`);
export const adminFraudLog      = ()      => adminApi.get('/fraud-log');
export const adminDisruptions   = ()      => adminApi.get('/disruption-events');
export const adminReports       = ()      => adminApi.get('/reports');

// ── Health ────────────────────────────────────────────────────
export const fetchHealth = () => axios.get(`${BACKEND_URL || ''}/health`);

export default api;

