import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport, fetchPolicyStatus } from '../services/api.js';
import { Fingerprint, Activity, Cpu, Users, MapPin, Camera, RefreshCw, Send, AlertTriangle, CheckCircle, ChevronLeft, ShieldAlert, ArrowRight } from 'lucide-react';

const GATES = [
  {
    id: 'duplicate', icon: Fingerprint,
    name: 'Integrity Check',
    desc: 'Validating unique session signature to prevent duplicate claims.',
  },
  {
    id: 'velocity', icon: Activity,
    name: 'Velocity Audit',
    desc: 'Verifying GPS movement is within physical bounds.',
  },
  {
    id: 'ai', icon: Cpu,
    name: 'Neural Scene Vision',
    desc: 'Visual scan for disruption presence and spoofing detection.',
  },
  {
    id: 'threshold', icon: Users,
    name: 'Consensus Threshold',
    desc: 'Aggregating regional node clusters for event verification.',
  },
];

export default function Report({ jwt, onBack }) {
  const navigate = useNavigate();
  const [policy,   setPolicy]   = useState(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [geoData,  setGeoData]  = useState(null);
  const [geoErr,   setGeoErr]   = useState('');
  const [imgB64,   setImgB64]   = useState('');
  const [stream,   setStream]   = useState(null);
  const [step,     setStep]     = useState('idle');
  const [result,   setResult]   = useState(null);
  const [gateStatus, setGateStatus] = useState({});
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchPolicyStatus()
      .then(r => setPolicy(r.data))
      .catch(() => {})
      .finally(() => setPolicyLoading(false));
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

  const getLocation = () => {
    setStep('locating');
    setGeoErr('');
    navigator.geolocation.getCurrentPosition(
      pos => setGeoData({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      err => { setGeoErr(`Location required: ${err.message}`); setStep('idle'); },
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
      setGeoErr('Camera access is required to securely capture the disruption scene.');
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
      const err    = e.response?.data;
      const code   = err?.error;

      // Onboarding not complete — show friendly redirect
      if (code === 'ONBOARDING_REQUIRED' || e.response?.status === 403) {
        setResult({ success: false, error: 'ONBOARDING_REQUIRED' });
        setStep('error');
        return;
      }

      const failGate = err?.gate_failed === 'DUPLICATE'  ? 'duplicate'
                     : err?.gate_failed === 'VELOCITY'   ? 'velocity'
                     : err?.gate_failed === 'AI_VISION'  ? 'ai'
                     : err?.gate_failed === 'THRESHOLD'  ? 'threshold'
                     : 'ai';
      setGateStatus(g => ({ ...g, [failGate]: 'failed' }));
      setResult({ success: false, error: err?.message || err?.error || 'Submission failed during verification.' });
      setStep('error');
    }
  };

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  const gateSt = id => gateStatus[id] ?? 'pending';

  return (
    <div className="page-container-wide animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition mb-6" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="page-header-eyebrow flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Incident Reporting
        </div>
        <h1 className="page-header-title">Log a Disruption</h1>
        <p className="page-header-subtitle">
          Secure, automated verification. All submissions run through our 4-point fraud prevention array.
        </p>
      </div>

      {/* ── GPS + Zone Info ── */}
      {policy && (
        <div className="card card-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-brand-400 bg-white shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Registered Sector</div>
            <div className="text-base font-bold text-slate-900">
              {(policy.zone_id ?? '').replace('Zone_', '').replace(/_/g, ' ')}
            </div>
          </div>
          {geoData ? (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-semibold shadow-sm">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{geoData.lat.toFixed(4)}, {geoData.lon.toFixed(4)}</span>
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-semibold shadow-sm">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Awaiting GPS Lock</span>
            </div>
          )}
        </div>
      )}

      {/* ── 4 Gates Panel ── */}
      <div className="card mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-brand-500" />
          <h2 className="text-base font-bold text-slate-900">Verification Protocol</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GATES.map(g => {
            const st = gateSt(g.id);
            return (
              <div key={g.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors duration-300 ${
                st === 'passed' ? 'bg-emerald-50 border-emerald-200' :
                st === 'failed' ? 'bg-rose-50 border-rose-200' :
                st === 'checking' ? 'bg-brand-50 border-brand-200 shadow-sm' :
                'bg-slate-50 border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${
                    st === 'passed' ? 'bg-emerald-100 text-emerald-600' :
                    st === 'failed' ? 'bg-rose-100 text-rose-600' :
                    st === 'checking' ? 'bg-brand-100 text-brand-600 animate-pulse' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    <g.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                    st === 'passed' ? 'text-emerald-700 bg-emerald-100' :
                    st === 'failed' ? 'text-rose-700 bg-rose-100' :
                    st === 'checking' ? 'text-brand-700 bg-brand-100' :
                    'text-slate-500 bg-slate-200'
                  }`}>
                    {st}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{g.name}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{g.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Success Result ── */}
      {step === 'done' && result?.success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-xl shadow-md mb-8">
          <div className="flex gap-4">
            <CheckCircle className="text-emerald-600 w-6 h-6 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-900 mb-1">Event Logged Successfully</h3>
              <p className="text-emerald-700 text-sm font-medium leading-relaxed">
                Your report has passed all checks and is contributing to the regional Disruption Index. 
                If the severity threshold is reached, settlements will trigger automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Result ── */}
      {step === 'error' && result && (
        result.error === 'ONBOARDING_REQUIRED' ? (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl shadow-md mb-8">
            <div className="flex gap-4">
              <ShieldAlert className="text-amber-600 w-6 h-6 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 mb-1">Onboarding Required</h3>
                <p className="text-amber-700 text-sm font-medium leading-relaxed mb-4">
                  You must complete onboarding and activate a policy before you can submit disruption reports.
                </p>
                <button
                  onClick={() => navigate('/app/onboard')}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow"
                >
                  Complete Onboarding <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-xl shadow-md mb-8">
            <div className="flex gap-4">
              <AlertTriangle className="text-rose-600 w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-rose-900 mb-1">Verification Failed</h3>
                <p className="text-rose-700 text-sm font-medium leading-relaxed">{result.error}</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Camera Area ── */}
      {(step === 'camera' || step === 'reviewing') && (
        <div className="card p-0 overflow-hidden shadow-lg border-brand-200 mb-6">
          <div className="bg-slate-900 relative aspect-[4/3] flex items-center justify-center overflow-hidden">
            {step === 'camera' && (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 text-white font-semibold text-xs tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  LIVE RECORDING
                </div>
              </>
            )}
            {step === 'reviewing' && imgB64 && (
              <img src={imgB64} alt="Captured preview" className="w-full h-full object-cover" />
            )}
          </div>
          
          <div className="bg-white p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {step === 'camera' && (
              <button className="btn-premium-primary sm:col-span-2 py-4" onClick={capture}>
                <Camera className="w-5 h-5" /> CAPTURE EVIDENCE
              </button>
            )}
            {step === 'reviewing' && (
              <>
                <button className="btn-premium-secondary py-3.5" onClick={retake}>
                  <RefreshCw className="w-4 h-4" /> Retake Photo
                </button>
                <button className="btn-premium-primary py-3.5" onClick={submit}>
                  <Send className="w-4 h-4" /> Secure Transmission
                </button>
              </>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
             <ShieldAlert className="w-4 h-4 text-slate-400" /> Uploads from device gallery are strictly disabled.
          </div>
        </div>
      )}

      {/* ── Main CTA ── */}
      {step === 'idle' && (
        <div className="card shadow-md border border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center">
              <Camera className="w-8 h-8 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Capture the Disruption</h2>
              <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                Securely log your current location and take a live photo of the incident to verify your environment.
              </p>
            </div>
            
            {geoErr && (
              <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-lg font-medium border border-rose-100">
                <AlertTriangle className="w-4 h-4" /> {geoErr}
              </div>
            )}
            
            <button className="btn-premium-primary w-full max-w-sm py-4 text-lg shadow-lg hover:shadow-xl mt-4" onClick={getLocation}>
              {step === 'locating' ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Acquiring Satellites...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Initialize Camera Scanner
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'submitting' && (
        <div className="card shadow-xl border-brand-200 text-center py-16">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
            <ShieldAlert className="absolute inset-0 m-auto w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Executing Audit Protocol</h2>
          <p className="text-sm text-slate-500 font-medium">Validating evidence matrix. This process requires 3-5 seconds.</p>
        </div>
      )}

      {(step === 'done' || step === 'error') && (
        <button className="btn-premium-secondary w-full py-4 text-base font-bold shadow-sm" onClick={() => {
          setStep('idle'); setGateStatus({}); setImgB64(''); setResult(null); setGeoData(null);
        }}>
          Initiate New Report
        </button>
      )}
    </div>
  );
}
