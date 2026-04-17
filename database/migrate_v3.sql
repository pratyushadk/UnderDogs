-- ============================================================
-- WorkSafe Database Migration v3
-- Adds email verification token columns to users table
-- Safe: uses IF NOT EXISTS guards
-- Run ONCE after migrate_v2.sql
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verification_token  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_verify_token ON users(email_verification_token);

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('email_verification_token', 'email_verification_expires', 'is_verified');
