import { useState, useRef, useEffect } from 'react';
import { submitReport, fetchPolicyStatus } from '../services/api.js';

const GATES = [
  {
    id: 'duplicate', icon: '🔁',
    name: 'Gate 1 — Duplicate Check',
    desc: 'Blocks repeated reports within 5 minutes from the same rider.',
  },
  {
    id: 'velocity', icon: '🛰️',
    name: 'Gate 2 — GPS Velocity Check',
    desc: 'Haversine model rejects if GPS speed > 80 km/h (physically impossible on foot).',
  },
  {
    id: 'ai', icon: '🤖',
    name: 'Gate 3 — AI Vision Analysis',
    desc: 'CLIP zero-shot verifies disruption scene + FFT Moiré scan rejects screenshots.',
  },
  {
    id: 'threshold', icon: '📊',
    name: 'Gate 4 — Crowdsource Threshold',
    desc: 'Logarithmic model U_min = max(3, ⌈2.5·ln(N+1)⌉) prevents single-rider manipulation.',
  },
];

export default function Report({ jwt, onBack }) {
  const [policy,   setPolicy]   = useState(null);
  const [geoData,  setGeoData]  = useState(null);
  const [geoErr,   setGeoErr]   = useState('');
  const [imgB64,   setImgB64]   = useState('');
  const [stream,   setStream]   = useState(null);
  const [step,     setStep]     = useState('idle'); // idle | locating | camera | reviewing | submitting | done | error
  const [result,   setResult]   = useState(null);
  const [gateStatus, setGateStatus] = useState({});
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchPolicyStatus().then(r => setPolicy(r.data)).catch(() => {});
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

  const getLocation = () => {
    setStep('locating');
    setGeoErr('');
    navigator.geolocation.getCurrentPosition(
      pos => setGeoData({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      err => { setGeoErr(`GPS error: ${err.message}`); setStep('idle'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (geoData && step === 'locating') startCamera();
  }, [geoData]);

  const startCamera = async () => {
    setStep('camera');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      setStream(s);
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch (e) {
      setGeoErr('Camera access denied. Please allow camera in browser settings.');
      setStep('idle');
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setImgB64(c.toDataURL('image/jpeg', 0.85));
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setStep('reviewing');
  };

  const retake = async () => {
    setImgB64('');
    await startCamera();
  };

  const submit = async () => {
    setStep('submitting');
    setGateStatus({ duplicate: 'checking', velocity: 'pending', ai: 'pending', threshold: 'pending' });

    // Animate gates sequentially
    await delay(600); setGateStatus(g => ({ ...g, duplicate: 'passed', velocity: 'checking' }));
    await delay(700); setGateStatus(g => ({ ...g, velocity: 'passed', ai: 'checking' }));

    try {
      const res = await submitReport({
        image_b64:  imgB64,
        latitude:   geoData.lat,
        longitude:  geoData.lon,
        rider_id:   null,
        zone_id:    policy?.zone_id,
      });
      setGateStatus(g => ({ ...g, ai: 'passed', threshold: 'checking' }));
      await delay(800);
      setGateStatus(g => ({ ...g, threshold: 'passed' }));
      await delay(300);
      setResult({ success: true, data: res.data });
      setStep('done');
    } catch (e) {
      const err = e.response?.data;
      // Determine which gate failed
      const failGate = err?.gate_failed === 'DUPLICATE'  ? 'duplicate'
                     : err?.gate_failed === 'VELOCITY'   ? 'velocity'
                     : err?.gate_failed === 'AI_VISION'  ? 'ai'
                     : err?.gate_failed === 'THRESHOLD'  ? 'threshold'
                     : 'ai';
      setGateStatus(g => ({ ...g, [failGate]: 'failed' }));
      setResult({ success: false, error: err?.error || 'Submission failed.' });
      setStep('error');
    }
  };

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  const gateSt = id => gateStatus[id] ?? 'pending';
  const gateClass = st => ({ passed: 'passed', failed: 'failed', checking: 'checking', pending: 'pending' }[st]);
  const gateIcon  = st => st === 'passed'   ? '✅'
                         : st === 'failed'   ? '❌'
                         : st === 'checking' ? '⏳'
                         : '○';

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      {/* ── Header ── */}
      <div className="page-header">
        <button className="btn btn-ghost btn-sm mb-3" onClick={onBack}>← Back to Dashboard</button>
        <div className="page-header-eyebrow">Disruption Report</div>
        <h1 className="page-header-title">Report a Disruption</h1>
        <p className="page-header-subtitle">
          All reports pass 4 automated gates before contributing to your zone's DI score.
        </p>
      </div>

      {/* ── GPS + Zone Info ── */}
      {policy && (
        <div className="card card-sm mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Registered Zone</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginTop: 2 }}>
              {(policy.zone_id ?? '').replace('Zone_', '').replace(/_/g, ' ')}
            </div>
          </div>
          {geoData ? (
            <span className="badge badge-green">📍 {geoData.lat.toFixed(4)}, {geoData.lon.toFixed(4)}</span>
          ) : (
            <span className="badge badge-amber">📍 GPS not locked</span>
          )}
        </div>
      )}

      {/* ── 4 Gates Panel ── */}
      <div className="card mb-4" style={{ padding: 16 }}>
        <div className="section-label mb-3">4-Gate Fraud Prevention</div>
        <div className="gate-list">
          {GATES.map(g => {
            const st = gateSt(g.id);
            return (
              <div key={g.id} className={`gate-item ${gateClass(st)}`}>
                <span className="gate-icon">{st === 'pending' ? g.icon : gateIcon(st)}</span>
                <div className="gate-info">
                  <div className="gate-name">{g.name}</div>
                  <div className="gate-desc">{g.desc}</div>
                </div>
                <span className={`gate-status badge ${
                  st === 'passed'   ? 'badge-green' :
                  st === 'failed'   ? 'badge-red' :
                  st === 'checking' ? 'badge-blue' :
                  'badge-subtle'
                }`}>
                  {st === 'pending' ? 'Waiting' : st.charAt(0).toUpperCase() + st.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Success Result ── */}
      {step === 'done' && result?.success && (
        <div className="alert alert-success mb-4">
          ✅ <strong>Report accepted.</strong> Your submission is contributing to the zone DI score.
          When the threshold is reached, auto-settlement triggers automatically.
        </div>
      )}

      {/* ── Error Result ── */}
      {step === 'error' && result && (
        <div className="alert alert-error mb-4">
          ❌ <strong>Report rejected:</strong> {result.error}
        </div>
      )}

      {/* ── Camera Area ── */}
      {(step === 'camera' || step === 'reviewing') && (
        <div className="card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
          <div className={`camera-container${step === 'camera' ? ' active' : ''}`} style={{ borderRadius: 0, border: 'none', aspectRatio: '4/3' }}>
            {step === 'camera' && (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="camera-overlay">LIVE</div>
              </>
            )}
            {step === 'reviewing' && imgB64 && (
              <img src={imgB64} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
            {step === 'camera' && (
              <button className="btn btn-primary btn-full" onClick={capture}>📸 Capture Photo</button>
            )}
            {step === 'reviewing' && (
              <>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={retake}>🔄 Retake</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={submit}>🚀 Submit Report</button>
              </>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ padding: '8px 16px 12px', fontSize: 11.5, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            🔒 Live camera only · No gallery access · Anti-fraud enforced
          </div>
        </div>
      )}

      {/* ── Main CTA ── */}
      {step === 'idle' && (
        <div className="card">
          <div className="section-label mb-3">How to Report</div>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Lock your GPS</strong> — confirms you're in the disrupted zone</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Capture a live photo</strong> — gallery blocked, camera only</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Submit</strong> — AI verifies the scene in seconds</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Payment triggers</strong> — when enough riders confirm</li>
          </ol>
          {geoErr && <div className="alert alert-error mt-4">{geoErr}</div>}
          <button className="btn btn-primary btn-full btn-lg mt-4" onClick={getLocation}>
            {step === 'locating' ? <><span className="spinner" /> Getting Location…</> : '📍 Get Location & Start Camera'}
          </button>
        </div>
      )}

      {step === 'submitting' && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Running 4-Gate Verification…</div>
          <p className="text-sm text-muted mt-2">This takes about 3 seconds</p>
        </div>
      )}

      {(step === 'done' || step === 'error') && (
        <button className="btn btn-secondary btn-full mt-4" onClick={() => {
          setStep('idle'); setGateStatus({}); setImgB64(''); setResult(null); setGeoData(null);
        }}>
          Submit Another Report
        </button>
      )}
    </div>
  );
}
