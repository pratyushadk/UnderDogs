import { useState, useEffect } from 'react';
import { fetchPolicyStatus } from '../services/api.js';
import { Shield, MapPin, Clock, AlertCircle, Loader, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function InsuranceDetails() {
  const [policy, setPolicy]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicyStatus()
      .then(r => setPolicy(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <Loader className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  if (!policy) return (
    <div className="page-container">
      <div className="card py-20 text-center">
        <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Active Policy</h2>
        <p className="text-slate-400 text-sm mb-6">You don't have an active insurance policy yet.</p>
        <Link to="/app/onboard" className="btn btn-primary">Get Protected →</Link>
      </div>
    </div>
  );

  const zoneName = policy.zone_id?.replace('Zone_', '').replace(/_/g, ' ') || '—';
  const PAYOUT_RATE = parseFloat(policy.c_ratio_applied || 0.85) * parseFloat(policy.rider_e_avg || 0);

  const TERMS = [
    { label: 'Coverage Type',    value: 'Income Replacement Only' },
    { label: 'Trigger Mechanism', value: 'Automated — Disruption Index ≥ 75' },
    { label: 'Payout Method',    value: 'Razorpay Direct Transfer (IMPS)' },
    { label: 'Payout Timeline',  value: 'Automatic within the disruption window' },
    { label: 'Coverage Ratio',   value: `${Math.round((policy.c_ratio_applied || 0.85) * 100)}% of average hourly earnings` },
    { label: 'Exclusions',       value: 'Health, accidents, vehicle damage, theft, acts of war' },
    { label: 'Subscription',     value: 'Rolling weekly — renew each Sunday before 23:59' },
    { label: 'Dispute Period',   value: '7 days from payout date' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-eyebrow">Coverage</div>
        <h1 className="page-header-title">Insurance Details</h1>
        <p className="page-header-subtitle">Your active policy terms and coverage information.</p>
      </div>

      {/* Status banner */}
      <div className="card p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-indigo-50 border border-indigo-100">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-indigo-800">Protection Active</span>
          </div>
          <p className="text-indigo-600 text-sm">Your income is protected for this week in <strong>{zoneName}</strong>.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-indigo-700">{fmt(policy.last_premium_amount)}</div>
          <div className="text-xs text-indigo-400 font-medium">Weekly Premium</div>
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: MapPin,  label: 'Covered Zone',    value: zoneName },
          { icon: Shield,  label: 'Policy Status',   value: policy.status || '—' },
          { icon: Clock,   label: 'Streak',          value: `${policy.subscription_streak || 0} weeks` },
          { icon: AlertCircle, label: 'DI Threshold', value: '≥ 75' },
        ].map(item => (
          <div key={item.label} className="card p-4 text-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <item.icon className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="font-bold text-slate-900 text-sm">{item.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Policy Terms */}
      <div className="card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-900 text-sm">Policy Terms & Conditions</span>
        </div>
        <div className="divide-y divide-slate-50">
          {TERMS.map(t => (
            <div key={t.label} className="flex items-start justify-between px-6 py-3 gap-4">
              <span className="text-sm text-slate-500 font-medium flex-shrink-0">{t.label}</span>
              <span className="text-sm text-slate-900 font-semibold text-right">{t.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Important Disclaimer:</strong> WorkSafe provides parametric income insurance only.
          This policy does not cover personal health, medical expenses, vehicle damage, accident liability,
          theft, or any event not attributable to a measurable disruption index breach in your registered zone.
          Payout amounts are based on your recorded average hourly earnings at the time of subscription activation.
          WorkSafe is not an IRDAI-regulated insurer. This is a prototype product for demonstration purposes.
        </p>
      </div>
    </div>
  );
}
