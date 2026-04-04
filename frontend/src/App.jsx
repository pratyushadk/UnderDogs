import { useState, useEffect, useRef } from 'react';
import { fetchHealth } from './services/api.js';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Report     from './pages/Report.jsx';
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
            {alive ? 'All Systems Operational' : 'API Offline'}
          </span>
          {alive && (
            <span className="status-meta">
              DB: <span>{db}</span> · DI Threshold: <span>{di}</span> · C_ratio: <span>{cr}</span>
            </span>
          )}
        </div>
        <span className="status-time">{now} IST</span>
      </div>

      {/* ── Nav ── */}
      {jwt && (
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-brand-icon">🛡️</div>
            <span className="nav-brand-text">Work<span>Safe</span></span>
          </div>

          <div className="nav-tabs">
            <button className={`nav-tab ${tab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setTab('dashboard')}>
              📊 Dashboard
            </button>
            <button className={`nav-tab ${tab === 'report' ? 'active' : ''}`}
              onClick={() => setTab('report')}>
              🚨 Report
            </button>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
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
    </>
  );
}
