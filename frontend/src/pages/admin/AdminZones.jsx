import { useState, useEffect } from 'react';
import { adminZones, fetchZones } from '../../services/api.js';
import { Loader, MapPin, TrendingUp, Users, BarChart2, X, AlertTriangle } from 'lucide-react';
import ZoneMap from '../../components/ZoneMap.jsx';

const DI_COLOR = di => di > 75 ? 'text-red-400 bg-red-900/30 border-red-700'
                      : di > 50 ? 'text-orange-400 bg-orange-900/30 border-orange-700'
                      : di > 25 ? 'text-amber-400 bg-amber-900/30 border-amber-700'
                      :           'text-emerald-400 bg-emerald-900/30 border-emerald-700';

const DI_BAR_COLOR = di => di > 75 ? '#ef4444' : di > 50 ? '#f97316' : di > 25 ? '#f59e0b' : '#10b981';
const DI_LABEL     = di => di > 75 ? 'Disrupted' : di > 50 ? 'High' : di > 25 ? 'Moderate' : 'Safe';

/* ─── Inline Detail Panel shown when a zone is clicked on the map ─── */
function ZoneDetailPanel({ zone, onClose }) {
  if (!zone) return null;
  const di      = parseFloat(zone.current_di || 0);
  const avg     = Math.round(zone.avg_di_24h || 0);
  const peak    = Math.round(zone.peak_di_24h || 0);
  const name    = zone.zone_id.replace('Zone_', '').replace(/_/g, ' ');

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(99,102,241,0.35)',
      borderRadius: 14,
      padding: '20px 22px',
      minWidth: 260,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      position: 'relative',
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
      >
        <X size={16} />
      </button>

      {/* Zone name + DI badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <MapPin size={16} color="#6366f1" />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{name}</span>
        <span style={{
          marginLeft: 'auto',
          padding: '3px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          background: di > 75 ? 'rgba(239,68,68,0.15)' : di > 50 ? 'rgba(249,115,22,0.15)' : di > 25 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
          color: DI_BAR_COLOR(di),
          border: `1px solid ${DI_BAR_COLOR(di)}44`,
        }}>
          {Math.round(di)} · {DI_LABEL(di)}
        </span>
      </div>

      {/* DI Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Current DI</div>
        <div style={{ height: 6, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(di, 100)}%`, background: DI_BAR_COLOR(di), borderRadius: 4, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: '24h Avg DI',       value: avg,                    icon: <BarChart2 size={13} color="#6366f1" /> },
          { label: 'Peak DI (24h)',    value: peak,                   icon: <TrendingUp size={13} color="#f59e0b" /> },
          { label: 'Risk Multiplier',  value: `${zone.risk_multiplier}×`, icon: <AlertTriangle size={13} color="#f97316" /> },
          { label: 'Active Policies',  value: zone.active_policies || 0, icon: <Users size={13} color="#10b981" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ background: '#1e293b', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, fontSize: 10.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {icon} {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* City tag */}
      <div style={{ marginTop: 12, fontSize: 11.5, color: '#475569' }}>
        📍 {zone.city || 'Bengaluru'}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminZones() {
  const [zones, setZones]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);  // zone_id string
  const [panelZone, setPanelZone] = useState(null);         // full zone object

  useEffect(() => {
    Promise.all([adminZones(), fetchZones()])
      .then(([adminRes, zonesRes]) => {
        const statsMap = {};
        (adminRes.data.zones || []).forEach(z => { statsMap[z.zone_id] = z; });
        // Merge geometry from public zones API into admin stats
        const merged = (adminRes.data.zones || []).map(z => ({
          ...z,
          geom: (zonesRes.data.zones || zonesRes.data || []).find(g => g.zone_id === z.zone_id)?.geom || null,
        }));
        setZones(merged);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleZoneSelect = (zone_id) => {
    setSelectedZone(zone_id);
    setPanelZone(zones.find(z => z.zone_id === zone_id) || null);
  };

  const handleClosePanel = () => {
    setSelectedZone(null);
    setPanelZone(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Zone Monitor</h1>
        <p className="text-slate-400 text-sm mt-1">
          Live disruption index across all {zones.length} delivery zones. Click any zone on the map for full details.
        </p>
      </div>

      {/* ── Live Map + Detail Panel ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Map */}
        <div style={{
          flex: 1,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          minWidth: 0,
        }}>
          <ZoneMap
            zones={zones}
            selectedZone={selectedZone}
            onZoneSelect={handleZoneSelect}
            height={440}
          />
        </div>

        {/* Detail panel — shown when a zone is selected */}
        <div style={{ width: 280, flexShrink: 0 }}>
          {panelZone ? (
            <ZoneDetailPanel zone={panelZone} onClose={handleClosePanel} />
          ) : (
            <div style={{
              background: '#0f172a',
              border: '1px dashed rgba(99,102,241,0.25)',
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              color: '#475569',
              fontSize: 13,
            }}>
              <MapPin size={28} color="#334155" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>No Zone Selected</div>
              Click any zone polygon on the map to view its live DI data, peak stats, and policy coverage.
            </div>
          )}
        </div>
      </div>

      {/* ── Full Data Table ── */}
      <div>
        <h2 className="text-base font-bold text-slate-300 mb-4 uppercase tracking-widest" style={{ fontSize: 11 }}>
          All Zones — Full Data Table
        </h2>
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
                const di   = parseFloat(z.current_di || 0);
                const name = z.zone_id.replace('Zone_', '').replace(/_/g, ' ');
                const isSelected = z.zone_id === selectedZone;
                return (
                  <tr
                    key={z.zone_id}
                    onClick={() => handleZoneSelect(z.zone_id)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    style={isSelected ? { background: 'rgba(99,102,241,0.08)', borderLeft: '3px solid #6366f1' } : {}}
                  >
                    <td className="py-3 pr-6 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        {name}
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

    </div>
  );
}
