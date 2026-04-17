export const STATIC_PAGES = {
  // ── PRODUCT ──────────────────────────────────────────────────
  'how-it-works': {
    title: 'How WorkSafe Works',
    subtitle: 'Parametric Insurance Explained',
    content: [
      { type: 'h2', text: '1. Connect Your Account' },
      { type: 'p', text: 'Sign up and link your primary delivery zone. WorkSafe supports riders from Zomato, Swiggy, Zepto, Blinkit, and Porter across Bengaluru.' },
      { type: 'h2', text: '2. Continuous Monitoring' },
      { type: 'p', text: 'Our system tracks live weather conditions (heavy rain, flooding) and severe traffic standstills using our Disruption Index (DI) algorithms. We check the status every 15 minutes.' },
      { type: 'h2', text: '3. Automated Payouts' },
      { type: 'p', text: 'If the Disruption Index in your zone crosses the critical threshold (DI > 75), your shift is officially disrupted. We calculate your covered hours and automatically transfer your lost income base directly to your bank account. No forms to fill out, no claims to file.' }
    ]
  },
  'coverage-zones': {
    title: 'Coverage Zones',
    subtitle: 'Where WorkSafe is active',
    content: [
      { type: 'p', text: 'WorkSafe is currently operating exclusively in Bengaluru as part of our initial rollout.' },
      { type: 'h2', text: 'Active Grid Zones' },
      { type: 'ul', items: [
        'Koramangala (Zone_Koramangala)',
        'Indiranagar (Zone_Indiranagar)',
        'HSR Layout (Zone_HSR_Layout)',
        'Whitefield (Zone_Whitefield)',
        'Electronic City (Zone_Electronic_City)',
        'BTM Layout (Zone_BTM_Layout)',
        'Marathahalli (Zone_Marathahalli)',
        'Jayanagar (Zone_Jayanagar)',
        'Bellandur (Zone_Bellandur)'
      ]},
      { type: 'p', text: 'More zones and tier-1 Indian cities are coming soon in Q4 2026.' }
    ]
  },
  'loyalty-program': {
    title: 'WorkSafe Loyalty Program',
    subtitle: 'Rewarding consistent protection',
    content: [
      { type: 'p', text: 'Gig work is demanding, and consistency deserves to be rewarded. Our loyalty program automatically applies tier-based discounts to your weekly premiums based on how long you maintain active coverage.' },
      { type: 'h2', text: 'Tiers & Benefits' },
      { type: 'ul', items: [
        'Bronze (1-3 weeks): Standard Base Premium',
        'Silver (4-11 weeks): 5% Premium Discount applied immediately',
        'Gold (12+ weeks): 15% Premium Discount + Priority Payout Pipeline'
      ]},
      { type: 'p', text: 'Your streak pauses if you pause coverage, but it will not reset to zero unless you leave the platform entirely.' }
    ]
  },
  'pricing': {
    title: 'Pricing & Premiums',
    subtitle: 'Fair, transparent, and algorithmic',
    content: [
      { type: 'p', text: 'Your weekly premium is calculated dynamically using a base rate multiplied by your Zone\'s Risk Factor. There are no hidden fees or surge pricing on premiums.' },
      { type: 'h2', text: 'How it is calculated' },
      { type: 'p', text: 'Premium = (Base Rate for 4 hours of coverage) × (Risk Multiplier)' },
      { type: 'p', text: 'Currently, base premiums start at ₹149/week for standard zones. High-risk zones (frequent flooding or severe traffic snarls) have a multiplier ranging from 1.1x to 1.5x.' }
    ]
  },
  'faq': {
    title: 'Frequently Asked Questions',
    subtitle: 'Got questions? We have answers.',
    content: [
      { type: 'h2', text: 'What happens if I work in multiple zones?' },
      { type: 'p', text: 'Currently, your policy is tied to your primary registered zone. If a disruption happens in a neighboring zone but not your registered one, the payout will not trigger. Multi-zone coverage is on our roadmap.' },
      { type: 'h2', text: 'Do I need to prove I was working?' },
      { type: 'p', text: 'Yes, but it is automated. Our systems sync with standard gig platform APIs. As long as you are logged into your delivery platform when the disruption triggers, you are covered.' },
      { type: 'h2', text: 'How fast is the payout?' },
      { type: 'p', text: 'Settlements process immediately upon the DI threshold being breached. Most users see funds in their bank account within 2 hours.' }
    ]
  },

  // ── COMPANY ──────────────────────────────────────────────────
  'about-worksafe': {
    title: 'About WorkSafe',
    subtitle: 'Protecting the modern workforce',
    content: [
      { type: 'p', text: 'WorkSafe was founded with a singular mission: provide financial stability to India\'s 7+ million gig workers.' },
      { type: 'p', text: 'Delivery partners are the backbone of our modern local economy, yet they bear the brunt of climate risks, traffic gridlocks, and uncompensated downtime. WorkSafe brings enterprise-grade parametric insurance logic to the individual worker level.' }
    ]
  },
  'devtrails-2026': {
    title: 'Born at DEVTrails 2026',
    subtitle: 'The hackathon where it started',
    content: [
      { type: 'p', text: 'WorkSafe is the brainchild of Team UnderDogs, developed over an intense period during DEVTrails 2026.' },
      { type: 'p', text: 'Faced with the challenge of solving a real-world problem using cutting-edge tech, the team chose to address the systemic lack of financial safety nets for gig workers in India, specifically leveraging the power of Guidewire\'s ecosystem.' }
    ]
  },
  'built-with-guidewire': {
    title: 'Powered by Guidewire',
    subtitle: 'Enterprise-grade insurance infrastructure',
    content: [
      { type: 'p', text: 'WorkSafe is proudly built on the principles and technological models inspired by Guidewire.' },
      { type: 'p', text: 'By utilizing advanced claim settlement patterns, dynamic policy lifecycle management, and scalable cloud integrations, we ensure that millions of micro-policies can be processed and administered without friction.' }
    ]
  },
  'team-underdogs': {
    title: 'Team UnderDogs',
    subtitle: 'The builders',
    content: [
      { type: 'p', text: 'We are a group of engineers, designers, and problem solvers who believe that technology should serve everyone — especially those working the hardest on the frontlines of the gig economy.' },
      { type: 'p', text: 'Thank you for supporting our project at DEVTrails 2026.' }
    ]
  },
  'careers': {
    title: 'Careers at WorkSafe',
    subtitle: 'Join the mission',
    content: [
      { type: 'p', text: 'We are always looking for passionate engineers, actuaries, and ops specialists to help us scale WorkSafe across India.' },
      { type: 'p', text: 'Currently, there are no open positions as we are finalizing our post-DEVTrails 2026 roadmap. Check back soon!' }
    ]
  },

  // ── LEGAL ────────────────────────────────────────────────────
  'privacy-policy': {
    title: 'Privacy Policy',
    subtitle: 'How we handle your data',
    content: [
      { type: 'p', text: 'Last Updated: April 2026' },
      { type: 'h2', text: 'Data Collection' },
      { type: 'p', text: 'WorkSafe collects basic profile information, verified gig-worker IDs, and bank account details purely for the purpose of policy generation and payout execution.' },
      { type: 'h2', text: 'Location Data' },
      { type: 'p', text: 'We only require your primary static zone for underwriting. We do NOT track your live GPS coordinates. The disruption index is calculated globally for the zone itself.' }
    ]
  },
  'terms-of-use': {
    title: 'Terms of Use',
    subtitle: 'Rules of the road',
    content: [
      { type: 'p', text: 'By accessing WorkSafe, you agree to these Terms of Use.' },
      { type: 'h2', text: 'Policy Validity' },
      { type: 'p', text: 'A policy is only valid if the premium has been successfully deducted for the active week (Monday to Sunday). Payouts are strictly bound to the algorithmic calculation of the Disruption Index (DI). Human intervention or manual disputes regarding AI-assessed disruptions are generally not supported under the standard parametric terms.' }
    ]
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    subtitle: 'Managing your browser data',
    content: [
      { type: 'p', text: 'We use minimal cookies necessary for session management and authentication. We do not use third-party tracking cookies or sell your browsing footprint to advertisers.' }
    ]
  },
  'grievance-redressal': {
    title: 'Grievance Redressal',
    subtitle: 'We are here to listen',
    content: [
      { type: 'p', text: 'If you have an issue regarding a delayed payout (due to banking pipeline issues) or a subscription error, please contact our nodal grievance officer.' },
      { type: 'p', text: 'Email: grievances@worksafe.in' },
      { type: 'p', text: 'Response Time: 48 working hours.' }
    ]
  }
};
