/**
 * Premium Calculation Cron Job — Saturday 23:00 IST
 * SRS FR-2.1: "A node-cron job SHALL execute every Saturday at 23:00 IST"
 * SRS FR-2.3: Premium Computation using Model 1
 * SRS FR-2.5: Auto-deduction on Sunday 23:59 if no opt-out
 */

const cron = require('node-cron');
const axios = require('axios');
const { computePremium, getCFactor, detectAdverseSelection } = require('../models/premiumCalc');
const { query } = require('../config/db');

/**
 * Fetch 7-day forecast risk level from Tomorrow.io for a zone centroid.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ wRisk: number, forecastLevel: string }>}
 */
async function getWeeklyForecast(lat, lon) {
  try {
    const response = await axios.get('https://api.tomorrow.io/v4/weather/forecast', {
      params: {
        location: `${lat},${lon}`,
        apikey: process.env.TOMORROW_IO_API_KEY,
        fields: ['precipitationProbability', 'windSpeed'],
        units: 'metric',
      },
      timeout: 8000,
    });

    const daily = response.data?.timelines?.daily ?? [];
    const avgPrecipProb = daily.slice(0, 7).reduce((sum, d) => {
      return sum + (d.values?.precipitationProbabilityAvg ?? 0);
    }, 0) / Math.max(daily.length, 1);

    const wRisk = Math.min(1, avgPrecipProb / 100);
    const forecastLevel =
      wRisk >= 0.7 ? 'EXTREME' :
      wRisk >= 0.5 ? 'HIGH' :
      wRisk >= 0.3 ? 'MEDIUM' : 'LOW';

    return { wRisk, forecastLevel };
  } catch (err) {
    console.warn(`[Premium] Tomorrow.io API error: ${err.message} — defaulting wRisk=0`);
    return { wRisk: 0, forecastLevel: 'LOW' };
  }
}

/**
 * Run the premium calculation batch for all active policies.
 */
async function runPremiumCalculation() {
  console.log(`\n[Premium] Batch calculation started: ${new Date().toISOString()}`);

  try {
    // Fetch all active policies with their zone centroids
    const { rows: policies } = await query(`
      SELECT
        p.policy_id, p.rider_id, p.zone_id,
        p.subscription_streak, p.c_factor,
        p.last_opt_out_week, p.last_opt_out_risk_level,
        r.e_avg, r.shift_pattern,
        z.risk_multiplier,
        ST_Y(ST_Centroid(z.geom)) AS centroid_lat,
        ST_X(ST_Centroid(z.geom)) AS centroid_lon
      FROM policies p
      JOIN riders r ON r.rider_id = p.rider_id
      JOIN zones  z ON z.zone_id  = p.zone_id
      WHERE p.status = 'ACTIVE'
    `);

    console.log(`[Premium] Processing ${policies.length} active policies...`);

    for (const policy of policies) {
      try {
        const { wRisk, forecastLevel } = await getWeeklyForecast(
          policy.centroid_lat, policy.centroid_lon
        );

        // Adverse selection detection
        const gapWeeks = policy.last_opt_out_week
          ? Math.floor((Date.now() - new Date(policy.last_opt_out_week)) / (7 * 24 * 60 * 60 * 1000))
          : 999;

        const isAdverse = detectAdverseSelection(
          policy.last_opt_out_risk_level,
          forecastLevel,
          gapWeeks
        );

        const weeklyEarnings = policy.e_avg * 50; // ~50 billable hours/week estimate
        const hRisk = Math.min(1, 50 / 60); // normalized hours (50h/week out of max 60h)
        const sRisk = 0.1; // default social risk (PredictHQ omitted in MVP)

        const { cFactor } = getCFactor(policy.subscription_streak, isAdverse, forecastLevel === 'EXTREME' ? 1 : 0.5);
        const { premiumPct } = computePremium({
          hRisk,
          wRisk,
          sRisk,
          rGeo: parseFloat(policy.risk_multiplier),
          cFactor,
        });

        const premiumINR = Math.round((premiumPct / 100) * weeklyEarnings * 100) / 100;

        // Update policy with new premium and C_factor
        await query(
          `UPDATE policies SET c_factor = $1, last_premium_amount = $2 WHERE policy_id = $3`,
          [cFactor, premiumINR, policy.policy_id]
        );

        console.log(`  [${policy.zone_id}] Rider ${policy.rider_id.substring(0, 8)}... → ₹${premiumINR} (${premiumPct}%, C=${cFactor}${isAdverse ? ' ⚠️ ADVERSE' : ''})`);
      } catch (err) {
        console.error(`  [Premium] Error for policy ${policy.policy_id}:`, err.message);
      }
    }

    console.log('[Premium] Batch calculation complete.\n');
  } catch (err) {
    console.error('[Premium] Fatal batch error:', err.message);
  }
}

function startPremiumJob() {
  const schedule = process.env.CRON_PREMIUM_SCHEDULE || '0 23 * * 6';
  console.log(`[Cron] Premium calculation job scheduled: "${schedule}" (Saturdays 23:00 IST)`);

  cron.schedule(schedule, runPremiumCalculation, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });
}

module.exports = { startPremiumJob, runPremiumCalculation };
