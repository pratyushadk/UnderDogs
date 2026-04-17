/**
 * Admin Routes
 * All routes require: authenticateUser + authorizeAdmin middleware
 *
 * GET /admin/overview          — system KPIs
 * GET /admin/zones             — all zones with live DI
 * GET /admin/users             — paginated user list
 * GET /admin/transactions      — all transactions
 * GET /admin/fraud-log         — fraud rejection log
 * GET /admin/disruption-events — all disruption events + claim counts
 * GET /admin/reports           — all crowdsource reports
 */

const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { authenticateUser, authorizeAdmin } = require('../middleware/authUser');

// Apply auth to all admin routes
router.use(authenticateUser, authorizeAdmin);

// ─────────────────────────────────────────────────────────────
// GET /admin/overview — system health KPIs
// ─────────────────────────────────────────────────────────────
router.get('/overview', async (_req, res) => {
  try {
    const [users, policies, payouts, premiums, fraud, zones] = await Promise.all([
      query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL \'24 hours\') AS today FROM users WHERE role = \'USER\''),
      query('SELECT COUNT(*) FILTER (WHERE status = \'ACTIVE\') AS active, COUNT(*) AS total FROM policies'),
      query('SELECT COALESCE(SUM(payout_amount),0) AS total_payout, COUNT(*) AS count FROM claims WHERE status = \'SETTLED\''),
      query('SELECT COALESCE(SUM(amount_inr),0) AS total_revenue FROM transactions WHERE type = \'PREMIUM_PAYMENT\' AND status = \'PAID\''),
      query('SELECT COUNT(*) AS total FROM fraud_log WHERE logged_at > NOW() - INTERVAL \'7 days\''),
      query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE current_di > 75) AS disrupted FROM (SELECT zone_id, MAX(di_score) FILTER (WHERE computed_at > NOW() - INTERVAL \'1 hour\') AS current_di FROM zone_disruption_log GROUP BY zone_id) z'),
    ]);

    return res.json({
      timestamp: new Date().toISOString(),
      users: {
        total: parseInt(users.rows[0].total),
        new_today: parseInt(users.rows[0].today),
      },
      policies: {
        active: parseInt(policies.rows[0].active),
        total:  parseInt(policies.rows[0].total),
      },
      financials: {
        total_payout_inr:   parseFloat(payouts.rows[0].total_payout),
        total_revenue_inr:  parseFloat(premiums.rows[0].total_revenue),
        claims_settled:     parseInt(payouts.rows[0].count),
        net_inr: parseFloat(premiums.rows[0].total_revenue) - parseFloat(payouts.rows[0].total_payout),
      },
      fraud_rejections_7d:  parseInt(fraud.rows[0].total),
      zones: {
        total:     parseInt(zones.rows[0].total),
        disrupted: parseInt(zones.rows[0].disrupted || 0),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/zones
// ─────────────────────────────────────────────────────────────
router.get('/zones', async (_req, res) => {
  try {
    const result = await query(`
      SELECT
        z.zone_id, z.city, z.risk_multiplier,
        ST_AsGeoJSON(z.geom) AS geojson,
        COALESCE(d.current_di, 0) AS current_di,
        COALESCE(d.avg_di_24h, 0) AS avg_di_24h,
        COALESCE(d.peak_di_24h, 0) AS peak_di_24h,
        COALESCE(p.active_policies, 0) AS active_policies
      FROM zones z
      LEFT JOIN (
        SELECT zone_id,
          AVG(di_score) FILTER (WHERE computed_at > NOW() - INTERVAL '24 hours') AS avg_di_24h,
          MAX(di_score) FILTER (WHERE computed_at > NOW() - INTERVAL '24 hours') AS peak_di_24h,
          MAX(di_score) FILTER (WHERE computed_at > NOW() - INTERVAL '1 hour') AS current_di
        FROM zone_disruption_log GROUP BY zone_id
      ) d ON d.zone_id = z.zone_id
      LEFT JOIN (
        SELECT zone_id, COUNT(*) AS active_policies
        FROM policies WHERE status = 'ACTIVE' GROUP BY zone_id
      ) p ON p.zone_id = z.zone_id
      ORDER BY current_di DESC NULLS LAST
    `);
    return res.json({ zones: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/users?page=1&limit=20
// ─────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(50, parseInt(req.query.limit || '20'));
  const offset = (page - 1) * limit;
  try {
    const [users, count] = await Promise.all([
      query(
        `SELECT u.user_id, u.name, u.email, u.phone, u.role, u.created_at, u.last_login_at,
                r.platform_rider_id, p.zone_id, p.status AS policy_status, p.subscription_streak
         FROM users u
         LEFT JOIN riders r ON r.user_id = u.user_id
         LEFT JOIN policies p ON p.rider_id = r.rider_id AND p.status = 'ACTIVE'
         WHERE u.role = 'USER'
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*) FROM users WHERE role = \'USER\''),
    ]);
    return res.json({
      users: users.rows,
      pagination: { page, limit, total: parseInt(count.rows[0].count), pages: Math.ceil(count.rows[0].count / limit) },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/transactions?type=&status=&page=1
// ─────────────────────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  const { type, status, page = '1', limit = '20' } = req.query;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(50, parseInt(limit));
  const offset = (p - 1) * l;

  const conditions = [];
  const params     = [];
  if (type)   { conditions.push(`t.type = $${params.push(type)}`); }
  if (status) { conditions.push(`t.status = $${params.push(status)}`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const result = await query(
      `SELECT t.txn_id, t.type, t.amount_inr, t.status, t.razorpay_order_id,
              t.razorpay_payment_id, t.created_at, u.name AS user_name, u.email
       FROM transactions t
       JOIN users u ON u.user_id = t.user_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT ${l} OFFSET ${offset}`,
      params
    );
    return res.json({ transactions: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/fraud-log
// ─────────────────────────────────────────────────────────────
router.get('/fraud-log', async (req, res) => {
  try {
    const [log, summary] = await Promise.all([
      query(
        `SELECT fl.log_id, fl.gate_type, fl.rejection_reason, fl.logged_at,
                r.platform_rider_id
         FROM fraud_log fl
         LEFT JOIN riders r ON r.rider_id = fl.rider_id
         ORDER BY fl.logged_at DESC LIMIT 100`
      ),
      query(
        `SELECT gate_type, COUNT(*) AS count
         FROM fraud_log WHERE logged_at > NOW() - INTERVAL '7 days'
         GROUP BY gate_type ORDER BY count DESC`
      ),
    ]);
    return res.json({ log: log.rows, summary: summary.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/disruption-events
// ─────────────────────────────────────────────────────────────
router.get('/disruption-events', async (_req, res) => {
  try {
    const result = await query(`
      SELECT e.event_id, e.zone_id, e.trigger_type, e.di_score,
             e.triggered_at, e.status,
             COUNT(c.claim_id) AS claim_count,
             COALESCE(SUM(c.payout_amount), 0) AS total_payout
      FROM disruption_events e
      LEFT JOIN claims c ON c.event_id = e.event_id
      GROUP BY e.event_id
      ORDER BY e.triggered_at DESC
      LIMIT 50
    `);
    return res.json({ events: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /admin/reports
// ─────────────────────────────────────────────────────────────
router.get('/reports', async (_req, res) => {
  try {
    const result = await query(`
      SELECT cr.report_id, cr.zone_id, cr.verdict,
             cr.clip_verdict, cr.clip_confidence, cr.moire_detected,
             cr.reported_at, r.platform_rider_id
      FROM crowdsource_reports cr
      LEFT JOIN riders r ON r.rider_id = cr.rider_id
      ORDER BY cr.reported_at DESC
      LIMIT 100
    `);
    return res.json({ reports: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
