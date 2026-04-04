/**
 * Settlement Pipeline
 * Triggered when DI >= 75 (API path) or crowdsource threshold met.
 * Implements SRS Stage 5: FR-5.1 through FR-5.5.
 */

const { getRidersInZone } = require('../services/postgisService');
const { computePayout, computeHoursLost } = require('../models/payoutCalc');
const { disbursePayout } = require('../services/razorpayService');
const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Track recently triggered zones to prevent double-firing (4-hour cooldown)
const recentlyTriggered = new Map();
const COOLDOWN_MS = 4 * 60 * 60 * 1000;

/**
 * Execute the full settlement pipeline for a disrupted zone.
 * @param {string} zoneId
 * @param {number} diScore
 * @param {'API'|'CROWDSOURCE'} triggerType
 */
async function triggerSettlement(zoneId, diScore, triggerType) {
  // Cooldown guard — prevent duplicate triggers
  const lastTriggered = recentlyTriggered.get(zoneId);
  if (lastTriggered && Date.now() - lastTriggered < COOLDOWN_MS) {
    console.log(`[Settlement] Zone ${zoneId} is in cooldown — skipping.`);
    return;
  }
  recentlyTriggered.set(zoneId, Date.now());

  console.log(`\n🚨 [Settlement] Pipeline triggered for ${zoneId} | DI=${diScore} | Type=${triggerType}`);

  // 1. Create disruption event record (SRS FR-4A.2)
  const eventId = uuidv4();
  await query(
    `INSERT INTO disruption_events (event_id, zone_id, trigger_type, di_score, status)
     VALUES ($1, $2, $3, $4, 'PENDING_SETTLEMENT')`,
    [eventId, zoneId, triggerType, diScore]
  );

  // 2. Identify qualifying riders via PostGIS (SRS FR-4A.1)
  const riders = await getRidersInZone(zoneId);
  console.log(`[Settlement] ${riders.length} qualifying riders found in ${zoneId}`);

  if (riders.length === 0) {
    await query(`UPDATE disruption_events SET status = 'SETTLED' WHERE event_id = $1`, [eventId]);
    return;
  }

  // 3. Process each rider
  const now = new Date();
  const cRatio = parseFloat(process.env.C_RATIO) || 0.85;

  const settlements = await Promise.allSettled(
    riders.map(async (rider) => {
      const shiftEnd = rider.shift_pattern?.end ?? '21:00';
      const hLost = computeHoursLost(shiftEnd, now);

      if (hLost <= 0) {
        console.log(`  [Settlement] Rider ${rider.rider_id} — shift already ended, skipping.`);
        return null;
      }

      // 4. Compute payout (SRS FR-5.2, Model 4)
      const { payoutINR } = computePayout(rider.e_avg, hLost, cRatio);
      const payoutPaise = Math.round(payoutINR * 100);

      console.log(`  [Settlement] Rider ${rider.rider_id} → ₹${payoutINR} (${hLost}h × ₹${rider.e_avg}/h × ${cRatio})`);

      // 5. Create claim record (PENDING)
      const claimId = uuidv4();
      await query(
        `INSERT INTO claims (claim_id, rider_id, event_id, payout_amount, c_ratio_applied, h_lost, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
        [claimId, rider.rider_id, eventId, payoutINR, cRatio, hLost]
      );

      // 6. Disburse via Razorpay (SRS FR-5.3, with 3x retry)
      const { success, razorpayTxnId, error } = await disbursePayout({
        amountPaise: payoutPaise,
        riderId: rider.rider_id,
        claimId,
        narration: `WorkSafe Payout — ${zoneId}`,
      });

      // 7. Update claim status (SRS FR-5.5)
      if (success) {
        await query(
          `UPDATE claims SET status = 'SETTLED', razorpay_txn_id = $1, settled_at = NOW()
           WHERE claim_id = $2`,
          [razorpayTxnId, claimId]
        );
        console.log(`  ✅ Settled claim ${claimId} — txn: ${razorpayTxnId}`);
      } else {
        await query(
          `UPDATE claims SET status = 'FAILED' WHERE claim_id = $1`,
          [claimId]
        );
        console.error(`  ❌ Failed claim ${claimId}: ${error}`);
      }

      return { claimId, riderId: rider.rider_id, payoutINR, success };
    })
  );

  // 8. Mark disruption event as SETTLED
  await query(
    `UPDATE disruption_events SET status = 'SETTLED' WHERE event_id = $1`,
    [eventId]
  );

  const successCount = settlements.filter((s) => s.status === 'fulfilled' && s.value?.success).length;
  console.log(`[Settlement] Complete — ${successCount}/${riders.length} payouts succeeded for event ${eventId}\n`);
}

module.exports = { triggerSettlement };
