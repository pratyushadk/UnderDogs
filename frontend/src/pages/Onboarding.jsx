import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, UserCheck, MapPin, CheckCircle, ChevronRight,
  Search, Activity, Zap, Star, CreditCard, Loader, ArrowLeft
} from 'lucide-react';
import {
  fetchProfile, submitOnboarding, fetchZones,
  createPaymentOrder, verifyPayment,
} from '../services/api.js';
import ZoneMap from '../components/ZoneMap.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── constants ─────────────────────────────────────────── */
const PLATFORM_COLOR = {
  Zomato:  { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  Swiggy:  { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  Blinkit: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  Porter:  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  Dunzo:   { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
};

const DEMO_IDS = [
  'ZOMATO_DEMO_RIDER_001', 'SWIGGY_DEMO_RIDER_001',
  'ZOMATO_DEMO_RIDER_002', 'BLINKIT_RIDER_001',
  'SWIGGY_DEMO_RIDER_002', 'PORTER_RIDER_001',
];

const STEPS = [
  { id: 1, icon: UserCheck, label: 'Link Account',   sub: 'Verify your rider identity' },
  { id: 2, icon: MapPin,    label: 'Choose Zone',    sub: 'Pick your coverage area' },
  { id: 3, icon: Shield,    label: 'Review Policy',  sub: 'Confirm your protection' },
  { id: 4, icon: CreditCard,label: 'Activate',       sub: 'Pay & start coverage' },
];

/* ─── helpers ───────────────────────────────────────────── */
function fmt(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

/* ─── Left Panel ─────────────────────────────────────────── */
function LeftPanel({ step }) {
  return (
    <div className="ob-left" style={{
      background: 'linear-gradient(160deg, #0F172A 0%, #1E1B4B 100%)',
      display: 'flex', flexDirection: 'column', padding: '40px 32px',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
        <div style={{ width: 36, height: 36, background: '#4F46E5', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
          Work<span style={{ color: '#818CF8' }}>Safe</span>
        </span>
      </Link>

      {/* Headline */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', lineHeight: 1.3, marginBottom: 10 }}>
          Set up your income protection
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.7 }}>
          Takes under 3 minutes. Zero paperwork after this.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {STEPS.map((s, idx) => {
          const done    = step > s.id;
          const active  = step === s.id;
          return (
            <div key={s.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0' }}>
              {/* Icon/number */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#10B981' : active ? '#4F46E5' : 'rgba(255,255,255,0.06)',
                border: `2px solid ${done ? '#10B981' : active ? '#4F46E5' : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.4s ease',
              }}>
                {done
                  ? <CheckCircle size={16} color="white" strokeWidth={2.5} />
                  : <s.icon size={15} color={active ? 'white' : '#475569'} strokeWidth={2} />
                }
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: done ? '#10B981' : active ? 'white' : '#475569', transition: 'color 0.3s' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 12, color: active ? '#94A3B8' : '#334155', marginTop: 2 }}>{s.sub}</div>
              </div>
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', left: 50, marginTop: 48,
                  width: 2, height: 28,
                  background: done ? '#10B981' : 'rgba(255,255,255,0.06)',
                  borderRadius: 1, transition: 'background 0.4s',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { icon: Shield, text: 'Your data is encrypted & private' },
          { icon: Zap,    text: 'Payouts in under 2 hours' },
          { icon: CheckCircle, text: 'Cancel anytime, no lock-in' },
        ].map(item => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <item.icon size={13} color="#4F46E5" />
            <span style={{ fontSize: 12.5, color: '#475569' }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Right Panel shell ──────────────────────────────────── */
function RightPanel({ children }) {
  return (
    <div className="ob-right">
      <div style={{ width: '100%', maxWidth: 540 }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Step header ────────────────────────────────────────── */
function StepHeader({ step, title, sub }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
        Step {step} of 4
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 6 }}>{title}</h2>
      <p style={{ fontSize: 14.5, color: '#64748B', lineHeight: 1.65 }}>{sub}</p>
    </div>
  );
}

/* ─── Error banner ───────────────────────────────────────── */
function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, marginBottom: 20 }}>
      <Activity size={14} color="#DC2626" />
      <span style={{ fontSize: 13.5, color: '#DC2626', fontWeight: 500 }}>{msg}</span>
    </div>
  );
}

/* ─── Primary button ─────────────────────────────────────── */
function PrimaryBtn({ onClick, disabled, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '14px', borderRadius: 10,
        background: disabled || loading ? '#E2E8F0' : '#4F46E5',
        color: disabled || loading ? '#94A3B8' : 'white',
        border: 'none', fontSize: 15, fontWeight: 700, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background 0.2s, transform 0.15s, box-shadow 0.15s',
        boxShadow: disabled || loading ? 'none' : '0 4px 16px rgba(79,70,229,0.35)',
      }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.background = '#4338CA'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = (disabled || loading) ? '#E2E8F0' : '#4F46E5'; e.currentTarget.style.transform = 'none'; }}
    >
      {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</> : children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Onboarding Component
═══════════════════════════════════════════════════════════ */
export default function Onboarding() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [step,           setStep]          = useState(1);
  const [riderId,        setRiderId]       = useState('');
  const [profile,        setProfile]       = useState(null);
  const [zones,          setZones]         = useState([]);
  const [selectedZ,      setSelectedZ]     = useState('');
  const [consent,        setConsent]       = useState(false);
  const [loading,        setLoading]       = useState(false);
  const [activating,     setActivating]    = useState(false);
  const [paymentLoading, setPaymentLoading]= useState(false);
  const [error,          setError]         = useState('');
  const [onboardedRider, setOnboardedRider]= useState(null);

  /* ── Handlers ─────────────────────────────────────── */
  const handleFetch = async () => {
    if (!riderId.trim()) return setError('Please enter your Rider ID.');
    setLoading(true); setError('');
    try {
      const res = await fetchProfile(riderId.trim());
      setProfile(res.data);
      const z = await fetchZones();
      const zData = z.data ?? [];
      setZones(zData);
      if (zData.length) setSelectedZ(zData[0].zone_id);
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not find that Rider ID. Please check and try again.');
    } finally { setLoading(false); }
  };

  const handleActivate = async () => {
    if (!selectedZ) return setError('Please select a zone.');
    if (!consent)   return setError('Please accept the coverage terms.');
    setActivating(true); setError('');
    try {
      const res = await submitOnboarding({ platform_rider_id: riderId, zone_id: selectedZ, consent: true });
      setOnboardedRider(res.data);
      setStep(4);
    } catch (e) {
      setError(e.response?.data?.error || 'Activation failed. Please try again.');
    } finally { setActivating(false); }
  };

  const handlePayment = async () => {
    setPaymentLoading(true); setError('');
    try {
      const orderRes = await createPaymentOrder({});
      const { order_id, amount, currency, key_id, txn_id, prefill } = orderRes.data;
      const options = {
        key: key_id, amount, currency,
        name: 'WorkSafe', description: 'Weekly Income Protection Premium',
        order_id,
        prefill: { name: user?.name || '', email: prefill?.email || '' },
        theme: { color: '#4F46E5' },
        handler: async (response) => {
          try {
            await verifyPayment({ txn_id, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
            navigate('/app/dashboard');
          } catch {
            setError('Payment verified but policy activation failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not initiate payment.');
      setPaymentLoading(false);
    }
  };

  const p        = profile;
  const eAvg     = p?.e_avg ?? 0;
  const payoutHr = (eAvg * 0.85).toFixed(0);
  const platC    = p ? (PLATFORM_COLOR[p.platform] ?? { bg: '#F8FAFC', text: '#334155', border: '#E2E8F0' }) : null;

  /* ── Layout ───────────────────────────────────────── */
  return (
    <div className="ob-split" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        .ob-fade { animation: fadeUp 0.45s ease-out both; }
      `}</style>

      <LeftPanel step={step} />

      <RightPanel>

        {/* ════ STEP 1 — Link Account ════ */}
        {step === 1 && (
          <div className="ob-fade">
            <StepHeader step={1} title="Link your rider account" sub="We verify your identity with your delivery platform to calculate your exact income benchmark." />
            <ErrorBanner msg={error} />

            {/* Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Partner Rider ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={riderId}
                  onChange={e => setRiderId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetch()}
                  placeholder="e.g. ZOMATO_DEMO_RIDER_001"
                  style={{
                    width: '100%', padding: '13px 44px 13px 16px', borderRadius: 10,
                    border: '1.5px solid #E2E8F0', background: 'white', fontSize: 15,
                    color: '#0F172A', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#4F46E5'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <p style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 6 }}>Your Rider ID is shown in your delivery app under Profile → ID.</p>
            </div>

            <PrimaryBtn onClick={handleFetch} loading={loading} disabled={!riderId.trim()}>
              Verify & Continue <ChevronRight size={16} />
            </PrimaryBtn>

            {/* Demo IDs */}
            <div style={{ margin: '28px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#94A3B8', whiteSpace: 'nowrap' }}>Or use a demo ID</span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }} className="ob-demo-grid">
              {DEMO_IDS.map(id => (
                <button key={id} onClick={() => setRiderId(id)} style={{
                  padding: '9px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                  background: riderId === id ? '#EEF2FF' : 'white',
                  borderColor: riderId === id ? '#C7D2FE' : '#E2E8F0',
                  fontSize: 11.5, fontWeight: 600, color: riderId === id ? '#4F46E5' : '#475569',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                  fontFamily: 'inherit',
                }}>
                  {id.split('_').slice(0, 2).join('_')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════ STEP 2 — Zone ════ */}
        {step === 2 && p && (
          <div className="ob-fade">
            <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, fontFamily: 'inherit', fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <StepHeader step={2} title="Choose your coverage zone" sub="Your zone determines your disruption thresholds and premium rate. Select where you mainly operate." />
            <ErrorBanner msg={error} />

            {/* Rider profile summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#4F46E5', flexShrink: 0 }}>
                {p.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{p.name}</span>
                  <CheckCircle size={14} color="#10B981" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: platC?.text, background: platC?.bg, border: `1px solid ${platC?.border}`, padding: '2px 8px', borderRadius: 6 }}>{p.platform}</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>{p.city} · ₹{Number(p.e_avg).toFixed(0)}/hr benchmark · {p.rating} <Star size={10} color="#F59E0B" fill="#F59E0B" /></div>
              </div>
            </div>

            {/* Map */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid #E2E8F0', marginBottom: 16, background: 'white' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color="#4F46E5" />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>Select your primary zone</span>
              </div>
              <ZoneMap zones={zones} selectedZone={selectedZ} onZoneSelect={setSelectedZ} height={260} />
            </div>

            {/* Zone grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }} className="ob-zone-grid">
              {zones.map(z => {
                const active = selectedZ === z.zone_id;
                return (
                  <button key={z.zone_id} onClick={() => setSelectedZ(z.zone_id)} style={{
                    padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    border: `2px solid ${active ? '#4F46E5' : '#E2E8F0'}`,
                    background: active ? '#EEF2FF' : 'white',
                    fontSize: 13, fontWeight: 600, color: active ? '#4F46E5' : '#475569',
                    transition: 'all 0.15s',
                  }}>
                    {z.zone_id.replace('Zone_', '').replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>

            <PrimaryBtn onClick={() => setStep(3)} disabled={!selectedZ}>
              Continue to Review <ChevronRight size={16} />
            </PrimaryBtn>
          </div>
        )}

        {/* ════ STEP 3 — Review ════ */}
        {step === 3 && p && (
          <div className="ob-fade">
            <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, fontFamily: 'inherit', fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <StepHeader step={3} title="Review your policy" sub="Confirm everything looks right before activating your income protection." />
            <ErrorBanner msg={error} />

            {/* Policy summary card */}
            <div style={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ background: 'linear-gradient(90deg, #4F46E5, #6366F1)', padding: '20px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>WorkSafe Income Policy</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{selectedZ.replace('Zone_', '').replace(/_/g, ' ')} Coverage</div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {[
                  { label: 'Rider',              value: p.name },
                  { label: 'Platform',           value: p.platform },
                  { label: 'Income Benchmark',   value: `₹${Number(p.e_avg).toFixed(0)} / hr` },
                  { label: 'Payout Rate',        value: `₹${payoutHr} / disrupted hr` },
                  { label: 'Trigger',            value: 'DI > 75 (auto-detected)' },
                  { label: 'Coverage Zone',      value: selectedZ.replace('Zone_', '').replace(/_/g, ' ') },
                  { label: 'Settlement Time',    value: 'Under 2 hours · Automatic' },
                ].map((row, i) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '10px 0', borderBottom: i < 6 ? '1px solid #F1F5F9' : 'none',
                  }}>
                    <span style={{ fontSize: 13.5, color: '#64748B' }}>{row.label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consent */}
            <label style={{
              display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
              padding: '16px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, marginBottom: 24,
            }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: '#4F46E5', flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
                I authorize WorkSafe to monitor regional disruption data and disburse income replacements of{' '}
                <strong>₹{payoutHr}/hr</strong> during verified disruptions. I understand payouts are automated and instant.
              </span>
            </label>

            <PrimaryBtn onClick={handleActivate} loading={activating} disabled={!consent}>
              Confirm & Continue to Payment <ChevronRight size={16} />
            </PrimaryBtn>
          </div>
        )}

        {/* ════ STEP 4 — Payment ════ */}
        {step === 4 && (
          <div className="ob-fade">
            <StepHeader step={4} title="Activate your protection" sub="Pay your first weekly premium to start your income coverage. Secured by Razorpay." />
            <ErrorBanner msg={error} />

            {/* Summary strip */}
            <div style={{ background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Payment Summary</div>
              {[
                { label: 'Coverage Zone',  value: selectedZ?.replace('Zone_', '').replace(/_/g, ' ') },
                { label: 'Rider ID',       value: riderId },
                { label: 'Coverage Type', value: 'Parametric Income Protection' },
              ].map((row, i) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontSize: 13.5, color: '#64748B' }}>{row.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Weekly Premium</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#4F46E5' }}>Calculated at checkout</span>
              </div>
            </div>

            <PrimaryBtn onClick={handlePayment} loading={paymentLoading}>
              <CreditCard size={16} /> Pay & Start Coverage
            </PrimaryBtn>

            <button onClick={() => navigate('/app/dashboard')} style={{
              width: '100%', marginTop: 12, padding: '12px', background: 'none', border: 'none',
              fontSize: 13.5, color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit',
              textDecoration: 'underline dotted',
            }}>
              Skip for now (demo mode)
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 28, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
              {['Razorpay Secured', 'PCI DSS Compliant', '256-bit Encrypted'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle size={11} color="#10B981" />
                  <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </RightPanel>
    </div>
  );
}
