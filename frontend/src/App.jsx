/**
 * WorkSafe App — React Router v6 Entry Point
 * Routes:
 *   /              → Landing page (public)
 *   /login         → Login (public)
 *   /signup        → Signup (public)
 *   /app/onboard   → Onboarding (authenticated users without policy)
 *   /app/dashboard → Dashboard (authenticated)
 *   /app/report    → Report Disruption (authenticated)
 *   /app/payments  → Payment History (authenticated)
 *   /app/insurance → Insurance Details (authenticated)
 *   /app/loyalty   → Loyalty Page (authenticated)
 *   /admin/*       → Admin portal (ADMIN role)
 *   /admin/login   → Admin login
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Shield, LayoutDashboard, FileWarning, LogOut, Clock, Database, Bell, CreditCard, Award, FileText, ChevronDown, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { fetchHealth, fetchNotifications, markAllNotifsRead } from './services/api.js';

// Pages
import Landing          from './pages/Landing.jsx';
import Login            from './pages/Login.jsx';
import Signup           from './pages/Signup.jsx';
import Onboarding       from './pages/Onboarding.jsx';
import Dashboard        from './pages/Dashboard.jsx';
import Report           from './pages/Report.jsx';
import PaymentHistory   from './pages/PaymentHistory.jsx';
import InsuranceDetails from './pages/InsuranceDetails.jsx';
import LoyaltyPage      from './pages/LoyaltyPage.jsx';
import VerifyEmail      from './pages/VerifyEmail.jsx';

// Admin Pages
import AdminLogin       from './pages/admin/AdminLogin.jsx';
import AdminShell       from './pages/admin/AdminShell.jsx';

import './index.css';

// ── Protected Route wrapper ───────────────────────────────────
function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner w-8 h-8 border-4" />
    </div>
  );

  // Not logged in — admin routes go to admin/login, others go to /login
  if (!user) {
    const isAdminRoute = location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;
  return children;
}

// ── Notification Bell ─────────────────────────────────────────
function NotifBell() {
  const [data, setData]   = useState({ notifications: [], unread_count: 0 });
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const load = async () => {
      try { const r = await fetchNotifications(); setData(r.data); } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAll = async () => {
    await markAllNotifsRead();
    setData(d => ({ ...d, notifications: d.notifications.map(n => ({ ...n, is_read: true })), unread_count: 0 }));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative btn btn-ghost btn-sm p-2"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {data.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {Math.min(data.unread_count, 9)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-sm">Notifications</span>
            {data.unread_count > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-indigo-600 font-semibold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No notifications</div>
            ) : (
              data.notifications.map(n => (
                <div key={n.notif_id} className={`px-4 py-3 border-b border-slate-50 ${!n.is_read ? 'bg-indigo-50/50' : ''}`}>
                  <div className="font-semibold text-slate-900 text-sm">{n.title}</div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">{n.body}</div>
                  <div className="text-slate-400 text-[10px] mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── App Nav (for authenticated rider routes) ──────────────────
function AppNav() {
  const { logout } = useAuth();
  const location   = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (path) => location.pathname === path;

  const NAV_LINKS = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/report',    icon: FileWarning,     label: 'Report'    },
    { to: '/app/payments',  icon: CreditCard,      label: 'Payments'  },
    { to: '/app/insurance', icon: FileText,        label: 'Insurance' },
    { to: '/app/loyalty',   icon: Award,           label: 'Loyalty'   },
  ];

  return (
    <nav className="nav shadow-sm">
      <div className="nav-brand">
        <Link to="/app/dashboard" className="flex items-center gap-2">
          <div className="nav-brand-icon"><Shield className="w-5 h-5" strokeWidth={2.5} /></div>
          <span className="nav-brand-text">Work<span>Safe</span></span>
        </Link>
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:flex items-center gap-1 nav-tabs">
        {NAV_LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-tab ${isActive(l.to) ? 'active' : ''}`}
          >
            <l.icon className="w-4 h-4" />
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <NotifBell />
        <button className="btn btn-ghost btn-sm hidden sm:flex" onClick={logout}>
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
        {/* Mobile hamburger */}
        <button className="sm:hidden btn btn-ghost btn-sm p-2" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg sm:hidden z-50">
          {NAV_LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium ${isActive(l.to) ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}
              onClick={() => setMobileOpen(false)}
            >
              <l.icon className="w-4 h-4" /> {l.label}
            </Link>
          ))}
          <button
            className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-600 w-full border-t border-slate-100"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

// ── Status Bar ────────────────────────────────────────────────
function StatusBar() {
  const [health, setHealth] = useState(null);
  const [now, setNow]       = useState('');

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const tId = setInterval(tick, 60000);
    const poll = async () => { try { const r = await fetchHealth(); setHealth(r.data); } catch {} };
    poll();
    const hId = setInterval(poll, 30000);
    return () => { clearInterval(tId); clearInterval(hId); };
  }, []);

  const alive = !!health;
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className={`status-dot ${alive ? '' : 'offline'}`} />
        <span className="status-label">{alive ? 'All Systems Operational' : 'Platform Offline'}</span>
        {alive && (
          <span className="status-meta hidden sm:flex">
            <Database className="w-3 h-3 ml-2" /><span>{health?.database?.name || '—'}</span>
            <span className="text-slate-300">|</span>
            <span>DI Threshold: {health?.config?.diThreshold || '—'}</span>
          </span>
        )}
      </div>
      <span className="status-time flex items-center gap-2">
        <Clock className="w-3 h-3" /> {now} IST
      </span>
    </div>
  );
}

// ── App Shell (authenticated rider area) ─────────────────────
function AppShell({ children }) {
  return (
    <>
      <StatusBar />
      <AppNav />
      <div className="page-shell">{children}</div>
    </>
  );
}

// ── Router ────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"             element={<Landing     />} />
      <Route path="/login"        element={<Login       />} />
      <Route path="/signup"       element={<Signup      />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Authenticated rider app */}
      <Route path="/app/onboard"   element={<RequireAuth><AppShell><Onboarding /></AppShell></RequireAuth>} />
      <Route path="/app/dashboard" element={<RequireAuth><AppShell><Dashboard  /></AppShell></RequireAuth>} />
      <Route path="/app/report"    element={<RequireAuth><AppShell><Report     /></AppShell></RequireAuth>} />
      <Route path="/app/payments"  element={<RequireAuth><AppShell><PaymentHistory /></AppShell></RequireAuth>} />
      <Route path="/app/insurance" element={<RequireAuth><AppShell><InsuranceDetails /></AppShell></RequireAuth>} />
      <Route path="/app/loyalty"   element={<RequireAuth><AppShell><LoyaltyPage /></AppShell></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin"        element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login"  element={<AdminLogin  />} />
      <Route path="/admin/*"      element={<RequireAuth adminOnly><AdminShell /></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
