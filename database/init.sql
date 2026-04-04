-- ============================================================
-- WorkSafe Database Initialization Script
-- Run ONCE against worksafe_db after creating the database
-- ============================================================

-- 1. Enable PostGIS extension (REQUIRED before any spatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. ENUM types
-- ============================================================
DO $$ BEGIN
    CREATE TYPE policy_status AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE trigger_type AS ENUM ('API', 'CROWDSOURCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('PENDING_SETTLEMENT', 'SETTLED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM ('SETTLED', 'FAILED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE fraud_gate_type AS ENUM ('VELOCITY_VIOLATION', 'LOW_CLIP_SCORE', 'MOIRE_DETECTED', 'DUPLICATE_REPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. RIDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS riders (
    rider_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_rider_id   VARCHAR(100) UNIQUE NOT NULL,
    e_avg               DECIMAL(10,2) NOT NULL,
    shift_pattern       JSONB NOT NULL DEFAULT '{"start":"09:00","end":"21:00"}',
    manual_baseline     BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. ZONES TABLE (PostGIS enabled)
-- ============================================================
CREATE TABLE IF NOT EXISTS zones (
    zone_id         VARCHAR(50) PRIMARY KEY,
    city            VARCHAR(100) NOT NULL,
    geom            GEOMETRY(Polygon, 4326) NOT NULL,
    risk_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00
);

-- GiST spatial index — REQUIRED for ST_Contains performance
CREATE INDEX IF NOT EXISTS idx_zones_geom ON zones USING GIST(geom);

-- ============================================================
-- 5. POLICIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS policies (
    policy_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id                UUID NOT NULL REFERENCES riders(rider_id),
    zone_id                 VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
    status                  policy_status NOT NULL DEFAULT 'ACTIVE',
    subscription_streak     INTEGER NOT NULL DEFAULT 1,
    c_factor                DECIMAL(4,2) NOT NULL DEFAULT 1.20,
    last_premium_amount     DECIMAL(10,2),
    last_opt_out_week       DATE,
    last_opt_out_risk_level VARCHAR(20),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_rider ON policies(rider_id);
CREATE INDEX IF NOT EXISTS idx_policies_zone   ON policies(zone_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

-- ============================================================
-- 6. DISRUPTION EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS disruption_events (
    event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id         VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
    trigger_type    trigger_type NOT NULL,
    di_score        DECIMAL(5,2) NOT NULL,
    triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          event_status NOT NULL DEFAULT 'PENDING_SETTLEMENT'
);

CREATE INDEX IF NOT EXISTS idx_events_zone ON disruption_events(zone_id);

-- ============================================================
-- 7. CLAIMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS claims (
    claim_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id        UUID NOT NULL REFERENCES riders(rider_id),
    event_id        UUID NOT NULL REFERENCES disruption_events(event_id),
    payout_amount   DECIMAL(10,2) NOT NULL,
    c_ratio_applied DECIMAL(3,2) NOT NULL DEFAULT 0.85,
    h_lost          DECIMAL(4,2) NOT NULL,
    razorpay_txn_id VARCHAR(100),
    status          claim_status NOT NULL DEFAULT 'PENDING',
    settled_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claims_rider ON claims(rider_id);
CREATE INDEX IF NOT EXISTS idx_claims_event ON claims(event_id);

-- ============================================================
-- 8. ZONE DISRUPTION LOG TABLE (for R_geo calculation)
-- ============================================================
CREATE TABLE IF NOT EXISTS zone_disruption_log (
    log_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id         VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
    di_score        DECIMAL(5,2) NOT NULL,
    i_weather       DECIMAL(5,2),
    i_traffic       DECIMAL(5,2),
    u_ratio         DECIMAL(4,3),
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_di_log_zone ON zone_disruption_log(zone_id, computed_at DESC);

-- ============================================================
-- 9. RIDER PINGS TABLE (for Haversine Speed Trap — Model 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS rider_pings (
    ping_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id    UUID NOT NULL REFERENCES riders(rider_id),
    latitude    DECIMAL(10,7) NOT NULL,
    longitude   DECIMAL(10,7) NOT NULL,
    accuracy_m  DECIMAL(8,2),
    pinged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pings_rider_time ON rider_pings(rider_id, pinged_at DESC);

-- ============================================================
-- 10. FRAUD LOG TABLE (immutable — no DELETE via app layer)
-- ============================================================
CREATE TABLE IF NOT EXISTS fraud_log (
    log_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id            UUID REFERENCES riders(rider_id),
    gate_type           fraud_gate_type NOT NULL,
    rejection_reason    TEXT NOT NULL,
    metadata            JSONB,
    logged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. CROWDSOURCE REPORTS TABLE (for Gate 4 threshold tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS crowdsource_reports (
    report_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id        UUID NOT NULL REFERENCES riders(rider_id),
    zone_id         VARCHAR(50) NOT NULL REFERENCES zones(zone_id),
    latitude        DECIMAL(10,7) NOT NULL,
    longitude       DECIMAL(10,7) NOT NULL,
    clip_verdict    VARCHAR(50),
    clip_confidence DECIMAL(4,3),
    moire_detected  BOOLEAN DEFAULT false,
    verdict         VARCHAR(20) NOT NULL, -- APPROVED | REJECTED
    reported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_zone_time ON crowdsource_reports(zone_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_rider_time ON crowdsource_reports(rider_id, reported_at DESC);

-- ============================================================
-- 12. ACTIVE SESSIONS TABLE (rider live GPS — for ST_Contains)
-- ============================================================
CREATE TABLE IF NOT EXISTS active_sessions (
    session_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id            UUID NOT NULL REFERENCES riders(rider_id),
    current_latitude    DECIMAL(10,7) NOT NULL,
    current_longitude   DECIMAL(10,7) NOT NULL,
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_rider ON active_sessions(rider_id);

SELECT 'WorkSafe DB initialized successfully.' AS status;
