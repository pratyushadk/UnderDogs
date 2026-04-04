import { Activity, CheckCircle, Star } from 'lucide-react';

const PLATFORM_COLOR = {
  Zomato:  'text-red-600 bg-red-50 border border-red-100',
  Swiggy:  'text-orange-600 bg-orange-50 border border-orange-100',
  Blinkit: 'text-amber-600 bg-amber-50 border border-amber-100',
  Porter:  'text-blue-600 bg-blue-50 border border-blue-100',
  Dunzo:   'text-purple-600 bg-purple-50 border border-purple-100',
};

export default function PremiumCard({ profile }) {
  if (!profile) return null;
  const p = profile;
  const platColor = PLATFORM_COLOR[p.platform] ?? 'text-slate-600 bg-slate-50';

  return (
    <div className="premium-card relative">
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
            <span className="text-2xl font-bold text-slate-800 uppercase">{p.name?.[0]}</span>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 truncate">{p.name}</h3>
              <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
            </div>
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={`badge-premium text-xs font-bold rounded-md px-2 py-0.5 truncate ${platColor}`}>{p.platform}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
              <span className="text-sm font-medium text-slate-500 truncate">{p.city}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-100">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Benchmark</div>
            <div className="text-lg font-bold text-slate-900">₹{Number(p.e_avg).toFixed(0)}<span className="text-sm font-medium text-slate-400">/h</span></div>
          </div>
          <div className="space-y-1 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift</div>
            <div className="text-lg font-bold text-slate-900">{p.shift_pattern?.start}h</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rating</div>
            <div className="text-lg font-bold text-amber-500 flex items-center justify-end gap-1"><Star className="w-4 h-4 fill-current" /> {p.rating}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
