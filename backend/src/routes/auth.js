/**
 * Auth Routes
 * POST /auth/signup              — create account, send verification email, issue JWT
 * POST /auth/login               — validate credentials, issue JWT
 * GET  /auth/me                  — return current user profile (protected)
 * GET  /auth/verify-email?token= — confirm email address
 * POST /auth/resend-verification — resend verification email
 */

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { query } = require('../config/db');
const { authenticateUser } = require('../middleware/authUser');
const { sendVerificationEmail } = require('../services/emailService');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
const JWT_EXPIRY  = '7d';
const VERIFY_EXPIRY_HOURS = 24;

// ─────────────────────────────────────────────────────────────
// POST /auth/signup
// Body: { name, email?, phone?, password }
// ─────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validation
  if (!name || !password) {
    return res.status(400).json({ error: 'name and password are required' });
  }
  if (!email && !phone) {
    return res.status(400).json({ error: 'Either email or phone is required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check uniqueness
    const existing = await query(
      'SELECT user_id FROM users WHERE email = $1 OR phone = $2',
      [email || null, phone || null]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email or phone already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate verification token
    const verifyToken   = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 3600 * 1000);

    // Insert user
    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, email_verification_token, email_verification_expires)
       VALUES ($1, $2, $3, $4, 'USER', $5, $6)
       RETURNING user_id, name, email, phone, role, is_verified, created_at`,
      [name, email || null, phone || null, password_hash, verifyToken, verifyExpires]
    );
    const user = result.rows[0];

    // Send verification email (non-blocking — don't fail signup if email fails)
    if (email) {
      sendVerificationEmail(email, name, verifyToken).catch(e =>
        console.warn('[Email] Failed to send verification email:', e.message)
      );
    }

    // Issue JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
      user: { user_id: user.user_id, name: user.name, email: user.email, phone: user.phone, role: user.role, is_verified: user.is_verified },
      token,
      verificationEmailSent: !!email,
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err.message);
    return res.status(500).json({ error: 'Signup failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email?, phone?, password }
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  if (!password || (!email && !phone)) {
    return res.status(400).json({ error: 'email/phone and password are required' });
  }

  try {
    // Fetch user
    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2 LIMIT 1',
      [email || null, phone || null]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last_login_at
    await query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [user.user_id]);

    // Check if rider profile already linked
    const riderResult = await query(
      'SELECT rider_id, platform_rider_id, e_avg, shift_pattern FROM riders WHERE user_id = $1 LIMIT 1',
      [user.user_id]
    );
    const hasRiderProfile = riderResult.rows.length > 0;

    // Check if active policy exists
    let hasActivePolicy = false;
    if (hasRiderProfile) {
      const policyResult = await query(
        `SELECT policy_id FROM policies
         WHERE rider_id = $1 AND status = 'ACTIVE' LIMIT 1`,
        [riderResult.rows[0].rider_id]
      );
      hasActivePolicy = policyResult.rows.length > 0;
    }

    // Issue JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.json({
      message: 'Login successful',
      user: {
        user_id:     user.user_id,
        name:        user.name,
        email:       user.email,
        phone:       user.phone,
        role:        user.role,
        is_verified: user.is_verified,
      },
      onboardingRequired: !hasRiderProfile,
      hasActivePolicy,
      token,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /auth/verify-email?token=xxx
// ─────────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Verification token is required' });

  try {
    const result = await query(
      `SELECT user_id, is_verified, email_verification_expires
       FROM users WHERE email_verification_token = $1 LIMIT 1`,
      [token]
    );

    // Token not found — user may already be verified (token cleared after first use)
    if (result.rows.length === 0) {
      // Return success — link was likely already used or account is already verified
      return res.json({ message: 'Email verified successfully! You can now log in.' });
    }

    const user = result.rows[0];

    // Already verified
    if (user.is_verified) {
      return res.json({ message: 'Email verified successfully! You can now log in.' });
    }

    // Mark verified, clear token
    await query(
      `UPDATE users
       SET is_verified = true,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE user_id = $1`,
      [user.user_id]
    );

    console.log(`[Auth] Email verified for user ${user.user_id}`);
    return res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('[Auth] Verify error:', err.message);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /auth/resend-verification  (PUBLIC — accepts email in body)
// Works whether logged in or not
// ─────────────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    let email = (req.body?.email || '').toLowerCase().trim();

    // If no email in body, try to get it from JWT if provided
    if (!email) {
      const authHeader = req.headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
          if (decoded.user_id) {
            const r = await query('SELECT email FROM users WHERE user_id=$1', [decoded.user_id]);
            if (r.rows.length) email = r.rows[0].email;
          }
        } catch (_) {}
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Please provide your email address.' });
    }

    const result = await query(
      'SELECT user_id, name, email, is_verified FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    }
    if (user.is_verified) {
      return res.json({
        message: 'Your email is already verified! You can log in.',
        already_verified: true,
      });
    }

    const verifyToken   = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 3600 * 1000);

    await query(
      'UPDATE users SET email_verification_token=$1, email_verification_expires=$2 WHERE user_id=$3',
      [verifyToken, verifyExpires, user.user_id]
    );

    sendVerificationEmail(user.email, user.name, verifyToken).catch(e =>
      console.warn('[Email] Resend failed:', e.message)
    );

    console.log(`[Auth] Verification email resent to ${email}`);
    return res.json({ message: 'Verification email sent! Check your inbox.' });
  } catch (err) {
    console.error('[Auth] Resend error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /auth/me  (protected)
// Returns current user + linked rider profile
// ─────────────────────────────────────────────────────────────
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const userResult = await query(
      'SELECT user_id, name, email, phone, role, created_at, last_login_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Fetch linked rider profile if exists
    const riderResult = await query(
      `SELECT r.rider_id, r.platform_rider_id, r.e_avg, r.shift_pattern, r.manual_baseline,
              p.policy_id, p.zone_id, p.status AS policy_status,
              p.subscription_streak, p.c_factor, p.last_premium_amount
       FROM riders r
       LEFT JOIN policies p ON p.rider_id = r.rider_id AND p.status = 'ACTIVE'
       WHERE r.user_id = $1
       LIMIT 1`,
      [req.user.user_id]
    );

    return res.json({
      ...user,
      rider: riderResult.rows[0] || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
