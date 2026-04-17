import { Link } from 'react-router-dom';
import { Shield, Zap, MapPin, Users, TrendingUp, CheckCircle, ArrowRight, Star, Phone } from 'lucide-react';

const STATS = [
  { value: '7M+', label: 'Gig workers in India' },
  { value: '₹0', label: 'Claim forms to fill' },
  { value: '15 min', label: 'Detection cycle' },
  { value: '85%', label: 'Income replacement' },
];

const STEPS = [
  {
    num: '01',
    icon: Shield,
    title: 'Subscribe Weekly',
    desc: 'Pay a small weekly premium based on your zone risk and work hours. Cancel anytime.',
  },
  {
    num: '02',
    icon: Zap,
    title: 'We Monitor 24/7',
    desc: 'Our system watches weather, traffic, and live disruption data every 15 minutes — so you don\'t have to.',
  },
  {
    num: '03',
    icon: TrendingUp,
    title: 'Get Paid Instantly',
    desc: 'When a disruption hits your zone and crosses the threshold, your income replacement lands in your account — automatically.',
  },
];

const FEATURES = [
  { icon: Zap,       title: 'Zero-Touch Payouts',       desc: 'No claim forms. No phone calls. Payouts trigger automatically when the disruption index breaches your threshold.' },
  { icon: Shield,    title: 'AI Fraud Protection',      desc: 'CLIP-powered image verification and GPS velocity checks ensure only legitimate disruptions are compensated.' },
  { icon: MapPin,    title: 'Zone-Specific Coverage',   desc: 'Coverage is tied to your exact delivery zone in Bengaluru. Different zones have different risk profiles and premiums.' },
  { icon: Users,     title: 'Crowdsource Verification', desc: 'Riders can report disruptions directly. Multiple verified reports build consensus for faster payouts.' },
  { icon: TrendingUp,title: 'Loyalty Rewards',          desc: 'Consistent subscribers earn a lower C-factor. Subscribe for 12+ weeks and unlock a 15% premium discount.' },
  { icon: CheckCircle,title: 'Income Coverage Only',    desc: 'We cover lost income — not health, not vehicles. Focused, affordable, and designed for how gig work actually works.' },
];

const TESTIMONIALS = [
  { name: 'Arjun Mehta', platform: 'Zomato', text: 'During the Bengaluru floods, I got ₹785 directly in my account. I didn\'t fill a single form.', rating: 5 },
  { name: 'Priya Sharma', platform: 'Swiggy', text: 'The premium is so small compared to what I earn in a week. It\'s like a safety net I always wanted.', rating: 5 },
  { name: 'Meena Nair', platform: 'Porter', text: 'Two years of subscriptions and two payouts received. The loyalty discount makes it even cheaper now.', rating: 5 },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-900 text-lg">Work<span className="text-indigo-600">Safe</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors">Log In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get Protected</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-indigo-50 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" />
            Parametric Income Insurance for Gig Workers
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Income lost isn't<br />
            <span className="text-indigo-600">income earned.</span>
            <br />We fix that.
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            WorkSafe monitors weather, traffic and disruptions in your delivery zone 24/7.
            When conditions wipe out your shift, we automatically transfer your lost income — zero paperwork, zero waiting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn btn-primary px-8 py-3 text-base flex items-center gap-2">
              Get Protected Today <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how" className="btn btn-ghost px-8 py-3 text-base">
              See How It Works
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="text-3xl font-extrabold text-indigo-600 mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Process</div>
            <h2 className="text-4xl font-extrabold text-slate-900">How WorkSafe works</h2>
            <p className="text-lg text-slate-500 mt-4 max-w-xl mx-auto">Three simple steps between you and financial safety.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.num} className="relative p-8 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-5xl font-black text-slate-200 mb-4 leading-none">{step.num}</div>
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Features</div>
            <h2 className="text-4xl font-extrabold text-slate-900">Built for real gig work</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Trust</div>
            <h2 className="text-4xl font-extrabold text-slate-900">What riders are saying</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-indigo-500 font-medium">{t.platform} Partner</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-24 px-6 bg-indigo-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-3">About</div>
          <h2 className="text-4xl font-extrabold mb-6">Built at DEVTrails 2026</h2>
          <p className="text-indigo-100 text-lg leading-relaxed mb-8">
            WorkSafe is a product of Team UnderDogs, built during DEVTrails 2026 in partnership with Guidewire.
            Our mission: give India's 7 million gig delivery workers the financial safety net they deserve —
            automated, fair, and transparent.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
            Start your free week <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24 px-6 bg-white">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Contact</div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Get in touch</h2>
          <p className="text-slate-500 mb-8">Questions about WorkSafe? We'd love to hear from you.</p>
          <a
            href="mailto:team@worksafe.in"
            className="btn btn-primary px-8 py-3 text-base inline-flex items-center gap-2"
          >
            <Phone className="w-4 h-4" /> team@worksafe.in
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white">WorkSafe</span>
          </div>
          <p className="text-xs">© 2026 Team UnderDogs · DEVTrails · Built with Guidewire</p>
          <div className="flex gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
