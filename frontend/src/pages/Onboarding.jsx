import { useState } from 'react';
import { fetchProfile, submitOnboarding, fetchZones } from '../services/api.js';
import ZoneMap from '../components/ZoneMap.jsx';

const PLATFORM_COLOR = {
  Zomato:  'platform-zomato',
  Swiggy:  'platform-swiggy',
  Blinkit: 'platform-blinkit',
  Porter:  'platform-porter',
  Dunzo:   'platform-dunzo',
};

const DEMO_IDS = [
  'ZOMATO_DEMO_RIDER_001', 'SWIGGY_DEMO_RIDER_001', 'ZOMATO_DEMO_RIDER_002',
  'BLINKIT_RIDER_001', 'SWIGGY_DEMO_RIDER_002', 'PORTER_RIDER_001',
];

export default function Onboarding({ onActivated }) {
  const [step,       setStep]       = useState(1);
  const [riderId,    setRiderId]    = useState('');
  const [profile,    setProfile]    = useState(null);
  const [zones,      setZones]      = useState([]);
  const [selectedZ,  setSelectedZ]  = useState('');
  const [consent,    setConsent]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [activating, setActivating] = useState(false);

  // ── Step 1: Fetch profile ───────────────────────────────
  const handleFetch = async () => {
    if (!riderId.trim()) return setError('Please enter your Rider ID.');
    setLoading(true); setError('');
    try {
      const res = await fetchProfile(riderId.trim());
      setProfile(res.data);
      const z = await fetchZones();
      setZones(z.data ?? []);
      if (z.data?.length) setSelectedZ(z.data[0].zone_id);
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not fetch profile. Check your Rider ID.');
    } finally { setLoading(false); }
  };

  // ── Step 3: Activate ────────────────────────────────────
  const handleActivate = async () => {
    if (!selectedZ) return setError('Please select a zone.');
    if (!consent)   return setError('Please accept the coverage terms.');
    setActivating(true); setError('');
    try {
      const res = await submitOnboarding({
        platform_rider_id: riderId,
        zone_id: selectedZ,
        consent: true,
      });
      onActivated(res.data.token);
    } catch (e) {
      setError(e.response?.data?.error || 'Activation failed. Please try again.');
    } finally { setActivating(false); }
  };

  const p = profile;
  const platClass = p ? (PLATFORM_COLOR[p.platform] ?? '') : '';

  // Payout calc for consent text
  const eAvg       = p?.e_avg ?? 0;
  const payoutHr   = (eAvg * 0.85).toFixed(2);
  const selZone    = zones.find(z => z.zone_id === selectedZ);

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      {/* ── Hero ── */}
      <div className="onboarding-hero">
        <div className="hero-logo">🛡️</div>
        <h1 className="hero-title">
          WorkSafe<br />
          <span>Income Protection</span>
        </h1>
        <p className="hero-subtitle">
          AI-powered parametric insurance for gig workers.
          Get paid when disruptions prevent you from working.
        </p>
      </div>

      {/* ── Stepper ── */}
      <div className="stepper">
        <div className="step-item">
          <div className={`step-circle ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <span className={`step-label ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>
            Verify Identity
          </span>
        </div>
        <div className={`step-line ${step > 1 ? 'done' : ''}`} />
        <div className="step-item">
          <div className={`step-circle ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>
            {step > 2 ? '✓' : '2'}
          </div>
          <span className={`step-label ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>
            Select Zone
          </span>
        </div>
        <div className={`step-line ${step > 2 ? 'done' : ''}`} />
        <div className="step-item">
          <div className={`step-circle ${step === 3 ? 'active' : ''}`}>3</div>
          <span className={`step-label ${step === 3 ? 'active' : ''}`}>Activate</span>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

      {/* ════════════════════ STEP 1 ════════════════════ */}
      {step === 1 && (
        <div className="card card-lg">
          <div className="section-label">Verify Your Delivery Account</div>
          <p className="text-sm text-muted mb-4">
            We'll securely fetch your earnings and shift data from your delivery platform.
          </p>

          <div className="form-group mb-4">
            <label className="form-label">Partner Rider ID</label>
            <input
              className="form-input"
              placeholder="e.g. ZOMATO_DEMO_RIDER_001"
              value={riderId}
              onChange={e => setRiderId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
            />
            <span className="form-hint">
              Your unique ID from your delivery platform's partner portal.
            </span>
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handleFetch} disabled={loading}>
            {loading ? <><span className="spinner" /> Fetching…</> : '🔍 Fetch My Profile'}
          </button>

          <div className="divider" />
          <div className="section-label" style={{ marginBottom: 8 }}>Demo IDs — try any</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DEMO_IDS.map(id => (
              <button key={id} className="btn btn-secondary btn-sm"
                onClick={() => setRiderId(id)}>
                {id.replace(/_/g, '\u200B_')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════ STEP 2 ════════════════════ */}
      {step === 2 && p && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Rider profile card */}
          <div className="card">
            <div className="rider-card" style={{ padding: 0, border: 'none', background: 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="rider-avatar">{p.name?.[0] ?? '?'}</div>
                <div className="rider-info">
                  <h3>{p.name}</h3>
                  <p>
                    <span className={`font-bold ${platClass}`}>{p.platform}</span>
                    {' · '}{p.city}
                    {p.total_deliveries && <> · {p.total_deliveries.toLocaleString()} deliveries</>}
                  </p>
                </div>
              </div>
              <span className="badge badge-green">✓ Verified</span>
            </div>

            <div className="rider-stats">
              <div className="rider-stat">
                <div className="rider-stat-val">₹{Number(p.e_avg).toFixed(2)}</div>
                <div className="rider-stat-lbl">Avg/hr Earnings</div>
              </div>
              <div className="rider-stat">
                <div className="rider-stat-val">{p.shift_pattern?.start}–{p.shift_pattern?.end}</div>
                <div className="rider-stat-lbl">Shift Hours</div>
              </div>
              <div className="rider-stat">
                <div className="rider-stat-val">{p.rating ?? '—'}</div>
                <div className="rider-stat-lbl">Platform Rating</div>
              </div>
            </div>
          </div>

          {/* Zone picker */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 20px 12px' }}>
              <div className="section-label">Select Your Primary Delivery Zone</div>
              <p className="text-sm text-muted">Choose the zone where you do most of your deliveries.</p>
            </div>
            <div className="zone-map-card">
              <ZoneMap
                zones={zones}
                selectedZone={selectedZ}
                onZoneSelect={setSelectedZ}
                height={300}
              />
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div className="zone-buttons">
                {zones.map(z => (
                  <button key={z.zone_id}
                    className={`zone-btn ${selectedZ === z.zone_id ? 'selected' : ''}`}
                    onClick={() => setSelectedZ(z.zone_id)}>
                    {z.zone_id.replace('Zone_', '').replace(/_/g, ' ')}
                    {z.current_di && (
                      <span style={{ marginLeft: 6 }}>
                        <span className={`di-badge ${z.current_di > 75 ? 'di-disrupted' : z.current_di > 50 ? 'di-high' : z.current_di > 25 ? 'di-moderate' : 'di-safe'}`}>
                          {Math.round(z.current_di)}
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(3)} disabled={!selectedZ}>
            Continue to Activation →
          </button>
        </div>
      )}

      {/* ════════════════════ STEP 3 ════════════════════ */}
      {step === 3 && p && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Policy summary */}
          <div className="card">
            <div className="section-label">Your Coverage Summary</div>
            <div className="stat-grid mt-3">
              <div className="card card-sm" style={{ background: 'var(--surface-1)' }}>
                <div className="card-label">Zone</div>
                <div className="card-value-sm">{(selectedZ || '').replace('Zone_', '').replace(/_/g, ' ')}</div>
              </div>
              <div className="card card-sm" style={{ background: 'var(--surface-1)' }}>
                <div className="card-label">Payout Rate</div>
                <div className="card-value-sm font-mono">₹{payoutHr}/hr</div>
              </div>
              <div className="card card-sm" style={{ background: 'var(--surface-1)' }}>
                <div className="card-label">Coverage</div>
                <div className="card-value-sm">Auto</div>
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="card">
            <div className="section-label mb-3">Terms of Coverage</div>
            <div className="consent-box">
              This policy covers loss of income due to environmental disruption events in your
              selected delivery zone. You will receive{' '}
              <span className="consent-highlight">₹{payoutHr}/hr</span> (C_ratio = 0.85 ×
              your ₹{Number(eAvg).toFixed(2)}/hr baseline) for verified hours lost when the
              zone Disruption Index exceeds <span className="consent-highlight">75</span>.
              Payouts are processed automatically via Razorpay within 30 minutes of settlement.
              You may opt out before Sunday 23:59 each week. <strong>No claim required —
              the system pays out automatically.</strong>
            </div>
            <div className="mt-4">
              <label className="checkbox-row">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                <span className="checkbox-label">
                  I agree to the loss-of-income coverage terms above and consent to GPS and camera
                  verification for disruption reports.
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
              ← Back
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }}
              onClick={handleActivate} disabled={activating || !consent}>
              {activating ? <><span className="spinner" /> Activating…</> : '🛡️ Activate Protection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
