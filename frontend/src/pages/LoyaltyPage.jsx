import { useState, useEffect } from 'react';
import { fetchPolicyStatus } from '../services/api.js';
import { Award, TrendingUp, Star, Loader, CheckCircle, Lock, Info } from 'lucide-react';

const TIERS = [
  { weeks: 1,  label: 'New Rider',      discount: 0,    c: 1.20, color: 'bg-slate-200',   icon: Star },
  { weeks: 4,  label: 'Regular',        discount: 0,    c: 1.00, color: 'bg-indigo-200',  icon: TrendingUp },
  { weeks: 12, label: 'Loyal Rider',    discount: 15,   c: 0.85, color: 'bg-emerald-400', icon: Award },
];

export default function LoyaltyPage() {
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

  const streak    = policy?.subscription_streak ?? 0;
  const cFactor   = parseFloat(policy?.c_factor ?? 1.20);
  const premium   = parseFloat(policy?.last_premium_amount ?? 0);
  const discount  = cFactor <= 0.90 ? 15 : cFactor <= 1.05 ? 0 : cFactor < 1.25 ? 0 : -20;
  const nextTarget = streak < 4 ? 4 : streak < 12 ? 12 : null;
  const progress  = nextTarget ? (streak / nextTarget) * 100 : 100;

  const tierLabel = cFactor <= 0.90 ? 'Loyal Rider'
                  : cFactor <= 1.05 ? 'Regular'
                  : cFactor <= 1.25 ? 'New Rider'
                  : '⚠️ Adverse Selection Penalty';

  const TIPS = [
    'Subscribe every week without a break to build your streak.',
    'Cancelling during high-risk forecast weeks triggers an adverse selection penalty.',
    'Once you reach 12 consecutive weeks, your premium drops by 15% — indefinitely.',
    'Even one missed week does not reset your streak if you rejoin within 2 weeks.',
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-eyebrow">Loyalty</div>
        <h1 className="page-header-title">Your Loyalty Score</h1>
        <p className="page-header-subtitle">Consistent subscribers get rewarded with lower premiums.</p>
      </div>

      {/* Current status */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Award className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl font-extrabold text-slate-900">{streak} weeks</span>
              <span className={`badge ${cFactor <= 0.90 ? 'badge-success' : cFactor > 1.25 ? 'badge-danger' : 'badge-info'}`}>
                {tierLabel}
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              Your C-factor is <strong className={cFactor <= 1 ? 'text-emerald-600' : 'text-amber-600'}>{cFactor}×</strong>
              {discount > 0 && <span className="text-emerald-600 font-semibold"> — {discount}% loyalty discount active</span>}
              {discount < 0 && <span className="text-red-500 font-semibold"> — {Math.abs(discount)}% adverse selection penalty</span>}
            </p>

            {/* Progress bar */}
            {nextTarget && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Week {streak}</span>
                  <span>Target: Week {nextTarget}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {nextTarget - streak} more week{nextTarget - streak !== 1 ? 's' : ''} to unlock next tier
                </p>
              </div>
            )}
            {!nextTarget && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Maximum loyalty tier reached!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier ladder */}
      <div className="card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-900 text-sm">Loyalty Tiers</span>
        </div>
        <div className="divide-y divide-slate-50">
          {TIERS.map(tier => {
            const isActive = streak >= tier.weeks;
            const isCurrent = tier.weeks === (streak < 4 ? 1 : streak < 12 ? 4 : 12);
            return (
              <div key={tier.weeks} className={`flex items-center gap-4 px-6 py-4 ${isCurrent ? 'bg-indigo-50' : ''}`}>
                <div className={`w-10 h-10 ${isActive ? tier.color : 'bg-slate-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {isActive
                    ? <tier.icon className="w-5 h-5 text-white" />
                    : <Lock className="w-4 h-4 text-slate-400" />
                  }
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">{tier.label}</div>
                  <div className="text-xs text-slate-400">{tier.weeks}+ continuous weeks · C-factor: {tier.c}×</div>
                </div>
                <div className="text-right">
                  {tier.discount > 0
                    ? <span className="text-emerald-600 font-bold text-sm">-{tier.discount}% off</span>
                    : <span className="text-slate-400 text-sm">Standard rate</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-slate-900 text-sm">How to Improve Your Score</span>
        </div>
        <ul className="space-y-2">
          {TIPS.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
