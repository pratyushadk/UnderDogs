-- ============================================================
-- WorkSafe Zone Seed Data — Bengaluru City Polygons
-- Stored as WGS 84 GeoJSON polygons (SRID 4326)
-- ============================================================

-- ZONE 1: Koramangala (popular delivery zone)
INSERT INTO zones (zone_id, city, geom, risk_multiplier) VALUES (
    'Zone_Koramangala',
    'Bengaluru',
    ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6184,12.9352],[77.6351,12.9352],[77.6351,12.9218],[77.6184,12.9218],[77.6184,12.9352]]]}'),
    1.15
) ON CONFLICT (zone_id) DO NOTHING;

-- ZONE 2: Indiranagar (high-density zone)
INSERT INTO zones (zone_id, city, geom, risk_multiplier) VALUES (
    'Zone_Indiranagar',
    'Bengaluru',
    ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.6387,12.9784],[77.6543,12.9784],[77.6543,12.9641],[77.6387,12.9641],[77.6387,12.9784]]]}'),
    1.10
) ON CONFLICT (zone_id) DO NOTHING;

-- ZONE 3: Whitefield (tech park, lower disruption history)
INSERT INTO zones (zone_id, city, geom, risk_multiplier) VALUES (
    'Zone_Whitefield',
    'Bengaluru',
    ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[77.7380,12.9820],[77.7550,12.9820],[77.7550,12.9680],[77.7380,12.9680],[77.7380,12.9820]]]}'),
    1.00
) ON CONFLICT (zone_id) DO NOTHING;

-- DEMO RIDER (for hackathon demo flow)
INSERT INTO riders (rider_id, platform_rider_id, e_avg, shift_pattern, manual_baseline) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'ZOMATO_DEMO_RIDER_001',
    120.00,
    '{"start":"09:00","end":"21:00"}',
    false
) ON CONFLICT (rider_id) DO NOTHING;

-- DEMO POLICY (linked to Koramangala)
INSERT INTO policies (rider_id, zone_id, status, subscription_streak, c_factor) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Zone_Koramangala',
    'ACTIVE',
    4,
    1.00
) ON CONFLICT DO NOTHING;

-- DEMO active session (inside Koramangala zone)
INSERT INTO active_sessions (rider_id, current_latitude, current_longitude) VALUES (
    '00000000-0000-0000-0000-000000000001',
    12.9300,
    77.6250
) ON CONFLICT (rider_id) DO UPDATE SET
    current_latitude = EXCLUDED.current_latitude,
    current_longitude = EXCLUDED.current_longitude,
    last_seen_at = NOW();

SELECT 'Seed data inserted: 3 zones + 1 demo rider.' AS status;
