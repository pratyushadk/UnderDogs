import { useState, useEffect } from 'react';
import { fetchDashboard, fetchClaims, fetchPolicyStatus, fetchZones } from '../services/api.js';
import ZoneMap from '../components/ZoneMap.jsx';
import { LayoutDashboard, Map as MapIcon, CreditCard, ChevronRight, Activity, Zap, TrendingUp, ShieldCheck, Download, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';

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
        if (pol.status === 'fulfilled')   setPolicy(pol.value.data);
        if (dash.status === 'fulfilled')  setStats(dash.value.data);
        if (cl.status  === 'fulfilled') {
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

  const settled = claims.filter(c => c.status === 'SETTLED');
  const totalPaid = settled.reduce((s, c) => s + Number(c.payout_amount || 0), 0);
  const streak = policy?.subscription_streak ?? 0;

  // Only alert on the user's OWN registered zone — not all zones
  const myZone = zones.find(z => z.zone_id === policy?.zone_id);
  const myZoneDisrupted = myZone && (myZone.current_di ?? 0) > 75;

  if (loading) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center text-slate-500">
          <div className="spinner mb-4 w-10 h-10 border-4" />
          <p className="text-sm font-semibold">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-wide">
      {/* ── Header ── */}
      <div className="page-header text-center sm:text-left">
        <div className="page-header-eyebrow">Dashboard</div>
        <h1 className="page-header-title">
          {policy?.zone_id
            ? `${policy.zone_id.replace('Zone_', '').replace(/_/g, ' ')} Coverage`
            : 'Income Protection'}
        </h1>
        <p className="page-header-subtitle">
          Real-time parametric insurance overview. Relax, we've got you covered.
        </p>
      </div>

      {/* ── Disruption Banner — only for user's own zone ── */}
      {myZoneDisrupted && (
        <div className="disruption-banner mb-8 animate-slide-up shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-2 rounded-full mt-1">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="disruption-banner-text">
                <h4>Active Disruption · {myZone.zone_id.replace('Zone_', '').replace(/_/g, ' ')}</h4>
              </div>
              <p className="text-red-500 font-medium">
                Auto-settlement pipeline triggered for your zone due to extreme conditions.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">DI Score</span>
            <span className="di-badge di-disrupted text-lg px-4 py-1.5 shadow-sm">
              {Math.round(myZone.current_di)}
            </span>
          </div>
        </div>
      )}

      {/* ── Tab Group ── */}
      <div className="tab-group flex w-full sm:w-auto overflow-x-auto custom-scrollbar shadow-sm">
        {[
          { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
          { id: 'map', icon: MapIcon, label: 'Zone Map' },
          { id: 'claims', icon: CreditCard, label: 'Claims' },
        ].map((t) => (
          <button key={t.id} className={`tab-item shrink-0 ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <t.icon className="w-4 h-4 mr-2 hidden sm:inline" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ OVERVIEW ════════ */}
      {tab === 'overview' && (
        <div className="animate-fade-in">
          {/* KPI cards */}
          <div className="dashboard-grid">
            <div className="kpi-card green hover:shadow-xl">
              <div className="kpi-icon"><Zap className="w-6 h-6" /></div>
              <div className="kpi-value">{fmt(totalPaid)}</div>
              <div className="kpi-label">Total Claims Paid</div>
              <div className="kpi-trend up"><TrendingUp className="w-4 h-4" /> {settled.length} settled payout{settled.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="kpi-card brand hover:shadow-xl">
              <div className="kpi-icon"><Activity className="w-6 h-6" /></div>
              <div className="kpi-value">{streak}</div>
              <div className="kpi-label">Active Week Streak</div>
              <div className={`kpi-trend ${streak >= 4 ? 'up' : 'text-slate-500'}`}>
                {streak >= 12 ? 'Legend Status' : streak >= 4 ? 'Excellent Coverage' : 'Building History'}
              </div>
            </div>
            <div className="kpi-card hover:shadow-xl">
              <div className="kpi-icon"><ShieldCheck className="w-6 h-6" /></div>
              <div className="kpi-value">{policy?.status === 'ACTIVE' ? 'Active' : 'Inactive'}</div>
              <div className="kpi-label">Coverage Status</div>
              <div className="kpi-trend text-slate-500">
                Risk multiplier: {policy?.c_factor ?? '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Policy detail */}
            <div className="card lg:col-span-2 shadow-md border-t-4 border-t-brand-500 bg-gradient-to-br from-white to-slate-50/50">
              <div className="section-label flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500" /> Policy Configuration
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 mt-6">
                {[
                  ['Registered Zone', (policy?.zone_id ?? '—').replace('Zone_', '').replace(/_/g, ' ')],
                  ['Base Premium', fmt(policy?.last_premium_amount)],
                  ['Risk Rating', policy?.c_factor ?? '—'],
                  ['Current Streak', `${streak} consecutive week${streak !== 1 ? 's' : ''}`],
                  ['Payout Trigger', 'DI Score > 75'],
                  ['Next Review', 'Sunday 23:59'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="card-label">{label}</div>
                    <div className="text-base font-bold text-slate-900 mt-1">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent claims sidebar */}
            <div className="card shadow-md bg-white">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="section-label mb-0">Recent Payouts</div>
                {settled.length > 0 && (
                  <button className="text-xs font-bold text-brand-600 flex items-center hover:text-brand-800 transition" onClick={() => setTab('claims')}>
                    View all <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                )}
              </div>
              
              {settled.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                   <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                   <p className="text-sm font-medium">No payouts yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settled.slice(0, 4).map(cl => (
                    <div key={cl.claim_id || cl.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">
                          {(cl.zone_id ?? '').replace('Zone_', '').replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1">{fmtDt(cl.settled_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-600 text-base">
                          {fmt(cl.payout_amount)}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">{cl.h_lost}h covered</div>
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
        <div className="animate-fade-in space-y-6">
          <div className="zone-map-card shadow-lg ring-1 ring-slate-200" style={{ height: 500 }}>
            <ZoneMap zones={zones} height={500} />
          </div>

          {/* Show ONLY the user's registered zone */}
          {(() => {
            const userZone = zones.find(z => z.zone_id === policy?.zone_id);
            if (!userZone) return (
              <div className="card text-center py-10 text-slate-400">
                <MapIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Complete onboarding to see your zone data.</p>
              </div>
            );
            const di = userZone.current_di ?? 0;
            return (
              <div className="card shadow-md border-t-4 border-t-brand-500">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-brand-500" />
                  <h3 className="text-base font-bold text-slate-900">Your Zone — {userZone.zone_id.replace('Zone_', '').replace(/_/g, ' ')}</h3>
                  <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">Primary Delivery Area</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Disruption Index</div>
                    <span className={`di-badge text-2xl px-5 py-2 ${DI_CLASS(di)}`}>{Math.round(di)}</span>
                    <div className="mt-3">
                      <div className="di-progress mt-2">
                        <div className={`di-progress-fill ${DI_CLASS(di)}`} style={{ width: `${Math.min(di, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</div>
                    <div className={`text-2xl font-extrabold mt-2 ${di > 75 ? 'text-rose-600' : di > 50 ? 'text-orange-500' : di > 25 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {DI_LABEL(di)}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      {di > 75 ? 'Auto-settlement triggered' : di > 25 ? 'Monitor conditions' : 'Normal operations'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Risk Multiplier</div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2">×{userZone.risk_multiplier ?? '1.00'}</div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Applied to your premium</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════ CLAIMS ════════ */}
      {tab === 'claims' && (
        <div className="animate-fade-in">
          {/* Summary banner */}
          {settled.length > 0 && (
            <div className="card mb-6 bg-emerald-50 border-emerald-100 shadow-sm flex items-center gap-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-lg text-emerald-800">
                  {fmt(totalPaid)} deposited automatically
                </div>
                <div className="text-sm text-emerald-600 font-medium mt-1">
                  {settled.length} claim{settled.length !== 1 ? 's' : ''} settled to your verified account — zero paperwork.
                </div>
              </div>
            </div>
          )}

          {claims.length === 0 ? (
            <div className="card text-center py-20 px-4">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-xl font-bold text-slate-900 mb-2">Clear Skies</div>
              <p className="text-slate-500 max-w-sm mx-auto">
                No disruptions recorded in your history. When severe events occur, automatic claim settlements will appear here.
              </p>
            </div>
          ) : (
            <div className="table-wrap shadow-md">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>DI Score</th>
                      <th>Impact</th>
                      <th>Settlement</th>
                      <th>Transaction ID</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(cl => (
                      <tr key={cl.claim_id || cl.id}>
                        <td className="font-semibold text-slate-900">
                          {String(cl.zone_id || '').replace('Zone_', '').replace(/_/g, ' ')}
                        </td>
                        <td>
                          <span className={`di-badge ${DI_CLASS(cl.di_score ?? 0)}`}>
                            {cl.di_score ?? '—'}
                          </span>
                        </td>
                        <td className="text-slate-600 font-medium">{cl.h_lost}h missed</td>
                        <td className="td-amount tracking-tight">{fmt(cl.payout_amount)}</td>
                        <td className="td-mono text-xs text-slate-400">
                          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded inline-flex border border-slate-100">
                            {cl.razorpay_txn_id ? String(cl.razorpay_txn_id).slice(0, 18) + '…' : '—'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${cl.status === 'SETTLED' ? 'badge-green' : cl.status === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>
                            {cl.status}
                          </span>
                        </td>
                        <td className="text-sm text-slate-500">{fmtDt(cl.settled_at)}</td>
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
