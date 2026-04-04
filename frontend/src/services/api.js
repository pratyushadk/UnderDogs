/**
 * WorkSafe API Service — Axios client
 * All calls go through /api (proxied by Vite to port 4000)
 */
import axios from 'axios';

const BASE_URL = '/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// ── Auto-inject JWT ───────────────────────────────────────────
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ws_jwt');
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  return cfg;
});

// ── Onboarding ────────────────────────────────────────────────
export const fetchProfile    = (id)   => api.get(`/onboarding/profile?platform_rider_id=${encodeURIComponent(id)}`);
export const submitOnboarding = (data) => api.post('/onboarding/subscribe', data);
export const pingLocation    = (data)  => api.post('/onboarding/ping', data);

// ── Zones ─────────────────────────────────────────────────────
export const fetchZones      = ()      => api.get('/zones');

// ── Claims & Policy ───────────────────────────────────────────
export const fetchClaims      = ()     => api.get('/claims/mine');
export const fetchDashboard   = ()     => api.get('/claims/dashboard');
export const fetchPolicyStatus = ()    => api.get('/claims/policy-status');
export const fetchEvent        = (id)  => api.get(`/claims/event/${id}`);

// ── Reports ───────────────────────────────────────────────────
export const submitReport    = (data)  => api.post('/reports/submit', data);

// ── Health ────────────────────────────────────────────────────
export const fetchHealth     = ()      => axios.get('/health');

export default api;
