-- ============================================================
-- WorkSafe Extended Seed — Matches init.sql schema exactly
-- 10 Zones, 10 Riders, 10 Policies, 2 Disruption Events + Payouts
-- ============================================================

-- ── 7 additional zones (3 already exist from seed_zones.sql) ──
INSERT INTO zones (zone_id, city, geom, risk_multiplier) VALUES
  ('Zone_Marathahalli',    'Bengaluru',
   ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6956,12.9566],[77.7120,12.9566],[77.7120,12.9430],[77.6956,12.9430],[77.6956,12.9566]]]}'), 4326), 1.30),
  ('Zone_Electronic_City', 'Bengaluru',
   ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6567,12.8452],[77.6720,12.8452],[77.6720,12.8308],[77.6567,12.8308],[77.6567,12.8452]]]}'), 4326), 1.25),
  ('Zone_HSR_Layout',      'Bengaluru',
   ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6317,12.9116],[77.6478,12.9116],[77.6478,12.8972],[77.6317,12.8972],[77.6317,12.9116]]]}'), 4326), 1.10),
  ('Zone_BTM_Layout',      'Bengaluru',
   ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6076,12.9170],[77.6237,12.9170],[77.6237,12.9041],[77.6076,12.9041],[77.6076,12.9170]]]}'), 4326), 1.05),
  ('Zone_Jayanagar',       'Bengaluru',
   ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.5818,12.9305],[77.5978,12.9305],[77.5978,12.9172],[77.5818,12.9172],[77.5818,12.9305]]]}'), 4326), 1.00),
  ('Zone_Yelahanka',       'Bengaluru',
   ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.5838,13.1005],[77.6010,13.1005],[77.6010,13.0855],[77.5838,13.0855],[77.5838,13.1005]]]}'), 4326), 1.15),
  ('Zone_Bannerghatta',    'Bengaluru',
   ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.5968,12.8735],[77.6120,12.8735],[77.6120,12.8585],[77.5968,12.8585],[77.5968,12.8735]]]}'), 4326), 1.20)
ON CONFLICT (zone_id) DO NOTHING;

-- ── 10 Riders ─────────────────────────────────────────────────
-- Using fixed UUIDs so policies can reference them reliably
INSERT INTO riders (rider_id, platform_rider_id, e_avg, shift_pattern, manual_baseline) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'ZOMATO_DEMO_RIDER_001',   78.50,  '{"start":"09:00","end":"21:00","platform":"Zomato","name":"Arjun Mehta"}',    false),
  ('a1000001-0000-0000-0000-000000000002', 'SWIGGY_DEMO_RIDER_001',   92.00,  '{"start":"08:00","end":"22:00","platform":"Swiggy","name":"Priya Sharma"}',   false),
  ('a1000001-0000-0000-0000-000000000003', 'ZOMATO_DEMO_RIDER_002',   110.75, '{"start":"10:00","end":"22:00","platform":"Zomato","name":"Ravi Kumar"}',     false),
  ('a1000001-0000-0000-0000-000000000004', 'BLINKIT_RIDER_001',       95.00,  '{"start":"09:00","end":"21:00","platform":"Blinkit","name":"Kavya Reddy"}',   false),
  ('a1000001-0000-0000-0000-000000000005', 'SWIGGY_DEMO_RIDER_002',   88.25,  '{"start":"07:00","end":"19:00","platform":"Swiggy","name":"Suresh Babu"}',    false),
  ('a1000001-0000-0000-0000-000000000006', 'PORTER_RIDER_001',        105.00, '{"start":"09:00","end":"21:00","platform":"Porter","name":"Meena Nair"}',     false),
  ('a1000001-0000-0000-0000-000000000007', 'DUNZO_RIDER_001',         82.50,  '{"start":"11:00","end":"23:00","platform":"Dunzo","name":"Anand Krishnan"}',  false),
  ('a1000001-0000-0000-0000-000000000008', 'ZOMATO_DEMO_RIDER_003',   97.00,  '{"start":"09:00","end":"21:00","platform":"Zomato","name":"Poonam Singh"}',   false),
  ('a1000001-0000-0000-0000-000000000009', 'SWIGGY_DEMO_RIDER_003',   75.50,  '{"start":"08:00","end":"20:00","platform":"Swiggy","name":"Vikram Rao"}',     false),
  ('a1000001-0000-0000-0000-000000000010', 'BLINKIT_RIDER_002',       88.00,  '{"start":"10:00","end":"22:00","platform":"Blinkit","name":"Deepa Thomas"}',  false)
ON CONFLICT (platform_rider_id) DO NOTHING;

