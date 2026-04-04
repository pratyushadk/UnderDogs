/**
 * Mock Partner API — Extended Edition
 * Simulates Zomato, Swiggy, Blinkit, Porter, Dunzo partner APIs
 * Port: 4001
 * All 10 riders registered for full demo
 */

require('dotenv').config({ path: '../.env' });
const express = require('express');
const app = express();
app.use(express.json());

const SECRET = process.env.MOCK_PARTNER_API_SECRET || 'worksafe_internal_2026';
const PORT   = 4001;

// ── Auth middleware ───────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  // Backend sends X-Mock-Secret; accept either variant for compatibility
  const auth = req.headers['x-mock-secret'] || req.headers['x-partner-secret'];
  if (auth !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// ── 10 Rider registry ─────────────────────────────────────────
const RIDERS = {
  'ZOMATO_DEMO_RIDER_001': {
    platform_rider_id: 'ZOMATO_DEMO_RIDER_001',
    rider_uuid: 'a1000001-0000-0000-0000-000000000001',
    name: 'Arjun Mehta',
    platform: 'Zomato',
    city: 'Bengaluru',
    e_avg: 78.50,
    shift_pattern: { start: '09:00', end: '21:00' },
    rating: 4.8,
    total_deliveries: 1247,
    active_weeks: 3,
  },
  'SWIGGY_DEMO_RIDER_001': {
    platform_rider_id: 'SWIGGY_DEMO_RIDER_001',
    rider_uuid: 'a1000001-0000-0000-0000-000000000002',
    name: 'Priya Sharma',
    platform: 'Swiggy',
    city: 'Bengaluru',
    e_avg: 92.00,
    shift_pattern: { start: '08:00', end: '22:00' },
    rating: 4.9,
    total_deliveries: 2103,
    active_weeks: 2,
  },
  'ZOMATO_DEMO_RIDER_002': {
    platform_rider_id: 'ZOMATO_DEMO_RIDER_002',
    rider_uuid: 'a1000001-0000-0000-0000-000000000003',
    name: 'Ravi Kumar',
    platform: 'Zomato',
    city: 'Bengaluru',
    e_avg: 110.75,
    shift_pattern: { start: '10:00', end: '22:00' },
    rating: 4.7,
    total_deliveries: 3891,
    active_weeks: 8,
  },
  'BLINKIT_RIDER_001': {
    platform_rider_id: 'BLINKIT_RIDER_001',
    rider_uuid: 'a1000001-0000-0000-0000-000000000004',
    name: 'Kavya Reddy',
    platform: 'Blinkit',
    city: 'Bengaluru',
    e_avg: 95.00,
    shift_pattern: { start: '09:00', end: '21:00' },
    rating: 4.6,
    total_deliveries: 892,
    active_weeks: 1,
  },
  'SWIGGY_DEMO_RIDER_002': {
    platform_rider_id: 'SWIGGY_DEMO_RIDER_002',
    rider_uuid: 'a1000001-0000-0000-0000-000000000005',
    name: 'Suresh Babu',
    platform: 'Swiggy',
    city: 'Bengaluru',
    e_avg: 88.25,
    shift_pattern: { start: '07:00', end: '19:00' },
    rating: 4.7,
    total_deliveries: 2456,
    active_weeks: 5,
  },
  'PORTER_RIDER_001': {
    platform_rider_id: 'PORTER_RIDER_001',
    rider_uuid: 'a1000001-0000-0000-0000-000000000006',
    name: 'Meena Nair',
    platform: 'Porter',
    city: 'Bengaluru',
    e_avg: 105.00,
    shift_pattern: { start: '09:00', end: '21:00' },
    rating: 4.9,
    total_deliveries: 5234,
    active_weeks: 14,
  },
  'DUNZO_RIDER_001': {
    platform_rider_id: 'DUNZO_RIDER_001',
    rider_uuid: 'a1000001-0000-0000-0000-000000000007',
    name: 'Anand Krishnan',
    platform: 'Dunzo',
    city: 'Bengaluru',
    e_avg: 82.50,
    shift_pattern: { start: '11:00', end: '23:00' },
    rating: 4.5,
    total_deliveries: 1102,
    active_weeks: 2,
  },
  'ZOMATO_DEMO_RIDER_003': {
    platform_rider_id: 'ZOMATO_DEMO_RIDER_003',
    rider_uuid: 'a1000001-0000-0000-0000-000000000008',
    name: 'Poonam Singh',
    platform: 'Zomato',
    city: 'Bengaluru',
    e_avg: 97.00,
    shift_pattern: { start: '09:00', end: '21:00' },
    rating: 4.8,
    total_deliveries: 2780,
    active_weeks: 6,
  },
  'SWIGGY_DEMO_RIDER_003': {
    platform_rider_id: 'SWIGGY_DEMO_RIDER_003',
    rider_uuid: 'a1000001-0000-0000-0000-000000000009',
    name: 'Vikram Rao',
    platform: 'Swiggy',
    city: 'Bengaluru',
    e_avg: 75.50,
    shift_pattern: { start: '08:00', end: '20:00' },
    rating: 4.6,
    total_deliveries: 1834,
    active_weeks: 4,
  },
  'BLINKIT_RIDER_002': {
    platform_rider_id: 'BLINKIT_RIDER_002',
    rider_uuid: 'a1000001-0000-0000-0000-000000000010',
    name: 'Deepa Thomas',
    platform: 'Blinkit',
    city: 'Bengaluru',
    e_avg: 88.00,
    shift_pattern: { start: '10:00', end: '22:00' },
    rating: 4.7,
    total_deliveries: 743,
    active_weeks: 1,
  },
};

// ── Routes ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    service:  'WorkSafe Mock Partner API',
    status:   'running',
    port:     PORT,
    riders:   Object.keys(RIDERS).length,
    platforms: ['Zomato', 'Swiggy', 'Blinkit', 'Porter', 'Dunzo'],
  });
});

app.get('/rider/:platform_rider_id', (req, res) => {
  const rider = RIDERS[req.params.platform_rider_id];
  if (!rider) {
    return res.status(404).json({
      error: 'RIDER_NOT_FOUND',
      fallbackRequired: true,
      message: 'Rider not registered with this platform. Use manual onboarding.',
    });
  }
  res.json({ success: true, data: rider });
});

app.post('/verify-session', (req, res) => {
  const { platform_rider_id } = req.body;
  const rider = RIDERS[platform_rider_id];
  if (!rider) return res.status(404).json({ verified: false });
  res.json({ verified: true, rider_uuid: rider.rider_uuid });
});

app.listen(PORT, () => {
  console.log(`✅ Mock Partner API running on http://localhost:${PORT}`);
  console.log(`   Registered riders: ${Object.keys(RIDERS).join(', ')}`);
});
