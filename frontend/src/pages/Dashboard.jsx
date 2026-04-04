import { useState, useEffect } from 'react';
import { fetchDashboard, fetchClaims, fetchPolicyStatus, fetchZones } from '../services/api.js';
import ZoneMap from '../components/ZoneMap.jsx';

const DI_CLASS = di => di > 75 ? 'di-disrupted' : di > 50 ? 'di-high' : di > 25 ? 'di-moderate' : 'di-safe';
const DI_LABEL = di => di > 75 ? 'Disrupted' : di > 50 ? 'High' : di > 25 ? 'Moderate' : 'Safe';

function fmt(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function Dashboard({ jwt }) {
  const [tab,    setTab]    = useState('overview');
  const [policy, setPolicy] = useState(null);
  const [stats,  setStats]  = useState(null);
  const [claims, setClaims] = useState([]);
  const [zones,  setZones]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pol, dash, cl, z] = await Promise.allSettled([
          fetchPolicyStatus(),
          fetchDashboard(),
          fetchClaims(),
          fetchZones(),
        ]);
        if (pol.status === 'fulfilled')   setPolicy(pol.value.data);
        if (dash.status === 'fulfilled')  setStats(dash.value.data);
        if (cl.status  === 'fulfilled') {
          const raw = cl.value.data;
          // backend returns { claims: [...], total: n }
          setClaims(Array.isArray(raw) ? raw : (raw?.claims ?? []));
        }
        if (z.status === 'fulfilled') {
          const raw = z.value.data;
          setZones(Array.isArray(raw) ? raw : (raw?.zones ?? []));
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const settled = claims.filter(c => c.status === 'SETTLED');
  const totalPaid = settled.reduce((s, c) => s + Number(c.payout_amount || 0), 0);
  const streak = policy?.subscription_streak ?? 0;

  // Disruption events (triggered zones from stats)
  const disrupted = zones.filter(z => (z.current_di ?? 0) > 75);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto 12px' }} />
          <p className="text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-wide">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-header-eyebrow">Dashboard</div>
        <h1 className="page-header-title">
          {policy?.zone_id
            ? `${policy.zone_id.replace('Zone_', '').replace(/_/g, ' ')} Coverage`
            : 'Income Protection'}
        </h1>
        <p className="page-header-subtitle">
          Your real-time parametric insurance overview · Auto-settlement enabled
        </p>
      </div>

      {/* ── Disruption Banner (if any zone is triggered) ── */}
      {disrupted.map(z => (
        <div key={z.zone_id} className="disruption-banner mb-4">
          <div>
            <div className="disruption-banner-text" style={{ color: 'var(--red-400)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              🚨 Active Disruption · {z.zone_id.replace('Zone_', '').replace(/_/g, ' ')}
            </div>
            <p className="text-sm text-muted">
              DI = {Math.round(z.current_di)} — auto-settlement pipeline triggered for this zone.
            </p>
          </div>
          <span className={`di-badge di-disrupted`} style={{ fontSize: 16, padding: '6px 14px' }}>
            {Math.round(z.current_di)}
          </span>
        </div>
      ))}

      {/* ── Tab Group ── */}
      <div className="tab-group">
        {[['overview', '📊 Overview'], ['map', '🗺️ Zone Map'], ['claims', '💳 Claims']].map(([id, label]) => (
          <button key={id} className={`tab-item ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ════════ OVERVIEW ════════ */}
      {tab === 'overview' && (
        <>
          {/* KPI cards */}
          <div className="dashboard-grid mb-4">
            <div className="kpi-card green">
              <span className="kpi-icon">💰</span>
              <div className="kpi-value">{fmt(totalPaid)}</div>
              <div className="kpi-label">Total Paid Out</div>
              <div className="kpi-trend up">↑ {settled.length} settled claim{settled.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="kpi-card">
              <span className="kpi-icon">🔥</span>
              <div className="kpi-value">{streak}</div>
              <div className="kpi-label">Week Streak</div>
              <div className={`kpi-trend ${streak >= 4 ? 'up' : 'flat'}`}>
                {streak >= 12 ? '🏆 Legend' : streak >= 4 ? '⚡ On a roll' : '🌱 Building'}
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-icon">🛡️</span>
              <div className="kpi-value">{policy?.status === 'ACTIVE' ? 'Active' : 'Inactive'}</div>
              <div className="kpi-label">Policy Status</div>
              <div className="kpi-trend flat">
                C_ratio: {policy?.c_factor ?? '—'}
              </div>
            </div>
          </div>

          {/* Policy detail */}
          <div className="card mb-4">
            <div className="section-label">Policy Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
              {[
                ['Zone', (policy?.zone_id ?? '—').replace('Zone_', '').replace(/_/g, ' ')],
                ['Weekly Premium', fmt(policy?.last_premium_amount)],
                ['C_factor', policy?.c_factor ?? '—'],
                ['Streak', `${streak} week${streak !== 1 ? 's' : ''}`],
                ['Coverage Trigger', 'DI > 75'],
                ['Opt-out Deadline', 'Sunday 23:59'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="card-label">{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent claims (last 3) */}
          {settled.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="section-label">Recent Payouts</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('claims')}>
                  View all →
                </button>
              </div>
              {settled.slice(0, 3).map(cl => (
                <div key={cl.claim_id || cl.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {(cl.zone_id ?? '').replace('Zone_', '').replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-muted mt-2">{fmtDt(cl.settled_at)}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--green-400)', fontSize: 15 }}>
                      {fmt(cl.payout_amount)}
                    </div>
                    <div className="text-xs text-muted mt-2">{cl.h_lost}h lost</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════ ZONE MAP ════════ */}
      {tab === 'map' && (
        <div>
          <div className="zone-map-card" style={{ height: 480 }}>
            <ZoneMap zones={zones} height={480} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
            {zones.map(z => {
              const di = z.current_di ?? 0;
              return (
                <div key={z.zone_id} className="card card-sm">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {z.zone_id.replace('Zone_', '').replace(/_/g, ' ')}
                    </span>
                    <span className={`di-badge ${DI_CLASS(di)}`}>{Math.round(di)}</span>
                  </div>
                  <div className="di-progress">
                    <div className={`di-progress-fill ${DI_CLASS(di)}`} style={{ width: `${Math.min(di, 100)}%` }} />
                  </div>
                  <div className="text-xs text-muted mt-2">{DI_LABEL(di)} · Risk ×{z.risk_multiplier ?? '1.00'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ CLAIMS ════════ */}
      {tab === 'claims' && (
        <div>
          {/* Summary banner for triggered events */}
          {settled.length > 0 && (
            <div className="card mb-4" style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 100%)',
              border: '1px solid rgba(52,211,153,0.15)',
            }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 28 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green-400)' }}>
                    {fmt(totalPaid)} paid out automatically
                  </div>
                  <div className="text-sm text-muted">
                    {settled.length} claim{settled.length !== 1 ? 's' : ''} settled via Razorpay — no action needed
                  </div>
                </div>
              </div>
            </div>
          )}

          {claims.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💤</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No disruptions yet</div>
              <p className="text-sm text-muted mt-2">
                When your zone's DI exceeds 75, claims settle automatically here.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>DI Score</th>
                    <th>Hours Lost</th>
                    <th>Payout</th>
                    <th>Razorpay ID</th>
                    <th>Status</th>
                    <th>Settled</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map(cl => (
                    <tr key={cl.claim_id || cl.id}>
                      <td className="td-primary">
                        {(cl.zone_id ?? '').replace('Zone_', '').replace(/_/g, ' ')}
                      </td>
                      <td>
                        <span className={`di-badge ${DI_CLASS(cl.di_score ?? 0)}`}>
                          {cl.di_score ?? '—'}
                        </span>
                      </td>
                      <td className="td-mono">{cl.h_lost}h</td>
                      <td className="td-amount">{fmt(cl.payout_amount)}</td>
                      <td className="td-mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                        {cl.razorpay_txn_id ? cl.razorpay_txn_id.slice(0, 22) + '…' : '—'}
                      </td>
                      <td>
                        <span className={`badge ${cl.status === 'SETTLED' ? 'badge-green' : cl.status === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>
                          {cl.status}
                        </span>
                      </td>
                      <td className="text-xs text-muted">{fmtDt(cl.settled_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
