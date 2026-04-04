import { useState, useEffect, useRef } from 'react';
import { fetchHealth } from './services/api.js';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Report     from './pages/Report.jsx';
import { Shield, LayoutDashboard, FileWarning, LogOut, CheckCircle, Database, Server, Clock } from 'lucide-react';
import './index.css';

export default function App() {
  const [jwt,    setJwt]    = useState(() => localStorage.getItem('ws_jwt') || '');
  const [tab,    setTab]    = useState('dashboard');
  const [health, setHealth] = useState(null);
  const interval = useRef(null);

  // ── Health polling ────────────────────────────────────────
  const poll = async () => {
    try {
      const r = await fetchHealth();
      setHealth(r.data);
    } catch { setHealth(null); }
  };

  useEffect(() => {
    poll();
    interval.current = setInterval(poll, 30000);
    return () => clearInterval(interval.current);
  }, []);

  // ── Auth handlers ─────────────────────────────────────────
  const handleActivation = (token) => {
    localStorage.setItem('ws_jwt', token);
    setJwt(token);
    setTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('ws_jwt');
    setJwt('');
    setTab('dashboard');
  };

  // ── Status bar ────────────────────────────────────────────
  const di    = health?.config?.diThreshold ?? '—';
  const cr    = health?.config?.cRatio ?? '—';
  const db    = health?.database?.name ?? '—';
  const alive = !!health;
  const now   = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Status Bar ── */}
      <div className="status-bar">
        <div className="status-bar-left">
          <span className={`status-dot ${alive ? '' : 'offline'}`} />
          <span className="status-label">
            {alive ? 'All Systems Operational' : 'Platform Offline'}
          </span>
          {alive && (
            <span className="status-meta hidden sm:flex">
              <Database className="w-3 h-3 ml-2" /> <span>{db}</span>
              <span className="text-slate-300">|</span>
              <span>Trigger DI: {di}</span>
              <span className="text-slate-300">|</span>
              <span>Ratio: {cr}</span>
            </span>
          )}
        </div>
        <span className="status-time flex items-center gap-2">
          <Clock className="w-3 h-3" /> {now} IST
        </span>
      </div>

      {/* ── Nav ── */}
      {jwt && (
        <nav className="nav shadow-sm">
          <div className="nav-brand">
            <div className="nav-brand-icon">
              <Shield className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="nav-brand-text">Work<span>Safe</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="nav-tabs hidden sm:flex">
              <button className={`nav-tab ${tab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setTab('dashboard')}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button className={`nav-tab ${tab === 'report' ? 'active' : ''}`}
                onClick={() => setTab('report')}>
                <FileWarning className="w-4 h-4" />
                Report Disruption
              </button>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </nav>
      )}

      {/* ── Pages ── */}
      <div className="page-shell">
        {!jwt ? (
          <Onboarding onActivated={handleActivation} />
        ) : tab === 'dashboard' ? (
          <Dashboard jwt={jwt} />
        ) : (
          <Report jwt={jwt} onBack={() => setTab('dashboard')} />
        )}
      </div>

      {/* Mobile nav fallback */}
      {jwt && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around z-50">
           <button className={`flex flex-col items-center p-2 rounded-lg ${tab === 'dashboard' ? 'text-brand-500 bg-brand-50' : 'text-slate-400'}`} onClick={() => setTab('dashboard')}>
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
           </button>
           <button className={`flex flex-col items-center p-2 rounded-lg ${tab === 'report' ? 'text-brand-500 bg-brand-50' : 'text-slate-400'}`} onClick={() => setTab('report')}>
              <FileWarning className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Report</span>
           </button>
        </div>
      )}
    </>
  );
}