-- ── 10 Policies ───────────────────────────────────────────────
INSERT INTO policies (policy_id, rider_id, zone_id, status, subscription_streak, c_factor, last_premium_amount) VALUES
  ('b2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'Zone_Koramangala',     'ACTIVE', 3,  1.00, 142.80),
  ('b2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000002', 'Zone_Indiranagar',     'ACTIVE', 2,  1.00, 167.52),
  ('b2000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', 'Zone_Whitefield',      'ACTIVE', 8,  0.92, 183.44),
  ('b2000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000004', 'Zone_Marathahalli',    'ACTIVE', 1,  1.08, 184.44),
  ('b2000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000005', 'Zone_Electronic_City', 'ACTIVE', 5,  1.00, 159.84),
  ('b2000001-0000-0000-0000-000000000006', 'a1000001-0000-0000-0000-000000000006', 'Zone_HSR_Layout',      'ACTIVE', 14, 0.88, 166.04),
  ('b2000001-0000-0000-0000-000000000007', 'a1000001-0000-0000-0000-000000000007', 'Zone_BTM_Layout',      'ACTIVE', 2,  1.15, 163.76),
  ('b2000001-0000-0000-0000-000000000008', 'a1000001-0000-0000-0000-000000000008', 'Zone_Jayanagar',       'ACTIVE', 6,  1.00, 148.99),
  ('b2000001-0000-0000-0000-000000000009', 'a1000001-0000-0000-0000-000000000009', 'Zone_Yelahanka',       'ACTIVE', 4,  0.95, 120.80),
  ('b2000001-0000-0000-0000-000000000010', 'a1000001-0000-0000-0000-000000000010', 'Zone_Bannerghatta',    'ACTIVE', 1,  1.12, 180.69)
ON CONFLICT (policy_id) DO NOTHING;

-- ── Active Sessions ────────────────────────────────────────────
INSERT INTO active_sessions (session_id, rider_id, current_latitude, current_longitude, last_seen_at) VALUES
  ('c3000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 12.9285, 77.6267, NOW() - INTERVAL '2 hours'),
  ('c3000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000002', 12.9712, 77.6465, NOW() - INTERVAL '1 hour'),
  ('c3000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', 12.9750, 77.7465, NOW() - INTERVAL '3 hours'),
  ('c3000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000004', 12.9498, 77.7038, NOW() - INTERVAL '30 minutes'),
  ('c3000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000005', 12.8380, 77.6643, NOW() - INTERVAL '4 hours'),
  ('c3000001-0000-0000-0000-000000000006', 'a1000001-0000-0000-0000-000000000006', 12.9044, 77.6397, NOW() - INTERVAL '1 hour'),
  ('c3000001-0000-0000-0000-000000000007', 'a1000001-0000-0000-0000-000000000007', 12.9105, 77.6156, NOW() - INTERVAL '2 hours'),
  ('c3000001-0000-0000-0000-000000000008', 'a1000001-0000-0000-0000-000000000008', 12.9238, 77.5898, NOW() - INTERVAL '45 minutes'),
  ('c3000001-0000-0000-0000-000000000009', 'a1000001-0000-0000-0000-000000000009', 13.0930, 77.5924, NOW() - INTERVAL '3 hours'),
  ('c3000001-0000-0000-0000-000000000010', 'a1000001-0000-0000-0000-000000000010', 12.8660, 77.6044, NOW() - INTERVAL '1 hour')
ON CONFLICT (session_id) DO NOTHING;

-- ── 2 Triggered Disruption Events (DI > 75) ──────────────────
INSERT INTO disruption_events (event_id, zone_id, trigger_type, di_score, triggered_at, status) VALUES
  ('d4000001-0000-0000-0000-000000000001', 'Zone_Marathahalli',    'API', 87.5, NOW() - INTERVAL '2 days',  'SETTLED'),
  ('d4000001-0000-0000-0000-000000000002', 'Zone_Electronic_City', 'API', 91.2, NOW() - INTERVAL '1 day',   'SETTLED')
ON CONFLICT (event_id) DO NOTHING;

-- ── Claims with Razorpay payout IDs ───────────────────────────
INSERT INTO claims (claim_id, rider_id, event_id, payout_amount, c_ratio_applied, h_lost, razorpay_txn_id, status, settled_at) VALUES
  -- Kavya (Blinkit): Marathahalli flood, 3.5hr lost — ₹281.63
  ('e5000001-0000-0000-0000-000000000001',
   'a1000001-0000-0000-0000-000000000004',
   'd4000001-0000-0000-0000-000000000001',
   281.63, 0.85, 3.5, 'rzp_pout_Kq8mN2xPvRy3Tz', 'SETTLED',
   NOW() - INTERVAL '2 days' + INTERVAL '18 minutes'),
  -- Suresh (Swiggy): Elec City accident, 4hr lost — ₹300.05
  ('e5000001-0000-0000-0000-000000000002',
   'a1000001-0000-0000-0000-000000000005',
   'd4000001-0000-0000-0000-000000000002',
   300.05, 0.85, 4.0, 'rzp_pout_Lp9nO3yQwSz4Ua', 'SETTLED',
   NOW() - INTERVAL '1 day' + INTERVAL '11 minutes')
ON CONFLICT (claim_id) DO NOTHING;

-- ── Zone DI Log (historical — powers the dashboard charts) ───
INSERT INTO zone_disruption_log (zone_id, di_score, i_weather, i_traffic, u_ratio, computed_at) VALUES
  ('Zone_Marathahalli',    87.5, 75.0, 68.0, 0.80, NOW() - INTERVAL '2 days'),
  ('Zone_Marathahalli',    62.3, 55.0, 48.0, 0.40, NOW() - INTERVAL '3 days'),
  ('Zone_Marathahalli',    14.2,  0.0, 18.0, 0.00, NOW() - INTERVAL '1 hour'),
  ('Zone_Electronic_City', 91.2, 45.0, 92.0, 0.90, NOW() - INTERVAL '1 day'),
  ('Zone_Electronic_City', 74.8, 40.0, 80.0, 0.70, NOW() - INTERVAL '2 days'),
  ('Zone_Electronic_City',  8.4,  0.0, 12.0, 0.00, NOW() - INTERVAL '1 hour'),
  ('Zone_Indiranagar',     14.4,  0.0, 41.0, 0.33, NOW() - INTERVAL '30 minutes'),
  ('Zone_Whitefield',       6.3,  0.0, 18.0, 0.00, NOW() - INTERVAL '30 minutes'),
  ('Zone_Koramangala',      0.0,  0.0,  0.0, 0.00, NOW() - INTERVAL '30 minutes'),
  ('Zone_HSR_Layout',       9.1,  0.0, 26.0, 0.00, NOW() - INTERVAL '1 hour'),
  ('Zone_BTM_Layout',       5.4,  0.0, 15.0, 0.00, NOW() - INTERVAL '1 hour'),
  ('Zone_Yelahanka',        3.2,  0.0,  9.0, 0.00, NOW() - INTERVAL '2 hours'),
  ('Zone_Bannerghatta',    11.7,  0.0, 33.0, 0.00, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- ── Crowdsource Reports for the two triggered events ──────────
INSERT INTO crowdsource_reports (rider_id, zone_id, latitude, longitude, clip_verdict, clip_confidence, moire_detected, verdict, reported_at) VALUES
  ('a1000001-0000-0000-0000-000000000004', 'Zone_Marathahalli',    12.9498, 77.7038, 'disruption', 0.910, false, 'APPROVED', NOW() - INTERVAL '2 days'),
  ('a1000001-0000-0000-0000-000000000007', 'Zone_Marathahalli',    12.9490, 77.7042, 'disruption', 0.880, false, 'APPROVED', NOW() - INTERVAL '2 days'),
  ('a1000001-0000-0000-0000-000000000008', 'Zone_Marathahalli',    12.9502, 77.7035, 'disruption', 0.860, false, 'APPROVED', NOW() - INTERVAL '2 days'),
  ('a1000001-0000-0000-0000-000000000005', 'Zone_Electronic_City', 12.8380, 77.6643, 'disruption', 0.930, false, 'APPROVED', NOW() - INTERVAL '1 day'),
  ('a1000001-0000-0000-0000-000000000010', 'Zone_Electronic_City', 12.8375, 77.6648, 'disruption', 0.870, false, 'APPROVED', NOW() - INTERVAL '1 day'),
  ('a1000001-0000-0000-0000-000000000009', 'Zone_Electronic_City', 12.8385, 77.6640, 'disruption', 0.890, false, 'APPROVED', NOW() - INTERVAL '1 day'),
  ('a1000001-0000-0000-0000-000000000006', 'Zone_Electronic_City', 12.8378, 77.6645, 'disruption', 0.850, false, 'APPROVED', NOW() - INTERVAL '1 day');

-- ── Fraud Log (shows the system rejecting bad reports) ────────
INSERT INTO fraud_log (rider_id, gate_type, rejection_reason, metadata, logged_at) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'MOIRE_DETECTED',    'Screen capture detected — moire confidence 0.78', '{"moire_confidence":0.78,"zone":"Zone_Koramangala"}',    NOW() - INTERVAL '3 days'),
  ('a1000001-0000-0000-0000-000000000002', 'VELOCITY_VIOLATION','GPS velocity 97 km/h exceeds 80 km/h limit',      '{"velocity_kmph":97,"limit":80}',                       NOW() - INTERVAL '4 days'),
  ('a1000001-0000-0000-0000-000000000003', 'LOW_CLIP_SCORE',    'CLIP confidence 0.41 below 0.65 threshold',       '{"clip_confidence":0.41,"threshold":0.65}',              NOW() - INTERVAL '5 days'),
  ('a1000001-0000-0000-0000-000000000007', 'DUPLICATE_REPORT',  'Duplicate report within 300-second window',        '{"seconds_since_last":142,"zone":"Zone_BTM_Layout"}',    NOW() - INTERVAL '2 days');

SELECT 'Extended seed complete: 10 zones, 10 riders, 2 disruption events, 2 Razorpay payouts.' AS status;
