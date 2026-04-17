/**
 * Onboarding Routes — Stage 1
 * SRS FR-1.1 through FR-1.6
 *
 * POST /api/onboarding/subscribe   — FR-1.5: Subscribe a rider
 * GET  /api/onboarding/profile     — FR-1.2: Fetch rider data from mock partner API
 * POST /api/onboarding/manual      — FR-1.6: Manual fallback zone selection
 * POST /api/onboarding/ping        — Update rider GPS session
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { authenticateUser } = require('../middleware/authUser');
const { getZoneForCoordinate, upsertActiveSession } = require('../services/postgisService');

// ─────────────────────────────────────────────────────────────
// GET /api/onboarding/profile
// Fetches rider data from mock partner API (FR-1.2)
// ─────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  const { platform_rider_id } = req.query;
  if (!platform_rider_id) {
    return res.status(400).json({ error: 'platform_rider_id is required' });
  }

  try {
    const mockResponse = await axios.get(
      `${process.env.MOCK_PARTNER_API_URL}/rider/${platform_rider_id}`,
      {
        headers: { 'X-Mock-Secret': process.env.MOCK_PARTNER_API_SECRET },
        timeout: 5000,
      }
    );

    // mockResponse.data = { success: true, data: riderObject }
    // Return the rider object directly so frontend can access p.name, p.e_avg etc.
    const riderData = mockResponse.data?.data || mockResponse.data;
    return res.json({ source: 'partner_api', ...riderData });
  } catch (err) {
    console.warn(`[Onboarding] Mock API failed: ${err.message}`);
    return res.status(503).json({
      error: 'PARTNER_API_UNAVAILABLE',
      message: 'Please use manual onboarding fallback.',
      fallbackRequired: true,
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/onboarding/subscribe
// Creates rider + policy + issues legacy fallback token (FR-1.5)
// Body: { platform_rider_id, e_avg, shift_pattern, zone_id, manual_baseline? }
// ─────────────────────────────────────────────────────────────
router.post('/subscribe', authenticateUser, async (req, res) => {
  const {
    platform_rider_id,
    e_avg,
    shift_pattern,
    zone_id,
    manual_baseline = false,
  } = req.body;

  const userId = req.user.user_id;

  if (!platform_rider_id || !zone_id) {
    return res.status(400).json({ error: 'Missing required fields: platform_rider_id, zone_id' });
  }

  try {
    // Look up e_avg and shift_pattern from DB if not provided (rider pre-seeded)
    let finalEavg = e_avg;
    let finalShift = shift_pattern;

    if (!finalEavg || !finalShift) {
      const existing = await query(
        'SELECT e_avg, shift_pattern FROM riders WHERE platform_rider_id = $1',
        [platform_rider_id]
      );
      if (existing.rows.length > 0) {
        finalEavg = finalEavg || existing.rows[0].e_avg;
        finalShift = finalShift || existing.rows[0].shift_pattern;
      } else {
        // Fall back to mock partner API
        try {
          const mockRes = await axios.get(
            `${process.env.MOCK_PARTNER_API_URL}/rider/${platform_rider_id}`,
            { headers: { 'X-Mock-Secret': process.env.MOCK_PARTNER_API_SECRET }, timeout: 5000 }
          );
          const rd = mockRes.data?.data || mockRes.data;
          finalEavg = finalEavg || rd.e_avg;
          finalShift = finalShift || rd.shift_pattern;
        } catch (_) {}
      }
    }

    if (!finalEavg) {
      return res.status(400).json({ error: 'Could not determine e_avg for this rider.' });
    }

    // Upsert rider AND link to the current authenticated user_id
    const riderResult = await query(
      `INSERT INTO riders (platform_rider_id, e_avg, shift_pattern, manual_baseline, user_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (platform_rider_id) DO UPDATE SET
         e_avg = EXCLUDED.e_avg,
         shift_pattern = EXCLUDED.shift_pattern,
         user_id = EXCLUDED.user_id
       RETURNING rider_id`,
      [platform_rider_id, finalEavg, JSON.stringify(finalShift || { start: '09:00', end: '21:00' }), manual_baseline, userId]
    );
    const riderId = riderResult.rows[0].rider_id;

    // Verify zone exists
    const zoneCheck = await query('SELECT zone_id FROM zones WHERE zone_id = $1', [zone_id]);
    if (zoneCheck.rows.length === 0) {
      return res.status(404).json({ error: `Zone ${zone_id} not found` });
    }

    // Create or update policy — one active policy per rider
    const existingPolicy = await query(
      `SELECT policy_id FROM policies WHERE rider_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [riderId]
    );

    let policy_id, c_factor;
    if (existingPolicy.rows.length > 0) {
      // Update existing policy zone
      const upd = await query(
        `UPDATE policies SET zone_id = $1 WHERE policy_id = $2 RETURNING policy_id, c_factor`,
        [zone_id, existingPolicy.rows[0].policy_id]
      );
      ({ policy_id, c_factor } = upd.rows[0]);
    } else {
      const ins = await query(
        `INSERT INTO policies (rider_id, zone_id, status, subscription_streak, c_factor)
         VALUES ($1, $2, 'ACTIVE', 1, 1.20)
         RETURNING policy_id, c_factor`,
        [riderId, zone_id]
      );
      ({ policy_id, c_factor } = ins.rows[0]);
    }

    const token = jwt.sign(
      { rider_id: riderId, platform_rider_id, zone_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Subscription activated',
      rider_id: riderId,
      policy_id,
      zone_id,
      c_factor,
      token,
    });
  } catch (err) {
    console.error('[Onboarding] Subscribe error:', err.message);
    return res.status(500).json({ error: 'Subscription failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/onboarding/ping — Update rider live location
// Body: { latitude, longitude }
// ─────────────────────────────────────────────────────────────
router.post('/ping', authenticate, async (req, res) => {
  const { latitude, longitude } = req.body;
  const riderId = req.rider.rider_id;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'latitude and longitude are required' });
  }

  try {
    // Store ping for Haversine Speed Trap
    await query(
      `INSERT INTO rider_pings (rider_id, latitude, longitude) VALUES ($1, $2, $3)`,
      [riderId, latitude, longitude]
    );

    // Update live session
    await upsertActiveSession(riderId, latitude, longitude);

    return res.json({ status: 'ok', zoneId: req.rider.zone_id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
