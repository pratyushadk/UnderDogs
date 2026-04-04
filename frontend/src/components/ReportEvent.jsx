import { useState, useEffect } from 'react';
import { 
  ShieldCheck, MapPin, AlertTriangle, CheckCircle, Activity, Cpu, 
  Fingerprint, Zap
} from 'lucide-react';

const GATES = [
  { id: 'duplicate', icon: Fingerprint, name: 'Identity Integrity', desc: 'Validating unique session signature.' },
  { id: 'velocity', icon: Activity, name: 'Spatial Velocity', desc: 'Verifying movement within bounds.' },
  { id: 'ai', icon: Cpu, name: 'Neural Scene Audit', desc: 'CLIP zero-shot + Moire scan.' },
  { id: 'threshold', icon: Zap, name: 'Consensus Protocol', desc: 'Verifying regional node clusters.' },
];

export default function ReportEvent({ result, gateStatus, onRestart, auditLog, reporting }) {
  const gateSt = id => gateStatus[id] ?? 'pending';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Status HUD ── */}
      <div className="grid grid-cols-1 gap-3">
        {GATES.map((g) => {
          const st = gateSt(g.id);
          const isPassed = st === 'passed';
          const isFailed = st === 'failed';
          const isChecking = st === 'checking';
          
          return (
            <div key={g.id} className={`p-5 rounded-2xl border flex items-center gap-5 transition-all duration-300 ${
              isPassed ? 'border-emerald-200 bg-emerald-50' : 
              isFailed ? 'border-rose-200 bg-rose-50' : 
              isChecking ? 'border-indigo-200 bg-indigo-50' : 
              'border-slate-200 bg-slate-50 opacity-50'
            }`}>
              <div className={`p-3 rounded-xl transition-colors ${
                isPassed ? 'text-emerald-600 bg-emerald-100' : 
                isFailed ? 'text-rose-600 bg-rose-100' : 
                isChecking ? 'text-indigo-600 bg-indigo-100' : 
                'text-slate-400 bg-slate-100'
              }`}>
                 <g.icon className={`w-5 h-5 ${isChecking && 'animate-pulse'}`} />
              </div>
              <div className="flex-1">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{g.name}</h3>
                    <div className="flex items-center gap-2">
                       {isPassed && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                       {isFailed && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${
                         isPassed ? 'text-emerald-600' : 
                         isFailed ? 'text-rose-600' : 
                         isChecking ? 'text-indigo-600' : 
                         'text-slate-400'
                       }`}>
                          {st.toUpperCase()}
                       </span>
                    </div>
                 </div>
                 <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{g.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Result Cards ── */}
      {result && (
        <div className="animate-slide-up space-y-6">
           {result.error ? (
              <div className="p-10 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-6 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-r" />
                 <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-rose-600" />
                 </div>
                 <div className="space-y-2">
                    <div className="text-xs font-bold text-rose-600 uppercase tracking-widest">Audit Rejected</div>
                    <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium max-w-md mx-auto">{result.error}</p>
                 </div>
                 <button className="btn-premium-secondary w-full" onClick={onRestart}>Restart Analysis</button>
              </div>
           ) : (
              <div className="p-10 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-6 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-r" />
                 <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                 </div>
                 <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Audit Validated</div>
                    <h2 className="text-2xl font-bold text-slate-900">Report Accepted</h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium max-w-md mx-auto">Automatic disbursement initiated to your primary verified account.</p>
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
}
