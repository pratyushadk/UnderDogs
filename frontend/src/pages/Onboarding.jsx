import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserCheck, MapPin, CheckCircle, ChevronRight, Search, Activity, Zap, Star, CreditCard, Loader } from 'lucide-react';
import { fetchProfile, submitOnboarding, fetchZones, createPaymentOrder, verifyPayment } from '../services/api.js';
import ZoneMap from '../components/ZoneMap.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PLATFORM_COLOR = {
  Zomato: 'text-red-500 bg-red-50 border-red-100',
  Swiggy: 'text-orange-500 bg-orange-50 border-orange-100',
  Blinkit: 'text-amber-500 bg-amber-50 border-amber-100',
  Porter: 'text-blue-500 bg-blue-50 border-blue-100',
  Dunzo: 'text-purple-500 bg-purple-50 border-purple-100',
};

const DEMO_IDS = [
  'ZOMATO_DEMO_RIDER_001', 'SWIGGY_DEMO_RIDER_001', 'ZOMATO_DEMO_RIDER_002',
  'BLINKIT_RIDER_001', 'SWIGGY_DEMO_RIDER_002', 'PORTER_RIDER_001',
];

export default function Onboarding() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [step, setStep] = useState(1);
  const [riderId, setRiderId] = useState('');
  const [profile, setProfile] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZ, setSelectedZ] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  // Payment step state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [onboardedRider, setOnboardedRider] = useState(null);

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

  // Step 3: submit onboarding (creates rider + policy), then go to payment step
  const handleActivate = async () => {
    if (!selectedZ) return setError('Please select a zone.');
    if (!consent) return setError('Please accept the coverage terms.');
    setActivating(true); setError('');
    try {
      const res = await submitOnboarding({
        platform_rider_id: riderId,
        zone_id: selectedZ,
        consent: true,
      });
      setOnboardedRider(res.data);
      setStep(4); // go to payment step
    } catch (e) {
      setError(e.response?.data?.error || 'Activation failed. Please try again.');
    } finally { setActivating(false); }
  };

  // Step 4: launch Razorpay checkout
  const handlePayment = async () => {
    setPaymentLoading(true); setError('');
    try {
      const orderRes = await createPaymentOrder({});
      const { order_id, amount, currency, key_id, txn_id, prefill } = orderRes.data;

      const options = {
        key:      key_id,
        amount,
        currency,
        name:     'WorkSafe',
        description: 'Weekly Income Protection Premium',
        order_id,
        prefill:  { name: user?.name || '', email: prefill?.email || '' },
        theme:    { color: '#4F46E5' },
        handler: async (response) => {
          try {
            await verifyPayment({
              txn_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            navigate('/app/dashboard');
          } catch {
            setError('Payment verified but policy activation failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not initiate payment.');
      setPaymentLoading(false);
    }
  };

  const p = profile;
  const platColor = p ? (PLATFORM_COLOR[p.platform] ?? 'text-slate-500 bg-slate-50') : 'text-slate-500';
  const eAvg = p?.e_avg ?? 0;
  const payoutHr = (eAvg * 0.85).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 lg:py-14 space-y-10 min-h-screen bg-white">
      {/* ── Brand Header ── */}
      <div className="text-center space-y-6">
        <div className="flex justify-center flex-col items-center gap-4">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg transform transition hover:scale-105 cursor-pointer">
            <Shield className="text-white w-8 h-8" strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              WorkSafe<span className="text-brand-500">.</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              Parametric Income Protection. Honest pricing, lightning-fast payouts.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stepper ── */}
      <nav className="flex items-center justify-center space-x-4 max-w-sm mx-auto pt-4">
        {[
          { id: 1, label: 'Identity', icon: UserCheck },
          { id: 2, label: 'Zone', icon: MapPin },
          { id: 3, label: 'Review', icon: Shield },
          { id: 4, label: 'Pay', icon: CreditCard },
        ].map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className={`p-3 rounded-xl transition-all duration-500 font-semibold text-sm flex items-center gap-2 ${step === s.id ? 'bg-brand-500 text-white shadow-md' : step > s.id ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <s.icon className="w-4 h-4" strokeWidth={step === s.id ? 3 : 2} />
              <span className={step !== s.id ? 'hidden sm:block' : 'block'}>{s.label}</span>
            </div>
            {idx < 3 && <div className={`w-6 h-0.5 mx-2 rounded-full transition-colors duration-500 ${step > idx + 1 ? 'bg-emerald-200' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </nav>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-5 py-4 rounded-xl text-sm font-semibold flex items-center gap-3 animate-slide-up shadow-sm">
          <Activity className="w-5 h-5 flex-shrink-0 text-rose-500" />
          {error}
        </div>
      )}

      {/* ════════════════════ STEP 1 ════════════════════ */}
      {step === 1 && (
        <div className="card p-8 animate-slide-up space-y-8 max-w-xl mx-auto mt-10">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">Link Your Account</h2>
            <p className="text-slate-500 font-medium">We sync directly with your primary delivery platform to verify hours and optimize your protection.</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="relative group">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 absolute -top-2.5 left-4 z-10 bg-white px-1 transition-colors group-focus-within:text-brand-500">Partner Rider ID</label>
              <input
                className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 font-mono text-lg rounded-xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-500 transition-all shadow-sm"
                placeholder="Ex. ZOMATO_DEMO_RIDER_001"
                value={riderId}
                onChange={e => setRiderId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFetch()}
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
          </div>

          <button className="btn-premium-primary py-4 text-lg shadow-lg hover:shadow-xl group overflow-hidden" onClick={handleFetch} disabled={loading}>
            <div className="relative z-10 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Fetch Profile'}
              {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </div>
          </button>

          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Or select demo ID</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DEMO_IDS.map(id => (
              <button key={id} className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-brand-600 border border-slate-200 p-3 rounded-lg transition-all truncate shadow-sm hover:shadow"
                onClick={() => setRiderId(id)}>
                {id.split('_').slice(0,2).join('_')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════ STEP 2 ════════════════════ */}
      {step === 2 && p && (
        <div className="animate-slide-up space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity Card */}
            <div className="card shadow-md relative overflow-hidden p-0 h-full">
              <div className={`absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 rounded-full opacity-10 blur-2xl ${platColor.split(' ')[0]}`} />
            
            <div className="p-8 space-y-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                  <span className="text-3xl font-extrabold text-slate-800 uppercase">{p.name?.[0]}</span>
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-slate-900 truncate">{p.name}</h3>
                    <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${platColor}`}>{p.platform}</span>
                    <span className="text-sm font-medium text-slate-500 truncate">{p.city}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Benchmark</div>
                  <div className="text-xl font-bold text-slate-900">₹{Number(p.e_avg).toFixed(0)}<span className="text-base font-semibold text-slate-400">/hr</span></div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Shift</div>
                  <div className="text-xl font-bold text-slate-900">{p.shift_pattern?.start}h</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Rating</div>
                  <div className="text-xl font-bold text-amber-500 flex items-center gap-1.5 mt-1 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded-md w-fit"><Star className="w-4 h-4 fill-current" /> {p.rating}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Selection */}
          <div className="card p-0 overflow-hidden shadow-md">
            <div className="p-6 pb-4 border-b border-slate-100 bg-white">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-500" strokeWidth={2.5} />
                Select Primary Operational Zone
              </h3>
              <p className="text-sm text-slate-500 mt-1">This determines your coverage baseline and hazard thresholds.</p>
            </div>
            
            <div className="h-[300px] w-full relative bg-slate-50">
              <ZoneMap zones={zones} selectedZone={selectedZ} onZoneSelect={setSelectedZ} height={300} />
              
              <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-lg flex items-center">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  {selectedZ ? selectedZ.replace('Zone_', '').replace(/_/g, ' ') : 'Select a zone on the map or list below...'}
                </span>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50 max-h-48 overflow-y-auto">
              {zones.map(z => {
                const isSelected = selectedZ === z.zone_id;
                return (
                  <button key={z.zone_id}
                    className={`flex items-center p-3 rounded-xl border-2 transition-all text-left bg-white ${isSelected ? 'border-brand-500 shadow-md ring-2 ring-brand-100' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'}`}
                    onClick={() => setSelectedZ(z.zone_id)}>
                    <span className={`text-sm font-bold truncate ${isSelected ? 'text-brand-700' : 'text-slate-700'}`}>
                      {z.zone_id.replace('Zone_', '').replace(/_/g, ' ')}
                    </span>
                  </button>
                )
              })}
              </div>
            </div>
          </div>

          <button className="btn-premium-primary text-lg py-4 shadow-lg" onClick={() => setStep(3)} disabled={!selectedZ}>
            Configure Policy Cover
          </button>
        </div>
      )}

      {/* ════════════════════ STEP 3 ════════════════════ */}
      {step === 3 && p && (
        <div className="animate-slide-up space-y-6">
          <div className="card shadow-lg p-8 space-y-8 border-t-8 border-t-brand-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <h2 className="text-2xl font-bold text-slate-900">Policy Summary</h2>
              <Shield className="text-brand-500 w-8 h-8 opacity-80" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Coverage Area', value: selectedZ.replace('Zone_', '').replace(/_/g, ' '), icon: MapPin },
                { label: 'Security Payout', value: `₹${payoutHr}/h`, icon: Zap },
                { label: 'Trigger System', value: 'Auto-Detect', icon: Activity },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                    <item.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                  <div className="text-base font-bold text-slate-800">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100 space-y-4">
              <div className="text-sm font-bold text-brand-700 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Final Agreement
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                I hereby authorize WorkSafe to monitor regional environmental data and my delivery session logs.
                I understand that settlements of <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 mx-1 shadow-sm">₹{payoutHr}/hr</span> are calculated based on
                verified work hours during severe disruptions. All payouts are disbursed instantly.
              </p>
              
              <label className="flex items-start gap-4 cursor-pointer group mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 transition-colors">
                <div className="relative flex items-center pt-0.5">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                  I accept the parametric coverage governance and data privacy protocol.
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="btn-premium-secondary flex-1 py-4 text-base" onClick={() => setStep(2)}>Back</button>
            <button className="btn-premium-primary flex-[2] py-4 text-lg relative overflow-hidden shadow-lg"
              onClick={handleActivate} disabled={activating || !consent}>
              <div className="flex items-center justify-center gap-2">
                {activating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm & Continue'}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════ STEP 4 — PAYMENT ════════════════════ */}
      {step === 4 && (
        <div className="animate-slide-up space-y-6">
          <div className="card shadow-lg p-8 space-y-6 border-t-8 border-t-indigo-500 max-w-xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Activate Protection</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Pay your first weekly premium to start your income protection. Payments are processed securely via Razorpay.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Coverage Zone</span>
                <span className="font-bold text-slate-900">{selectedZ?.replace('Zone_', '').replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Rider ID</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{riderId}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-3 mt-3">
                <span className="text-slate-700 font-bold">Weekly Premium</span>
                <span className="font-extrabold text-indigo-600 text-lg">Calculated on checkout</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
            )}

            <button
              className="btn-premium-primary py-4 text-lg shadow-lg"
              onClick={handlePayment}
              disabled={paymentLoading}
            >
              <div className="flex items-center justify-center gap-2">
                {paymentLoading
                  ? <><Loader className="w-5 h-5 animate-spin" /> Opening checkout…</>
                  : <><CreditCard className="w-5 h-5" /> Pay & Activate Protection</>
                }
              </div>
            </button>

            <p className="text-xs text-center text-slate-400">
              Secured by Razorpay · ₹100 crore trust mark · PCI DSS compliant
            </p>

            <button
              className="w-full text-sm text-slate-400 hover:text-slate-600 font-medium underline"
              onClick={() => navigate('/app/dashboard')}
            >
              Skip for now (demo mode)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
