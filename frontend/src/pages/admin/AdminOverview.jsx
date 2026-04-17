import { useState, useEffect } from 'react';
import { adminOverview } from '../../services/api.js';
import { Users, Shield, TrendingUp, TrendingDown, AlertTriangle, Zap, DollarSign, Loader } from 'lucide-react';

const fmt  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtN = n => Number(n || 0).toLocaleString('en-IN');

function KpiCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo:  'bg-indigo-600',
    emerald: 'bg-emerald-500',
    red:     'bg-red-500',
    amber:   'bg-amber-500',
  };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${colors[color] || colors.indigo} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400 font-medium">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminOverview() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    adminOverview()
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-red-400">{error}</div>
  );

  return (
    <div className="p-8 text-slate-100">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">System Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Last updated: {new Date(data.timestamp).toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Users}        label="Total Users"        value={fmtN(data.users?.total)}           sub={`+${data.users?.new_today || 0} today`}              color="indigo"  />
        <KpiCard icon={Shield}       label="Active Policies"   value={fmtN(data.policies?.active)}        sub={`of ${data.policies?.total || 0} total`}             color="emerald" />
        <KpiCard icon={DollarSign}   label="Total Revenue"     value={fmt(data.financials?.total_revenue_inr)} sub="Premium payments collected"                     color="emerald" />
        <KpiCard icon={TrendingUp}   label="Total Payouts"     value={fmt(data.financials?.total_payout_inr)}  sub={`${data.financials?.claims_settled || 0} claims`} color="amber"   />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={TrendingDown}  label="Net Income"         value={fmt(data.financials?.net_inr)}      sub="Revenue minus payouts"                              color={data.financials?.net_inr >= 0 ? 'emerald' : 'red'} />
        <KpiCard icon={AlertTriangle} label="Fraud Rejected (7d)" value={fmtN(data.fraud_rejections_7d)}   sub="Across all 4 gates"                                  color="red"     />
        <KpiCard icon={Zap}           label="Active Zones"       value={fmtN(data.zones?.total)}           sub={`${data.zones?.disrupted || 0} disrupted now`}       color="indigo"  />
        <KpiCard icon={Shield}        label="DI Threshold"       value="75"                                 sub="Auto-payout trigger level"                           color="amber"   />
      </div>

      {/* Quick note */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">System Status</div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 font-semibold text-sm">All systems operational</span>
        </div>
        <p className="text-slate-500 text-xs mt-2 leading-relaxed">
          DI polling runs every 15 minutes · Premium calculation runs every Saturday 23:00 IST · Settlement pipeline fires on DI ≥ 75
        </p>
      </div>
    </div>
  );
}
