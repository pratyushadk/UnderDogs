/**
 * Payment Routes — Premium Collection via Razorpay Orders API
 *
 * POST /api/payments/create-order  — create Razorpay order for weekly premium
 * POST /api/payments/verify        — verify signature + activate policy
 * GET  /api/payments/history       — all transactions for logged-in user
 */

const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateUser } = require('../middleware/authUser');
const { createPremiumOrder, verifyPaymentSignature } = require('../services/razorpayOrderService');
const { createNotification } = require('../services/notificationService');
const { computePremium, getCFactor } = require('../models/premiumCalc');

// ─────────────────────────────────────────────────────────────
// POST /api/payments/create-order
// Creates a Razorpay order for the rider's weekly premium.
// Body: { zone_id, platform_rider_id }  (used if policy not yet created)
// ─────────────────────────────────────────────────────────────
router.post('/create-order', authenticateUser, async (req, res) => {
  const userId = req.user.user_id;

  try {
    // Look up linked rider + active policy
    const riderResult = await query(
      `SELECT r.rider_id, r.e_avg, r.shift_pattern,
              p.policy_id, p.zone_id, p.c_factor, p.last_premium_amount,
              p.subscription_streak, z.risk_multiplier
       FROM riders r
       LEFT JOIN policies p ON p.rider_id = r.rider_id AND p.status = 'ACTIVE'
       LEFT JOIN zones z    ON z.zone_id = p.zone_id
       WHERE r.user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (riderResult.rows.length === 0) {
      return res.status(404).json({ error: 'No rider profile found. Complete onboarding first.' });
    }

    const rider = riderResult.rows[0];

    // Compute fresh premium if not already calculated
    let premiumINR = parseFloat(rider.last_premium_amount || 0);
    if (premiumINR <= 0) {
      const weeklyEarnings = parseFloat(rider.e_avg) * 50;
      const hRisk  = Math.min(1, 50 / 60);
      const wRisk  = 0.3; // default — will be overridden by Saturday cron
      const sRisk  = 0.1;
      const rGeo   = parseFloat(rider.risk_multiplier || 1.0);
      const { cFactor } = getCFactor(rider.subscription_streak || 1, false);
      const { premiumPct } = computePremium({ hRisk, wRisk, sRisk, rGeo, cFactor });
      premiumINR = Math.max(10, Math.round((premiumPct / 100) * weeklyEarnings * 100) / 100);
    }

    // Create transaction record (CREATED state)
    const txnId = uuidv4();
    await query(
      `INSERT INTO transactions (txn_id, user_id, rider_id, policy_id, type, amount_inr, status)
       VALUES ($1, $2, $3, $4, 'PREMIUM_PAYMENT', $5, 'CREATED')`,
      [txnId, userId, rider.rider_id, rider.policy_id || null, premiumINR]
    );

    // Create Razorpay order
    const order = await createPremiumOrder(premiumINR, txnId, {
      user_id:  userId,
      rider_id: rider.rider_id,
      zone_id:  rider.zone_id,
    });

    // Store order ID
    await query(
      'UPDATE transactions SET razorpay_order_id = $1 WHERE txn_id = $2',
      [order.order_id, txnId]
    );

    return res.json({
      txn_id:     txnId,
      order_id:   order.order_id,
      amount:     order.amount,       // in paise
      amount_inr: premiumINR,
      currency:   order.currency,
      key_id:     process.env.RAZORPAY_KEY_ID,
      prefill: {
        name:  req.user.name || '',
        email: req.user.email || '',
      },
    });
  } catch (err) {
    console.error('[Payments] create-order error:', err.message);
    return res.status(500).json({ error: 'Could not create payment order', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Verifies Razorpay signature and activates the policy.
// Body: { txn_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ─────────────────────────────────────────────────────────────
router.post('/verify', authenticateUser, async (req, res) => {
  const { txn_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.user_id;

  if (!txn_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'All payment fields are required' });
  }

  try {
    // Fetch transaction
    const txnResult = await query(
      'SELECT * FROM transactions WHERE txn_id = $1 AND user_id = $2 LIMIT 1',
      [txn_id, userId]
    );
    if (txnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const txn = txnResult.rows[0];

    if (txn.status === 'PAID') {
      return res.json({ success: true, message: 'Already verified', policy_id: txn.policy_id });
    }

    // Verify HMAC signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      await query(
        'UPDATE transactions SET status = $1 WHERE txn_id = $2',
        ['FAILED', txn_id]
      );
      return res.status(422).json({ error: 'Payment signature verification failed' });
    }

    // Mark transaction as PAID
    await query(
      `UPDATE transactions
       SET status = 'PAID', razorpay_payment_id = $1, razorpay_signature = $2, updated_at = NOW()
       WHERE txn_id = $3`,
      [razorpay_payment_id, razorpay_signature, txn_id]
    );

    // Activate policy + increment streak
    if (txn.policy_id) {
      await query(
        `UPDATE policies
         SET status = 'ACTIVE', subscription_streak = subscription_streak + 1, last_premium_amount = $1
         WHERE policy_id = $2`,
        [txn.amount_inr, txn.policy_id]
      );
    }

    // Send notification: POLICY_ACTIVATED
    await createNotification(
      userId,
      'POLICY_ACTIVATED',
      '✅ Income Protection Activated',
      `Your WorkSafe protection is now active for this week. Premium paid: ₹${txn.amount_inr}.`,
      { txn_id, razorpay_payment_id, amount_inr: txn.amount_inr }
    );

    return res.json({
      success:    true,
      message:    'Payment verified. Protection is now active.',
      policy_id:  txn.policy_id,
      amount_inr: txn.amount_inr,
    });
  } catch (err) {
    console.error('[Payments] verify error:', err.message);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/payments/history
// Returns all transactions (premium payments + claim payouts) for user
// ─────────────────────────────────────────────────────────────
router.get('/history', authenticateUser, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const result = await query(
      `SELECT txn_id, type, amount_inr, status,
              razorpay_order_id, razorpay_payment_id,
              notes, created_at, updated_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const totalPaid = result.rows
      .filter(t => t.type === 'PREMIUM_PAYMENT' && t.status === 'PAID')
      .reduce((s, t) => s + parseFloat(t.amount_inr), 0);

    const totalReceived = result.rows
      .filter(t => t.type === 'CLAIM_PAYOUT' && t.status === 'PAID')
      .reduce((s, t) => s + parseFloat(t.amount_inr), 0);

    return res.json({
      transactions: result.rows,
      summary: {
        total_paid:     Math.round(totalPaid * 100) / 100,
        total_received: Math.round(totalReceived * 100) / 100,
        net:            Math.round((totalReceived - totalPaid) * 100) / 100,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
