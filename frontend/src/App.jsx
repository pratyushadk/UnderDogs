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
import {
  Shield, LayoutDashboard, FileWarning, LogOut, Clock,
  Database, Bell, CreditCard, Award, FileText, Menu, X,
  ChevronRight, Settings, User, Activity
} from 'lucide-react';
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
import StaticPage       from './pages/StaticPage.jsx';

// Admin Pages
import AdminLogin       from './pages/admin/AdminLogin.jsx';
import AdminShell       from './pages/admin/AdminShell.jsx';

import './index.css';

// ── Protected Route wrapper ───────────────────────────────────
function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-ws-bg">
      <div className="spinner w-8 h-8 border-4" />
    </div>
  );

  if (!user) {
    const isAdminRoute = location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? '/admin/login' : '/'} state={{ from: location }} replace />;
  }

  // Enforce email verification for protected rider routes
  if (user.email && !user.is_verified && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/verify-email" replace />;
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
        className="sidebar-icon-btn relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {data.unread_count > 0 && (
          <span className="notif-badge">{Math.min(data.unread_count, 9)}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="font-bold text-slate-900 text-sm">Notifications</span>
            {data.unread_count > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-indigo-600 font-semibold hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {data.notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No notifications</div>
            ) : (
              data.notifications.map(n => (
                <div key={n.notif_id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
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

// ── Sidebar Nav ───────────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (path) => location.pathname === path;

  const NAV_LINKS = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/report',    icon: FileWarning,     label: 'Report'    },
    { to: '/app/payments',  icon: CreditCard,      label: 'Payments'  },
    { to: '/app/insurance', icon: FileText,        label: 'Insurance' },
    { to: '/app/loyalty',   icon: Award,           label: 'Loyalty'   },
  ];

  const SidebarContent = () => (
    <div className="sidebar-inner">
      {/* Brand */}
      <div className="sidebar-brand">
        <Link to="/app/dashboard" className="sidebar-brand-link" onClick={() => setMobileOpen(false)}>
          <div className="sidebar-brand-icon">
            <Shield className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="sidebar-brand-text">Work<span>Safe</span></span>
        </Link>
      </div>

      {/* Nav section label */}
      <div className="sidebar-section-label">Navigation</div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {NAV_LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`sidebar-link ${isActive(l.to) ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <l.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{l.label}</span>
            {isActive(l.to) && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status pill */}
      <StatusPill />

      {/* User / bottom */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <User className="w-4 h-4" />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'Rider'}</div>
            <div className="sidebar-user-role">Gig Worker</div>
          </div>
          <NotifBell />
        </div>
        <button className="sidebar-logout-btn" onClick={logout}>
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <Link to="/app/dashboard" className="flex items-center gap-2">
          <div className="sidebar-brand-icon w-8 h-8">
            <Shield className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="sidebar-brand-text text-base">Work<span>Safe</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <NotifBell />
          <button className="sidebar-icon-btn" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar mobile-open">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}

// ── Status Pill (inside sidebar) ─────────────────────────────
function StatusPill() {
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
    <div className="sidebar-status-pill">
      <div className="flex items-center gap-2">
        <span className={`status-dot-sm ${alive ? '' : 'offline'}`} />
        <span className="text-xs font-semibold text-slate-700">
          {alive ? 'Systems Online' : 'Offline'}
        </span>
      </div>
      <span className="text-[11px] text-slate-400 font-mono">{now} IST</span>
    </div>
  );
}

// ── App Shell (authenticated rider area) ─────────────────────
function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
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
      <Route path="/p/:slug"      element={<StaticPage  />} />

      {/* Authenticated rider app */}
      <Route path="/app/onboard"   element={<RequireAuth><Onboarding /></RequireAuth>} />
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
