import { useState, useEffect } from 'react';
import { adminFraudLog } from '../../services/api.js';
import { Loader, AlertTriangle, ShieldAlert } from 'lucide-react';

const GATE_COLOR = {
  VELOCITY_VIOLATION: 'text-red-400 border-red-800 bg-red-900/20',
  LOW_CLIP_SCORE:     'text-orange-400 border-orange-800 bg-orange-900/20',
  MOIRE_DETECTED:     'text-amber-400 border-amber-800 bg-amber-900/20',
  DUPLICATE_REPORT:   'text-slate-400 border-slate-700 bg-slate-800',
};

const GATE_LABEL = {
  VELOCITY_VIOLATION: 'GPS Spoofing (Speed Trap)',
  LOW_CLIP_SCORE:     'AI Vision — Low Score',
  MOIRE_DETECTED:     'Screen Capture Detected',
  DUPLICATE_REPORT:   'Duplicate Report',
};

export default function AdminFraud() {
  const [data, setData]     = useState({ log: [], summary: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFraudLog()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Fraud Log</h1>
        <p className="text-slate-400 text-sm mt-1">Rejection summary and recent fraud events (last 7 days).</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {data.summary.map(s => (
          <div key={s.gate_type} className={`rounded-2xl border p-4 ${GATE_COLOR[s.gate_type] || 'bg-slate-800 border-slate-700'}`}>
            <div className="text-2xl font-extrabold text-white mb-1">{s.count}</div>
            <div className="text-xs font-semibold capitalize">{GATE_LABEL[s.gate_type] || s.gate_type}</div>
          </div>
        ))}
        {data.summary.length === 0 && (
          <div className="col-span-4 text-center py-8 text-slate-500 text-sm">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No fraud detected in the last 7 days
          </div>
        )}
      </div>

      {/* Log table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800">
              <th className="pb-3 pr-4">Gate</th>
              <th className="pb-3 pr-4">Rider ID</th>
              <th className="pb-3 pr-4">Reason</th>
              <th className="pb-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.log.map(l => (
              <tr key={l.log_id} className="hover:bg-slate-800/50 transition-colors">
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-lg border font-bold ${GATE_COLOR[l.gate_type] || 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    {l.gate_type}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-400 text-xs font-mono">
                  {l.platform_rider_id || 'unknown'}
                </td>
                <td className="py-3 pr-4 text-slate-300 text-xs max-w-xs truncate">
                  {l.rejection_reason}
                </td>
                <td className="py-3 text-slate-400 text-xs">
                  {new Date(l.logged_at).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.log.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">No fraud log entries.</div>
        )}
      </div>
    </div>
  );
}
