import { useState, useEffect } from 'react';
import { adminZones } from '../../services/api.js';
import { Loader, MapPin } from 'lucide-react';

const DI_COLOR = di => di > 75 ? 'text-red-400 bg-red-900/30 border-red-700'
                      : di > 50 ? 'text-orange-400 bg-orange-900/30 border-orange-700'
                      : di > 25 ? 'text-amber-400 bg-amber-900/30 border-amber-700'
                      :           'text-emerald-400 bg-emerald-900/30 border-emerald-700';
const DI_LABEL = di => di > 75 ? 'Disrupted' : di > 50 ? 'High' : di > 25 ? 'Moderate' : 'Safe';

export default function AdminZones() {
  const [zones, setZones]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminZones()
      .then(r => setZones(r.data.zones || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader className="w-8 h-8 animate-spin text-indigo-400" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Zone Monitor</h1>
        <p className="text-slate-400 text-sm mt-1">Live disruption index across all {zones.length} delivery zones.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800">
              <th className="pb-3 pr-6">Zone</th>
              <th className="pb-3 pr-6">City</th>
              <th className="pb-3 pr-6">Current DI</th>
              <th className="pb-3 pr-6">24h Avg DI</th>
              <th className="pb-3 pr-6">Peak DI (24h)</th>
              <th className="pb-3 pr-6">Risk Mult.</th>
              <th className="pb-3">Active Policies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {zones.map(z => {
              const di = parseFloat(z.current_di || 0);
              const name = z.zone_id.replace('Zone_', '').replace(/_/g, ' ');
              return (
                <tr key={z.zone_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 pr-6 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />{name}
                    </div>
                  </td>
                  <td className="py-3 pr-6 text-slate-400">{z.city}</td>
                  <td className="py-3 pr-6">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${DI_COLOR(di)}`}>
                      {Math.round(di)} · {DI_LABEL(di)}
                    </span>
                  </td>
                  <td className="py-3 pr-6 text-slate-300">{Math.round(z.avg_di_24h || 0)}</td>
                  <td className="py-3 pr-6 text-slate-300">{Math.round(z.peak_di_24h || 0)}</td>
                  <td className="py-3 pr-6 text-slate-300">{z.risk_multiplier}×</td>
                  <td className="py-3 text-slate-300">{z.active_policies || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
