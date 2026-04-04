import { MapContainer, TileLayer, GeoJSON, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const DI_COLOR = di => {
  if (di > 75)  return { color: '#f87171', fillColor: '#ef4444', fillOpacity: 0.35 };
  if (di > 50)  return { color: '#fb923c', fillColor: '#f97316', fillOpacity: 0.25 };
  if (di > 25)  return { color: '#fbbf24', fillColor: '#f59e0b', fillOpacity: 0.20 };
  return              { color: '#34d399', fillColor: '#10b981', fillOpacity: 0.12 };
};

const DI_LABEL = di => di > 75 ? 'Disrupted' : di > 50 ? 'High' : di > 25 ? 'Moderate' : 'Safe';

function FitBounds({ zones }) {
  const map = useMap();
  useEffect(() => {
    if (!zones?.length) return;
    try {
      const L = window.L;
      if (!L) return;
      const allCoords = zones
        .filter(z => z.geom)
        .flatMap(z => {
          try { return JSON.parse(z.geom || z.geometry || '{}').coordinates?.[0] ?? []; }
          catch { return []; }
        });
      if (allCoords.length) {
        const latLngs = allCoords.map(([lng, lat]) => [lat, lng]);
        map.fitBounds(latLngs, { padding: [24, 24] });
      }
    } catch {}
  }, [zones, map]);
  return null;
}

export default function ZoneMap({ zones = [], selectedZone, onZoneSelect, height = 380 }) {
  const center = [12.9352, 77.6245]; // Bengaluru centre

  const onEachFeature = (zone) => (feature, layer) => {
    const di = zone.current_di ?? 0;
    const name = zone.zone_id.replace('Zone_', '').replace(/_/g, ' ');

    layer.setStyle({ ...DI_COLOR(di), weight: selectedZone === zone.zone_id ? 2.5 : 1.5 });

    layer.bindTooltip(
      `<div style="font-family:Inter,sans-serif;background:#fff;border:1px solid rgba(0,0,0,0.10);border-radius:8px;padding:10px 14px;color:#1e293b;box-shadow:0 4px 16px rgba(0,0,0,0.10)">
        <strong style="font-size:13px">${name}</strong><br/>
        <span style="font-size:11px;color:#64748b">DI: <strong style="color:${di>75?'#ef4444':di>50?'#f97316':di>25?'#f59e0b':'#10b981'}">${Math.round(di)}</strong> · ${DI_LABEL(di)}</span>
        ${onZoneSelect ? '<br/><span style="font-size:10.5px;color:#94a3b8;margin-top:4px;display:block">Click to select</span>' : ''}
      </div>`,
      { permanent: false, sticky: true, opacity: 1 }
    );

    if (onZoneSelect) {
      layer.on('click', () => onZoneSelect(zone.zone_id));
      layer.on('mouseover', () => layer.setStyle({ ...DI_COLOR(di), weight: 2.5, fillOpacity: Math.min(di > 0 ? 0.45 : 0.20, 0.55) }));
      layer.on('mouseout',  () => layer.setStyle({ ...DI_COLOR(di), weight: selectedZone === zone.zone_id ? 2.5 : 1.5 }));
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height, width: '100%', background: '#f0f4f8' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />

      {/* Auto-zoom to fit all zones */}
      {zones.length > 0 && <FitBounds zones={zones} />}

      {zones.map(zone => {
        if (!zone.geom && !zone.geometry) return null;
        let geoJson;
        try {
          geoJson = typeof zone.geom === 'string' ? JSON.parse(zone.geom) :
                    typeof zone.geometry === 'string' ? JSON.parse(zone.geometry) :
                    zone.geom || zone.geometry;
          if (!geoJson) return null;
        } catch { return null; }

        const isSelected = selectedZone === zone.zone_id;
        const di = zone.current_di ?? 0;

        return (
          <GeoJSON
            key={zone.zone_id + (zone.current_di ?? '') + (isSelected ? '_sel' : '')}
            data={geoJson}
            style={{ ...DI_COLOR(di), weight: isSelected ? 3 : 1.5, opacity: 1 }}
            onEachFeature={onEachFeature(zone)}
          />
        );
      })}

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        background: 'rgba(255,255,255,0.93)', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
        fontFamily: 'Inter,sans-serif', boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(0,0,0,0.35)', marginBottom: 8 }}>
          Disruption Index
        </div>
        {[['#10b981', 'Safe (0–25)'], ['#f59e0b', 'Moderate (25–50)'], ['#f97316', 'High (50–75)'], ['#ef4444', 'Disrupted (75+)']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0', fontSize: 11.5, color: '#475569' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>
    </MapContainer>
  );
}
