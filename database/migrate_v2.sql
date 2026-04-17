-- ============================================================
-- WorkSafe Database Migration v2
-- Run ONCE against the existing database (after init.sql has run)
-- Safe: all statements use IF NOT EXISTS / IF EXISTS guards
-- ============================================================

-- ============================================================
-- 1. USERS TABLE — core account store (replaces demo-ID auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(200) UNIQUE,
    phone           VARCHAR(20)  UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'USER',  -- USER | ADMIN
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,
    CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ============================================================
-- 2. BRIDGE — link existing riders table to users
--    NULL is allowed so seeded demo riders still work
-- ============================================================
ALTER TABLE riders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_user ON riders(user_id);

-- ============================================================
-- 3. NEW ENUMs for transactions
-- ============================================================
DO $$ BEGIN
    CREATE TYPE txn_type AS ENUM ('PREMIUM_PAYMENT', 'CLAIM_PAYOUT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE txn_status AS ENUM ('CREATED', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 4. TRANSACTIONS TABLE — premium payments (money in) +
--    mirrors claim payouts (money out) for unified history
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    txn_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(user_id),
    rider_id            UUID REFERENCES riders(rider_id),
    policy_id           UUID REFERENCES policies(policy_id),
    type                txn_type    NOT NULL,
    amount_inr          DECIMAL(10,2) NOT NULL,
    razorpay_order_id   VARCHAR(100) UNIQUE,      -- present for PREMIUM_PAYMENT
    razorpay_payment_id VARCHAR(100),
    razorpay_signature  VARCHAR(300),
    status              txn_status NOT NULL DEFAULT 'CREATED',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_user    ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_policy  ON transactions(policy_id);
CREATE INDEX IF NOT EXISTS idx_txn_status  ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_txn_type    ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_txn_created ON transactions(created_at DESC);

-- ============================================================
-- 5. NOTIFICATION TYPE ENUM + NOTIFICATIONS TABLE
-- ============================================================
DO $$ BEGIN
    CREATE TYPE notif_type AS ENUM (
        'POLICY_ACTIVATED',
        'PAYOUT_TRIGGERED',
        'REPORT_STATUS',
        'PREMIUM_DUE',
        'DI_ALERT',
        'SYSTEM'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS notifications (
    notif_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(user_id),
    type        notif_type    NOT NULL,
    title       VARCHAR(200)  NOT NULL,
    body        TEXT          NOT NULL,
    is_read     BOOLEAN       NOT NULL DEFAULT false,
    metadata    JSONB,                              -- e.g. { zone_id, payout_amount }
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread
    ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- Verification
-- ============================================================
SELECT
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users')         AS users_table,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'transactions')  AS transactions_table,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'notifications') AS notifications_table,
    (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = 'riders' AND column_name = 'user_id')                        AS riders_user_id_col;
