/**
 * Claims Routes — Stage 5 (API-triggered view + manual status)
 * SRS FR-5.1 through FR-5.5
 *
 * GET  /api/claims/mine       — Rider's claim history
 * GET  /api/claims/event/:id  — Event detail + settlement status
 * GET  /api/claims/dashboard  — Underwriter analytics view (FR-4.6)
 */

const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/db');

// ─────────────────────────────────────────────────────────────
// GET /api/claims/mine
// Returns rider's full claim history with payout breakdown
// ─────────────────────────────────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  const riderId = req.rider.rider_id;
  try {
    const result = await query(
      `SELECT
         c.claim_id,
         c.payout_amount,
         c.h_lost,
         c.c_ratio_applied,
         c.status,
         c.razorpay_txn_id,
         c.settled_at,
         e.zone_id,
         e.trigger_type,
         e.di_score,
         e.triggered_at
       FROM claims c
       JOIN disruption_events e ON e.event_id = c.event_id
       WHERE c.rider_id = $1
       ORDER BY c.settled_at DESC NULLS LAST`,
      [riderId]
    );
    return res.json({ claims: result.rows, total: result.rowCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/claims/event/:eventId
// Returns event detail with all associated claims
// ─────────────────────────────────────────────────────────────
router.get('/event/:eventId', authenticate, async (req, res) => {
  const { eventId } = req.params;
  try {
    const eventRes = await query(
      `SELECT * FROM disruption_events WHERE event_id = $1`,
      [eventId]
    );
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const claimsRes = await query(
      `SELECT c.claim_id, c.rider_id, c.payout_amount, c.h_lost, c.status, c.settled_at
       FROM claims c WHERE c.event_id = $1`,
      [eventId]
    );

    return res.json({
      event: eventRes.rows[0],
      claims: claimsRes.rows,
      totalPayout: claimsRes.rows.reduce((s, c) => s + parseFloat(c.payout_amount || 0), 0),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/claims/dashboard
// Underwriter analytics (PRD Section 4.6 — SRS FR-4.6)
// Returns: zone heatmap data, float exposure, C_factor distribution
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    // Zone-level DI summary (last 24h)
    const diSummary = await query(`
      SELECT
        dl.zone_id,
        z.city,
        AVG(dl.di_score) AS avg_di,
        MAX(dl.di_score) AS peak_di,
        COUNT(*) AS samples,
        ST_AsGeoJSON(z.geom) AS geojson
      FROM zone_disruption_log dl
      JOIN zones z ON z.zone_id = dl.zone_id
      WHERE dl.computed_at > NOW() - INTERVAL '24 hours'
      GROUP BY dl.zone_id, z.city, z.geom
      ORDER BY peak_di DESC
    `);

    // Float exposure (total pending + settled payouts today)
    const floatExposure = await query(`
      SELECT
        SUM(CASE WHEN status = 'SETTLED' THEN payout_amount ELSE 0 END) AS settled_today,
        SUM(CASE WHEN status = 'PENDING' THEN payout_amount ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'FAILED'  THEN payout_amount ELSE 0 END) AS failed,
        COUNT(*) AS total_claims
      FROM claims
      WHERE settled_at > CURRENT_DATE OR status = 'PENDING'
    `);

    // C_factor distribution
    const cFactorDist = await query(`
      SELECT
        CASE
          WHEN c_factor <= 0.90 THEN 'loyalty_discount'
          WHEN c_factor <= 1.05 THEN 'standard'
          WHEN c_factor <= 1.25 THEN 'new_subscriber'
          ELSE 'adverse_selection'
        END AS bucket,
        COUNT(*) AS count
      FROM policies WHERE status = 'ACTIVE'
      GROUP BY bucket
    `);

    // Recent fraud rejections
    const recentFraud = await query(`
      SELECT gate_type, COUNT(*) AS count
      FROM fraud_log
      WHERE logged_at > NOW() - INTERVAL '7 days'
      GROUP BY gate_type
      ORDER BY count DESC
    `);

    return res.json({
      timestamp: new Date().toISOString(),
      zones: diSummary.rows,
      floatExposure: floatExposure.rows[0],
      cFactorDistribution: cFactorDist.rows,
      fraudRejections: recentFraud.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/claims/policy-status
// Returns current rider policy status + streak + premium
// ─────────────────────────────────────────────────────────────
router.get('/policy-status', authenticate, async (req, res) => {
  const riderId = req.rider.rider_id;
  try {
    const result = await query(
      `SELECT p.policy_id, p.zone_id, p.status, p.subscription_streak,
              p.c_factor, p.last_premium_amount, p.created_at,
              z.city, z.risk_multiplier
       FROM policies p JOIN zones z ON z.zone_id = p.zone_id
       WHERE p.rider_id = $1 AND p.status = 'ACTIVE'
       LIMIT 1`,
      [riderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active policy found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
