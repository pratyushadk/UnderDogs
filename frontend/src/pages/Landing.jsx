import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Shield, Zap, MapPin, Users, TrendingUp, CheckCircle,
  ArrowRight, Star, Phone, Mail, Menu, X,
  ChevronRight, Clock, BarChart3, AlertCircle,
  Bike, Activity, CloudRain, IndianRupee
} from 'lucide-react';
import ZoneMap from '../components/ZoneMap.jsx';
import { fetchZones } from '../services/api.js';

/* ─── Intersection observer hook ──────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Animated counter ───────────────────────────────────── */
function Counter({ target, suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    const steps = 40;
    const step = num / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, num);
      setCount(Math.round(cur));
      if (cur >= num) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Zone status dashboard ──────────────────────────────── */
function ZoneDashboard() {
  const ZONES = [
    { name: 'HSR Layout',      di: 28 },
    { name: 'Koramangala',     di: 61 },
    { name: 'Whitefield',      di: 83 },
    { name: 'Indiranagar',     di: 19 },
    { name: 'JP Nagar',        di: 44 },
  ];

  const [diValues, setDiValues] = useState(ZONES.map(z => z.di));
  const [payouts, setPayouts] = useState([
    { name: 'Arjun M.',  zone: 'Whitefield',    amount: '₹840', time: 'Just now' },
    { name: 'Priya S.',  zone: 'Whitefield',    amount: '₹530', time: '1 min ago' },
    { name: 'Ravi K.',   zone: 'Koramangala',   amount: '₹710', time: '4 min ago' },
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      setDiValues(prev => prev.map(v => {
        const delta = (Math.random() - 0.5) * 5;
        return Math.max(5, Math.min(95, Math.round(v + delta)));
      }));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const names = ['Suresh T.', 'Meena R.', 'Kiran P.', 'Deepa M.'];
    const zones = ['Whitefield', 'Koramangala', 'Electronic City'];
    const amounts = ['₹780', '₹490', '₹920', '₹640', '₹560'];
    const t = setInterval(() => {
      setPayouts(prev => [
        { name: names[Math.floor(Math.random()*names.length)], zone: zones[Math.floor(Math.random()*zones.length)], amount: amounts[Math.floor(Math.random()*amounts.length)], time: 'Just now' },
        ...prev.slice(0, 4),
      ]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const getColor  = di => di > 75 ? '#EF4444' : di > 50 ? '#F97316' : di > 25 ? '#F59E0B' : '#10B981';
  const getLabel  = di => di > 75 ? 'Disrupted' : di > 50 ? 'High Risk' : di > 25 ? 'Moderate' : 'Safe';
  const getBg     = di => di > 75 ? '#FEF2F2' : di > 50 ? '#FFF7ED' : di > 25 ? '#FFFBEB' : '#F0FDF4';

  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
      {/* Header */}
      <div style={{ background: '#4F46E5', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="white" strokeWidth={2.5} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>WorkSafe — Zone Monitor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: 'pulse-dot 1.5s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Live</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Zone risk column */}
        <div style={{ padding: '16px', borderRight: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Zone Risk Status</div>
          {ZONES.map((z, i) => (
            <div key={z.name} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{z.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: getColor(diValues[i]), background: getBg(diValues[i]), padding: '2px 7px', borderRadius: 10 }}>
                  {getLabel(diValues[i])}
                </span>
              </div>
              <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${diValues[i]}%`, background: getColor(diValues[i]), borderRadius: 3, transition: 'width 2s ease, background 2s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Payouts column */}
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Recent Payouts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {payouts.map((p, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 8,
                background: i === 0 ? '#F0FDF4' : '#FAFBFD',
                border: `1px solid ${i === 0 ? '#BBF7D0' : '#F1F5F9'}`,
                animation: i === 0 ? 'fadeSlideIn 0.4s ease-out' : 'none',
                transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{p.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{p.amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>{p.zone}</span>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>{p.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: '10px', background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>This Week</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>₹12.4k</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Paid out</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>847</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Riders</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0891B2' }}>15m</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Detection</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Fade-in section wrapper ────────────────────────────── */
function FadeIn({ children, delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView(0.1);
  const transforms = { up: 'translateY(30px)', left: 'translateX(-30px)', right: 'translateX(30px)', none: 'none' };
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translate(0)' : transforms[direction],
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ─── Data ──────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'How It Works', href: '#how' },
  { label: 'Coverage',     href: '#features' },
  { label: 'About',        href: '#about' },
  { label: 'Contact',      href: '#contact' },
];

const STATS = [
  { value: '7', suffix: 'M+', label: 'Gig workers in India',  sub: 'Unprotected today' },
  { value: '0', suffix: '',   label: 'Claim forms required',  sub: 'Zero paperwork ever' },
  { value: '15', suffix: 'm', label: 'Detection cycle',       sub: 'Continuous monitoring' },
  { value: '85', suffix: '%', label: 'Income replacement',    sub: 'Auto-transferred' },
];

const STEPS = [
  { step: '01', icon: Shield,   title: 'Subscribe Weekly',   desc: 'Pay a small weekly premium based on your delivery zone and risk profile. No lock-in. Cancel anytime.', color: '#4F46E5' },
  { step: '02', icon: BarChart3,title: 'We Monitor 24 / 7', desc: 'Our system tracks weather, traffic disruptions, and live zone data every 15 minutes — fully automated.', color: '#0891B2' },
  { step: '03', icon: Zap,      title: 'Get Paid Instantly', desc: 'When disruption crosses the threshold in your zone, your income replacement hits your account — automatically.', color: '#059669' },
];

const FEATURES = [
  { icon: Zap,         title: 'Zero-Touch Payouts',      desc: 'No forms, no calls. Payouts trigger the moment the Disruption Index breaches your zone threshold.' },
  { icon: Shield,      title: 'AI Fraud Protection',     desc: 'CLIP-powered image checks and GPS velocity analysis ensure only real disruptions are compensated.' },
  { icon: MapPin,      title: 'Zone-Specific Coverage',  desc: 'Coverage is tied to your exact Bengaluru delivery zone. Premiums reflect your actual risk profile.' },
  { icon: Users,       title: 'Crowd Verification',      desc: 'Rider-submitted reports build verification consensus — faster confirmed disruptions, faster payouts.' },
  { icon: TrendingUp,  title: 'Loyalty Rewards',         desc: '12+ consecutive weeks unlocks a 15% premium discount. Consistent subscribers get the best rates.' },
  { icon: CheckCircle, title: 'Pure Income Coverage',    desc: 'We cover lost hours — not health, not vehicles. Laser-focused so the premium stays affordable.' },
];

const TESTIMONIALS = [
  { name: 'Arjun Mehta',  platform: 'Zomato', text: 'During the Bengaluru floods I got ₹785 directly in my account. I did not fill a single form.', rating: 5 },
  { name: 'Priya Sharma', platform: 'Swiggy', text: 'The premium is tiny compared to what I earn. It is the safety net I always wanted.', rating: 5 },
  { name: 'Meena Nair',   platform: 'Porter', text: 'Two years, two payouts received. The loyalty discount makes it even cheaper every month.', rating: 5 },
];

const FOOTER_COLS = [
  { title: 'Product', links: ['How It Works', 'Coverage Zones', 'Loyalty Program', 'Pricing', 'FAQ'] },
  { title: 'Company', links: ['About WorkSafe', 'DEVTrails 2026', 'Built with Guidewire', 'Team UnderDogs', 'Careers'] },
  { title: 'Legal',   links: ['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'Grievance Redressal'] },
];

/* ─── Main Component ────────────────────────────────────── */
export default function Landing() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [zones, setZones] = useState([]);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const { user, loading } = useAuth();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch zones for the hero map (public endpoint)
  useEffect(() => {
    fetchZones().then(res => {
      const raw = res?.data;
      setZones(Array.isArray(raw) ? raw : (raw?.zones ?? []));
    }).catch(() => {});
  }, []);

  if (!loading && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app/dashboard'} replace />;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#0F172A', overflowX: 'hidden' }}>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.4); }
          50%      { opacity:0.7; box-shadow:0 0 0 6px rgba(16,185,129,0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
        .hero-glow {
          position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none;
        }
        a:hover { opacity:0.85; }
        @media(max-width:900px){
          .lnd-nav-links { display:none !important; }
          .lnd-nav-cta   { display:none !important; }
          .lnd-hamburger { display:flex !important; }
          .lnd-nav-inner { padding:0 16px !important; }
          .lnd-hero-content { max-width:100% !important; }
          .lnd-stats-grid { grid-template-columns:1fr 1fr !important; }
          .lnd-steps-grid { grid-template-columns:1fr !important; }
          .lnd-feat-grid  { grid-template-columns:1fr !important; gap:32px !important; }
          .lnd-feat-cards { grid-template-columns:1fr 1fr !important; }
          .lnd-test-grid  { grid-template-columns:1fr !important; }
          .lnd-about-grid { grid-template-columns:1fr !important; }
          .lnd-footer-grid { grid-template-columns:1fr 1fr !important; }
          .lnd-monitor-grid { grid-template-columns:1fr !important; }
          .lnd-monitor-right { display:none !important; }
        }
        @media(max-width:560px){
          .lnd-stats-grid { grid-template-columns:1fr 1fr !important; }
          .lnd-feat-cards { grid-template-columns:1fr !important; }
          .lnd-footer-grid { grid-template-columns:1fr !important; }
          .lnd-section-inner { padding-left:16px !important; padding-right:16px !important; }
        }
        @media(max-width:900px){
          .lnd-hero-content { text-align:center !important; }
          .lnd-hero-content h1 { text-align:center !important; }
          .lnd-hero-content p  { text-align:center !important; margin-left:auto !important; margin-right:auto !important; }
          .lnd-hero-badge      { justify-content:center !important; }
          .lnd-hero-btns       { justify-content:center !important; }
          .lnd-hero-trust      { justify-content:center !important; }
          .lnd-footer-col      { text-align:center !important; }
          .lnd-footer-col a    { justify-content:center !important; }
          .lnd-footer-contact  { align-items:center !important; }
          .lnd-footer-social   { justify-content:center !important; }
          .lnd-section-heading { text-align:center !important; }
          .lnd-footer-logo     { justify-content:center !important; }
          .lnd-footer-desc     { margin:0 auto 22px auto !important; }
        }
      `}</style>

      {/* ══ NAVBAR ═══════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div className="lnd-nav-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: '#4F46E5', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: scrolled ? '#0F172A' : 'white', letterSpacing: '-0.3px', transition: 'color 0.3s' }}>
              Work<span style={{ color: '#818CF8' }}>Safe</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="lnd-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: scrolled ? '#475569' : 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color 0.15s' }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA — hidden on mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="lnd-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: scrolled ? '#475569' : 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '8px 12px' }}>Log In</Link>
              <Link to="/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#4F46E5', color: 'white', padding: '9px 18px',
                borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(79,70,229,0.4)', whiteSpace: 'nowrap',
              }}>
                Get Protected <ArrowRight size={14} />
              </Link>
            </div>
            {/* Hamburger — mobile only */}
            <button className="lnd-hamburger" onClick={() => setMobileNav(o => !o)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? '#0F172A' : 'white', padding: 4 }}>
              {mobileNav ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileNav && (
          <div style={{ background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0 16px' }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileNav(false)}
                style={{ display: 'block', padding: '12px 20px', fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>{l.label}</a>
            ))}
            <div style={{ padding: '12px 20px', display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8 }}>
              <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '10px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'white', textDecoration: 'none' }}>Log In</Link>
              <Link to="/signup" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#4F46E5', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'white', textDecoration: 'none' }}>Get Protected</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      <section style={{
        paddingTop: 68, minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 55%, #0F172A 100%)',
        display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(79,70,229,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,0.06) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
        {/* Glows */}
        <div className="hero-glow" style={{ top: '10%', left: '20%', width: 500, height: 500, background: 'rgba(79,70,229,0.18)' }} />
        <div className="hero-glow" style={{ bottom: '5%', right: '10%', width: 360, height: 360, background: 'rgba(99,102,241,0.12)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1, width: '100%', padding: '80px 32px' }} className="lnd-hero-grid lnd-section-inner">
          <div className="lnd-hero-content">
            <div className="lnd-hero-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(99,102,241,0.4)',
              color: '#A5B4FC', padding: '5px 14px', borderRadius: 20,
              fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
              marginBottom: 28, animation: 'fadeSlideIn 0.6s ease-out',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 1.5s infinite' }} />
              Live in Bengaluru · Parametric Insurance
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 4.5vw, 58px)', fontWeight: 900,
              color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 22,
              animation: 'fadeSlideIn 0.7s ease-out 0.15s both',
            }}>
              Your income<br />
              deserves<br />
              <span style={{ color: '#818CF8' }}>protection too.</span>
            </h1>

            <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.75, marginBottom: 36, animation: 'fadeSlideIn 0.7s ease-out 0.25s both' }}>
              WorkSafe monitors disruptions in your delivery zone 24 / 7.
              When your shift gets wiped — <strong style={{ color: '#C7D2FE' }}>we transfer your lost income automatically.</strong> Zero forms. Zero waiting.
            </p>

            <div className="lnd-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'fadeSlideIn 0.7s ease-out 0.35s both' }}>
              <Link to="/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#4F46E5', color: 'white', padding: '13px 26px',
                borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(79,70,229,0.45)',
              }}>
                Get Protected Today <ArrowRight size={16} />
              </Link>
              <a href="#how" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', padding: '13px 26px', borderRadius: 10,
                fontSize: 15, fontWeight: 600, textDecoration: 'none',
              }}>
                See How It Works
              </a>
            </div>

            <div className="lnd-hero-trust" style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 32, flexWrap: 'wrap', animation: 'fadeSlideIn 0.7s ease-out 0.45s both' }}>
              {['Zero paperwork', 'Automatic payouts', 'Cancel anytime'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13 }}>
                  <CheckCircle size={13} color="#6366F1" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero right — real Bengaluru zone map */}
          <div style={{ display: 'flex', justifyContent: 'center' }} className="lnd-hero-right">
            <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Map frame */}
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                position: 'relative',
              }}>
                {/* Map header */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, zIndex: 500,
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, transparent 100%)',
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', animation: 'pulse-dot 1.5s infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Live Coverage Map — Bengaluru</span>
                </div>
                <ZoneMap zones={zones} height={320} />
              </div>

              {/* Quick stats below map */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
              }}>
                {[
                  { label: 'Zones Covered', val: zones.length || '9', icon: MapPin },
                  { label: 'Weekly Premium', val: 'From ₹149', icon: Shield },
                  { label: 'Auto Payout', val: 'DI > 75', icon: Zap },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '12px 14px', textAlign: 'center',
                  }}>
                    <s.icon size={14} color="#818CF8" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderTop: '1px solid #E2E8F0' }}>
        <div className="lnd-stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: '36px 24px', textAlign: 'center', borderRight: i < 3 ? '1px solid #E2E8F0' : 'none' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#4F46E5', letterSpacing: '-2px', lineHeight: 1 }}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 8 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LIVE PLATFORM SECTION ════════════════════════════════ */}
      <section style={{ padding: '96px 32px', background: '#0F172A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(79,70,229,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,0.04) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeIn>
            <div style={{ marginBottom: 64 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6366F1', marginBottom: 12 }}>
                Live Platform
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, color: 'white', letterSpacing: '-0.8px', maxWidth: 560 }}>
                Watch WorkSafe work in real time
              </h2>
              <p style={{ fontSize: 15, color: '#64748B', marginTop: 12, maxWidth: 480, lineHeight: 1.7 }}>
                Every 15 minutes our engine scans 9 live data sources across all Bengaluru delivery zones and triggers automated payouts.
              </p>
            </div>
          </FadeIn>

          <div className="lnd-monitor-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32, alignItems: 'start' }}>
            <FadeIn direction="left">
              <ZoneDashboard />
            </FadeIn>
            <FadeIn direction="right" delay={150}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="lnd-monitor-right">
                {[
                  { icon: CloudRain, title: 'Live Weather Monitoring',  desc: 'We track rainfall, wind and extreme weather across your delivery zone every 15 minutes.', color: '#38BDF8' },
                  { icon: Activity,  title: 'Traffic & Road Conditions', desc: 'Real-time road congestion data ensures disruptions affecting your routes are detected instantly.', color: '#A78BFA' },
                  { icon: Users,     title: 'Rider Crowd Reports',       desc: 'When other riders flag an issue, it strengthens the disruption signal and speeds up your payout.', color: '#34D399' },
                  { icon: IndianRupee, title: 'Instant Bank Transfer',   desc: 'Once a disruption is confirmed, your income replacement is sent directly to your account — automatically.', color: '#FBBF24' },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, borderLeft: `3px solid ${item.color}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={15} color={item.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}

                {/* Live alert ticker — plain text, no code */}
                <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Recent Activity</div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ animation: 'marquee 20s linear infinite', display: 'inline-flex', gap: 40, whiteSpace: 'nowrap' }}>
                      {[
                        { text: '₹840 paid to Arjun M. — Whitefield', color: '#10B981' },
                        { text: 'Disruption detected — Koramangala', color: '#F59E0B' },
                        { text: '₹530 paid to Priya S. — Whitefield', color: '#10B981' },
                        { text: 'Zone alert cleared — HSR Layout', color: '#94A3B8' },
                        { text: '₹840 paid to Arjun M. — Whitefield', color: '#10B981' },
                        { text: 'Disruption detected — Koramangala', color: '#F59E0B' },
                      ].map((t, i) => (
                        <span key={i} style={{ fontSize: 12, color: t.color, fontWeight: 500 }}>{t.text}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section id="how" style={{ padding: '100px 0', background: '#fff', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
          <FadeIn>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 52, flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4F46E5', marginBottom: 12 }}>The Process</div>
                <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px', maxWidth: 380, lineHeight: 1.2 }}>
                  Three steps to financial protection
                </h2>
              </div>
              <p style={{ fontSize: 15, color: '#64748B', maxWidth: 340, lineHeight: 1.7 }}>
                From sign-up to payout — completely hands-off for you.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Accordion expand cards */}
        <div style={{ padding: '8px 32px 24px', display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', maxWidth: 1100, margin: '0 auto', justifyContent: 'center' }} className="steps-scroll">
          {STEPS.map((step, i) => {
            const isHovered = hoveredStep === i;
            const isOther   = hoveredStep !== null && !isHovered;
            return (
              <FadeIn key={step.title} delay={i * 140} direction="up">
                <div
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                  style={{
                    flexShrink: 0,
                    width: isHovered ? 380 : isOther ? 240 : 300,
                    scrollSnapAlign: 'start',
                    background: i === 1 ? '#0F172A' : 'white',
                    border: `1px solid ${i === 1 ? (isHovered ? '#4F46E5' : 'transparent') : (isHovered ? '#C7D2FE' : '#E8EDF5')}`,
                    borderRadius: 16,
                    padding: isHovered ? '36px 32px 30px' : '32px 28px 26px',
                    boxShadow: isHovered
                      ? (i === 1 ? '0 32px 80px rgba(79,70,229,0.5)' : '0 24px 60px rgba(0,0,0,0.15)')
                      : (i === 1 ? '0 20px 60px rgba(79,70,229,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'),
                    transform: isHovered ? 'translateY(-8px) scale(1.01)' : isOther ? 'translateY(4px) scale(0.98)' : 'none',
                    transition: 'width 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1), box-shadow 0.55s ease, padding 0.55s ease, border-color 0.3s ease',
                    cursor: 'default', overflow: 'hidden',
                  }}
                >
                  <div style={{ width: isHovered ? 56 : 48, height: isHovered ? 56 : 48, borderRadius: 14, background: i === 1 ? step.color : `${step.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: i === 1 ? '0 0 0 8px rgba(79,70,229,0.12)' : 'none', transition: 'width 0.4s ease, height 0.4s ease' }}>
                    <step.icon size={isHovered ? 26 : 22} color={i === 1 ? 'white' : step.color} strokeWidth={2} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: i === 1 ? 'rgba(255,255,255,0.2)' : '#CBD5E1', marginBottom: 10, textTransform: 'uppercase' }}>
                    Step {step.step}
                  </div>
                  <h3 style={{ fontSize: isHovered ? 22 : 20, fontWeight: 800, color: i === 1 ? 'white' : '#0F172A', letterSpacing: '-0.3px', marginBottom: 12, lineHeight: 1.25, transition: 'font-size 0.4s ease' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: i === 1 ? '#94A3B8' : '#64748B' }}>
                    {step.desc}
                  </p>
                  {i === 1 && (
                    <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: 'pulse-dot 1.5s infinite' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>Monitoring active 24 / 7</span>
                    </div>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === 1 ? 22 : 6, height: 6, borderRadius: 3, background: i === 1 ? '#4F46E5' : '#CBD5E1' }} />
            ))}
          </div>
        </div>
        <style>{`.steps-scroll::-webkit-scrollbar{display:none}`}</style>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '96px 32px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="lnd-feat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'flex-start' }}>
            <FadeIn direction="left">
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4F46E5', marginBottom: 14 }}>Coverage Features</div>
                <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.7px', lineHeight: 1.2 }}>
                  Built around how gig work actually works
                </h2>
                <p style={{ fontSize: 15, color: '#64748B', marginTop: 16, lineHeight: 1.75 }}>
                  Every feature exists to solve a real problem delivery workers face.
                </p>
                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['No claim forms ever', 'AI-verified disruptions', 'Zone-aware premiums', '12-week loyalty discount'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={15} color="#4F46E5" />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 32, background: '#4F46E5', color: 'white', padding: '12px 22px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Start Free <ArrowRight size={15} />
                </Link>
              </div>
            </FadeIn>
            <FadeIn direction="right" delay={100}>
              <div className="lnd-feat-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {FEATURES.map((f, i) => (
                  <div key={f.title} style={{
                    padding: '20px 18px',
                    background: i === 0 ? '#4F46E5' : 'white',
                    border: '1px solid #E2E8F0', borderRadius: 10,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: i === 0 ? 'rgba(255,255,255,0.18)' : '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <f.icon size={15} color={i === 0 ? 'white' : '#4F46E5'} />
                    </div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? 'white' : '#0F172A', marginBottom: 5 }}>{f.title}</h4>
                    <p style={{ fontSize: 12, color: i === 0 ? 'rgba(255,255,255,0.65)' : '#64748B', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════ */}
      <section style={{ padding: '96px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 52, flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4F46E5', marginBottom: 12 }}>Rider Stories</div>
                <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.6px' }}>Real riders. Real payouts.</h2>
              </div>
              <Link to="/signup" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#4F46E5', textDecoration: 'none' }}>
                Join them <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
          <div className="lnd-test-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div style={{ padding: '28px', border: '1px solid #E2E8F0', borderRadius: 12, background: '#FAFBFD', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array(t.rating).fill(0).map((_, i) => <Star key={i} size={13} fill="#FBBF24" color="#FBBF24" />)}
                  </div>
                  <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.75, flex: 1, fontStyle: 'italic' }}>"{t.text}"</p>
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bike size={15} color="#4F46E5" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>{t.platform} Partner</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ABOUT BAND ═══════════════════════════════════════════ */}
      <section id="about" style={{ padding: '80px 32px', background: 'linear-gradient(135deg,#1E1B4B 0%,#0F172A 100%)', borderTop: '3px solid #4F46E5' }}>
        <div className="lnd-about-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <FadeIn direction="left">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6366F1', marginBottom: 14 }}>About WorkSafe</div>
              <h2 style={{ fontSize: 'clamp(24px, 2.5vw, 36px)', fontWeight: 800, color: 'white', letterSpacing: '-0.6px', lineHeight: 1.2, marginBottom: 16 }}>
                Built at DEVTrails 2026 — for India's gig workforce
              </h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.75 }}>
                WorkSafe is built by Team UnderDogs in partnership with Guidewire. Our mission: give India's 7 million gig delivery workers the financial safety net they deserve — automated, fair, and transparent.
              </p>
              <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: '#4F46E5', color: 'white', padding: '13px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }}>
                Start Your Free Week <ArrowRight size={15} />
              </Link>
            </div>
          </FadeIn>
          <FadeIn direction="right" delay={120}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { icon: Clock, label: 'Founded', value: '2026' },
                { icon: Users, label: 'Target', value: '7M riders' },
                { icon: MapPin, label: 'City', value: 'Bengaluru' },
                { icon: AlertCircle, label: 'DI Trigger', value: 'Score > 75' },
              ].map(item => (
                <div key={item.label} style={{ padding: '22px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                  <item.icon size={16} color="#6366F1" />
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginTop: 4 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ CONTACT ══════════════════════════════════════════════ */}
      <FadeIn>
        <section id="contact" style={{ padding: '96px 32px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4F46E5', marginBottom: 14 }}>Get In Touch</div>
            <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.6px', marginBottom: 14 }}>Questions about WorkSafe?</h2>
            <p style={{ fontSize: 15, color: '#64748B', marginBottom: 36, lineHeight: 1.7 }}>We're happy to walk you through how parametric insurance works for your zone and platform.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a href="mailto:team@worksafe.in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4F46E5', color: 'white', padding: '13px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                <Mail size={15} /> team@worksafe.in
              </a>
              <a href="tel:+918000000000" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#334155', padding: '13px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid #CBD5E1' }}>
                <Phone size={15} /> +91 80 0000 0000
              </a>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{ background: '#0F172A', color: '#94A3B8' }}>
        <div className="lnd-footer-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px 48px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
          <div className="lnd-footer-col">
            <div className="lnd-footer-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Work<span style={{ color: '#818CF8' }}>Safe</span></span>
            </div>
            <p className="lnd-footer-desc" style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.75, maxWidth: 260, marginBottom: 22 }}>
              Parametric income insurance for India's gig delivery workforce. Automated, fair, zero-paperwork protection.
            </p>
            <div className="lnd-footer-contact" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ icon: Mail, text: 'team@worksafe.in', href: 'mailto:team@worksafe.in' }, { icon: Phone, text: '+91 80 0000 0000', href: 'tel:+918000000000' }, { icon: MapPin, text: 'Bengaluru, Karnataka, India', href: '#' }].map(i => (
                <a key={i.text} href={i.href} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748B', textDecoration: 'none' }}>
                  <i.icon size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {i.text}
                </a>
              ))}
            </div>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.title} className="lnd-footer-col">
              <h4 style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 18 }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map(link => (
                  <li key={link}><Link to={'/p/' + link.toLowerCase().replace(/ /g, '-')} style={{ fontSize: 13.5, color: '#64748B', textDecoration: 'none' }}>{link}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '26px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Stay updated on disruptions & payouts</div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>Zone alerts and platform updates to your inbox.</div>
            </div>
            <form onSubmit={e => { e.preventDefault(); setSubscribed(true); }} style={{ display: 'flex', gap: 8 }}>
              {subscribed ? (
                <div style={{ padding: '9px 18px', background: 'rgba(5, 150, 105, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 7, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={15} /> Subscribed!
                </div>
              ) : (
                <>
                  <input required type="email" placeholder="Enter your email" style={{ padding: '9px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 13.5, outline: 'none', width: 220, fontFamily: 'inherit' }} />
                  <button type="submit" style={{ padding: '9px 18px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 7, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Subscribe</button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12.5, color: '#475569' }}>© 2026 WorkSafe · Team UnderDogs · DEVTrails · Built with Guidewire</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Use', 'Grievance Redressal'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12.5, color: '#475569', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
