import { useState, useEffect } from 'react';
import { fetchDashboard, fetchClaims, fetchPolicyStatus, fetchZones } from '../services/api.js';
import ZoneMap from '../components/ZoneMap.jsx';
import {
  LayoutDashboard, Map as MapIcon, CreditCard, ChevronRight,
  Activity, Zap, TrendingUp, ShieldCheck, AlertTriangle,
  CheckCircle, MapPin, IndianRupee, Clock, Layers
} from 'lucide-react';

const DI_CLASS = di => di > 75 ? 'di-disrupted' : di > 50 ? 'di-high' : di > 25 ? 'di-moderate' : 'di-safe';
const DI_LABEL = di => di > 75 ? 'Disrupted' : di > 50 ? 'High Risk' : di > 25 ? 'Moderate' : 'Safe';

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

export default function Dashboard() {
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
        if (pol.status  === 'fulfilled')  setPolicy(pol.value.data);
        if (dash.status === 'fulfilled')  setStats(dash.value.data);
        if (cl.status   === 'fulfilled') {
          const raw = cl.value.data;
          setClaims(Array.isArray(raw) ? raw : (raw?.claims ?? []));
        }
        if (z.status === 'fulfilled') {
          const raw = z.value.data;
          setZones(Array.isArray(raw) ? raw : (raw?.zones ?? []));
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const settled    = claims.filter(c => c.status === 'SETTLED');
  const totalPaid  = settled.reduce((s, c) => s + Number(c.payout_amount || 0), 0);
  const streak     = policy?.subscription_streak ?? 0;
  const myZone     = zones.find(z => z.zone_id === policy?.zone_id);
  const myZoneDisrupted = myZone && (myZone.current_di ?? 0) > 75;

  const zoneName = policy?.zone_id
    ? policy.zone_id.replace('Zone_', '').replace(/_/g, ' ')
    : 'Coverage';

  if (loading) {
    return (
      <div className="page-content flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner mb-3 w-8 h-8 border-4 mx-auto" />
          <p style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'map',      icon: MapIcon,         label: 'Zone Map' },
    { id: 'claims',   icon: CreditCard,      label: 'Claims'   },
  ];

  return (
    <div className="page-content">

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div>
            <div className="page-header-eyebrow">Dashboard</div>
            <h1 className="page-header-title">{zoneName} Overview</h1>
            <p className="page-header-subtitle">
              Real-time parametric insurance for your gig journey.
            </p>
          </div>

          {/* Coverage badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: policy?.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
            color: policy?.status === 'ACTIVE' ? '#059669' : '#DC2626',
            padding: '6px 14px', borderRadius: 20,
            fontSize: 12, fontWeight: 700, alignSelf: 'flex-start',
            border: `1px solid ${policy?.status === 'ACTIVE' ? '#A7F3D0' : '#FECACA'}`
          }}>
            <ShieldCheck size={13} />
            {policy?.status === 'ACTIVE' ? 'Coverage Active' : 'Coverage Inactive'}
          </div>
        </div>
      </div>

      {/* ── Disruption Banner ── */}
      {myZoneDisrupted && (
        <div className="disruption-banner animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: '#FEE2E2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, marginTop: 1
            }}>
              <AlertTriangle size={16} color="#DC2626" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#991B1B', fontSize: 13.5 }}>
                Active Disruption — {myZone.zone_id.replace('Zone_', '').replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 13, color: '#B91C1C', marginTop: 2 }}>
                Auto-settlement pipeline triggered. Your payout is being processed.
              </div>
            </div>
          </div>
          <span className={`di-badge di-disrupted`} style={{ fontSize: 14, padding: '4px 12px' }}>
            DI {Math.round(myZone.current_di)}
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="tab-group">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={14} className="hidden sm:inline" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ OVERVIEW ════════ */}
      {tab === 'overview' && (
        <div className="animate-fade-in">

          {/* KPI row */}
          <div className="dashboard-grid">
            <div className="kpi-card green">
              <div className="kpi-top">
                <div>
                  <div className="kpi-label">Total Claims Paid</div>
                  <div className="kpi-value">{fmt(totalPaid)}</div>
                </div>
                <div className="kpi-icon"><IndianRupee size={16} /></div>
              </div>
              <div className="kpi-trend up">
                <TrendingUp size={12} />
                {settled.length} settled payout{settled.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="kpi-card brand">
              <div className="kpi-top">
                <div>
                  <div className="kpi-label">Week Streak</div>
                  <div className="kpi-value">{streak}</div>
                </div>
                <div className="kpi-icon"><Activity size={16} /></div>
              </div>
              <div className={`kpi-trend ${streak >= 4 ? 'up' : ''}`}>
                {streak >= 12 ? '🏆 Legend Status' : streak >= 4 ? '✓ Excellent Coverage' : 'Building history…'}
              </div>
            </div>

            <div className="kpi-card amber">
              <div className="kpi-top">
                <div>
                  <div className="kpi-label">Risk Multiplier</div>
                  <div className="kpi-value">×{policy?.c_factor ?? '—'}</div>
                </div>
                <div className="kpi-icon"><Layers size={16} /></div>
              </div>
              <div className="kpi-trend">
                Payout triggers at DI &gt; 75
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

            {/* Policy config card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--ws-border)' }}>
                <ShieldCheck size={14} color="var(--brand)" />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Policy Configuration</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Registered Zone',  value: (policy?.zone_id ?? '—').replace('Zone_', '').replace(/_/g, ' ') },
                  { label: 'Base Premium',      value: fmt(policy?.last_premium_amount) },
                  { label: 'Risk Rating',       value: policy?.c_factor ?? '—' },
                  { label: 'Coverage Streak',   value: `${streak} week${streak !== 1 ? 's' : ''}` },
                  { label: 'Payout Trigger',    value: 'DI Score > 75' },
                  { label: 'Weekly Review',     value: 'Sunday 23:59' },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--ws-border)' : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent payouts */}
            <div className="card" style={{ padding: '20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span className="section-label" style={{ margin: 0 }}>Recent Payouts</span>
                {settled.length > 0 && (
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}
                    onClick={() => setTab('claims')}
                  >
                    View all <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {settled.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-3)' }}>
                  <CreditCard size={28} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                  <p style={{ fontSize: 13 }}>No payouts yet</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Payouts appear after disruption events</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {settled.slice(0, 5).map(cl => (
                    <div key={cl.claim_id || cl.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 8,
                      background: '#FAFBFD', border: '1px solid var(--ws-border)',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                          {(cl.zone_id ?? '').replace('Zone_', '').replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                          {fmtDt(cl.settled_at)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: '#059669' }}>
                          {fmt(cl.payout_amount)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                          {cl.h_lost}h covered
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ════════ ZONE MAP ════════ */}
      {tab === 'map' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="zone-map-card" style={{ height: 480 }}>
            <ZoneMap zones={zones} height={480} />
          </div>

          {(() => {
            const userZone = zones.find(z => z.zone_id === policy?.zone_id);
            if (!userZone) return (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-3)' }}>
                <MapIcon size={28} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                <p style={{ fontSize: 13 }}>Complete onboarding to see your zone data.</p>
              </div>
            );
            const di = userZone.current_di ?? 0;
            return (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <MapPin size={15} color="var(--brand)" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                    Your Zone — {userZone.zone_id.replace('Zone_', '').replace(/_/g, ' ')}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    background: '#F1F5F9', color: 'var(--text-2)',
                    padding: '3px 10px', borderRadius: 20, border: '1px solid var(--ws-border)',
                  }}>Primary Area</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    {
                      label: 'Disruption Index',
                      content: (
                        <>
                          <span className={`di-badge ${DI_CLASS(di)}`} style={{ fontSize: 20, padding: '4px 14px' }}>
                            {Math.round(di)}
                          </span>
                          <div className="di-progress">
                            <div className={`di-progress-fill ${DI_CLASS(di)}`} style={{ width: `${Math.min(di, 100)}%` }} />
                          </div>
                        </>
                      )
                    },
                    {
                      label: 'Status',
                      content: (
                        <>
                          <div style={{
                            fontSize: 20, fontWeight: 800, marginTop: 4,
                            color: di > 75 ? '#DC2626' : di > 50 ? '#D97706' : di > 25 ? '#D97706' : '#059669'
                          }}>
                            {DI_LABEL(di)}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                            {di > 75 ? 'Auto-settlement triggered' : di > 25 ? 'Monitor conditions' : 'Normal operations'}
                          </p>
                        </>
                      )
                    },
                    {
                      label: 'Risk Multiplier',
                      content: (
                        <>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginTop: 4 }}>
                            ×{userZone.risk_multiplier ?? '1.00'}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Applied to premium</p>
                        </>
                      )
                    },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding: '14px 16px', background: '#FAFBFD',
                      border: '1px solid var(--ws-border)', borderRadius: 8, textAlign: 'center'
                    }}>
                      <div className="card-label" style={{ textAlign: 'center' }}>{item.label}</div>
                      {item.content}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════ CLAIMS ════════ */}
      {tab === 'claims' && (
        <div className="animate-fade-in">

          {/* Summary row */}
          {settled.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 10, padding: '14px 18px', marginBottom: 16
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#D1FAE5', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0
              }}>
                <ShieldCheck size={18} color="#059669" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#065F46' }}>
                  {fmt(totalPaid)} deposited automatically
                </div>
                <div style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>
                  {settled.length} claim{settled.length !== 1 ? 's' : ''} settled — zero paperwork required
                </div>
              </div>
            </div>
          )}

          {claims.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#F8FAFC', border: '1px solid var(--ws-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px'
              }}>
                <CheckCircle size={22} color="#CBD5E1" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
                Clear Skies
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 320, margin: '0 auto' }}>
                No disruptions recorded in your history. When severe events occur, auto-settlements appear here.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>DI Score</th>
                      <th>Hours Lost</th>
                      <th>Settlement</th>
                      <th>Transaction ID</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(cl => (
                      <tr key={cl.claim_id || cl.id}>
                        <td className="td-primary">
                          {String(cl.zone_id || '').replace('Zone_', '').replace(/_/g, ' ')}
                        </td>
                        <td>
                          <span className={`di-badge ${DI_CLASS(cl.di_score ?? 0)}`}>
                            {cl.di_score ?? '—'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-2)', fontWeight: 500 }}>{cl.h_lost}h</td>
                        <td className="td-amount">{fmt(cl.payout_amount)}</td>
                        <td className="td-mono" style={{ fontSize: 12 }}>
                          <span style={{
                            background: '#F8FAFC', border: '1px solid var(--ws-border)',
                            borderRadius: 5, padding: '2px 8px', display: 'inline-block',
                            color: 'var(--text-3)'
                          }}>
                            {cl.razorpay_txn_id ? String(cl.razorpay_txn_id).slice(0, 16) + '…' : '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${cl.status === 'SETTLED' ? 'badge-green' : cl.status === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>
                            {cl.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{fmtDt(cl.settled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
