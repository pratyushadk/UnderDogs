/**
 * Model 1: Predictive Pricing & Consistency Matrix
 * SRS Section 4.1
 *
 * Calculates the dynamic weekly premium percentage reflecting personal
 * risk exposure, zone-level historical risk, and behavioral consistency.
 *
 * Formula:
 *   Premium% = [ P_base + (α·H_risk) + (β·W_risk) + (γ·S_risk) ] × R_geo × C_factor
 *
 * Consistency Matrix (C_factor):
 *   streak >= 12             → 0.85 (loyalty discount)
 *   streak 4–11              → 1.00 (neutral)
 *   streak 1–3               → 1.20 (new subscriber loading)
 *   adverse selection detected → ≥ 2.5 (gaming penalty)
 */

// Default model coefficients (override via config if needed)
const MODEL_PARAMS = {
  P_base: 1.5,   // Minimum base premium percentage
  alpha:  1.0,   // H_risk weight
  beta:   2.0,   // W_risk weight
  gamma:  1.5,   // S_risk weight
};

/**
 * Determine C_factor from subscription streak and adverse selection check.
 *
 * @param {number}  streak              - Consecutive weeks subscribed
 * @param {boolean} adverseSelection    - True if gaming detected
 * @param {number}  [forecastRiskScore] - 0–1 severity of forecast (for fine-tuning penalty)
 * @returns {{ cFactor: number, reason: string }}
 */
function getCFactor(streak, adverseSelection = false, forecastRiskScore = 0) {
  if (adverseSelection) {
    const cFactor = Math.round((2.5 + forecastRiskScore * 0.1) * 100) / 100;
    return { cFactor, reason: 'ADVERSE_SELECTION_PENALTY' };
  }
  if (streak >= 12) return { cFactor: 0.85, reason: 'LOYALTY_DISCOUNT' };
  if (streak >= 4)  return { cFactor: 1.00, reason: 'STANDARD' };
  return { cFactor: 1.20, reason: 'NEW_SUBSCRIBER_LOADING' };
}

/**
 * Detect adverse selection: rider cancelled during low-risk week and
 * is re-subscribing before a high-risk forecast.
 *
 * Per SRS 4.1 adverse selection logic:
 *   IF (last_opt_out was during LOW risk)
 *   AND (current forecast is HIGH or EXTREME)
 *   AND (gap <= 2 weeks)
 *   THEN → adverse selection detected
 *
 * @param {string|null} lastOptOutRiskLevel  - 'LOW'|'MEDIUM'|'HIGH'|'EXTREME'|null
 * @param {string}      currentForecastLevel - 'LOW'|'MEDIUM'|'HIGH'|'EXTREME'
 * @param {number}      gapWeeksSinceOptOut  - Weeks since last opt-out
 * @returns {boolean}
 */
function detectAdverseSelection(lastOptOutRiskLevel, currentForecastLevel, gapWeeksSinceOptOut) {
  if (!lastOptOutRiskLevel) return false;
  const optOutWasLowRisk = lastOptOutRiskLevel === 'LOW';
  const currentIsHighRisk = ['HIGH', 'EXTREME'].includes(currentForecastLevel);
  const recentGap = gapWeeksSinceOptOut <= 2;
  return optOutWasLowRisk && currentIsHighRisk && recentGap;
}

/**
 * Compute the weekly premium percentage for a rider.
 *
 * @param {object} inputs
 * @param {number}  inputs.hRisk          - Hourly exposure risk (0–1)
 * @param {number}  inputs.wRisk          - Weather disruption probability (0–1)
 * @param {number}  inputs.sRisk          - Social disruption probability (0–1)
 * @param {number}  inputs.rGeo           - Zone geographic risk multiplier (≥1.0)
 * @param {number}  inputs.cFactor        - Consistency matrix value
 * @param {object}  [params]              - Override model coefficients
 * @returns {{ premiumPct: number, premiumINR: number|null, formula: string, breakdown: object }}
 */
function computePremium({ hRisk, wRisk, sRisk, rGeo, cFactor }, params = {}) {
  const P_base = params.P_base ?? MODEL_PARAMS.P_base;
  const alpha  = params.alpha  ?? MODEL_PARAMS.alpha;
  const beta   = params.beta   ?? MODEL_PARAMS.beta;
  const gamma  = params.gamma  ?? MODEL_PARAMS.gamma;

  const riskSum = P_base + (alpha * hRisk) + (beta * wRisk) + (gamma * sRisk);
  const premiumPct = Math.round(riskSum * rGeo * cFactor * 100) / 100;

  return {
    premiumPct,
    breakdown: {
      P_base, alpha, beta, gamma,
      hRiskComponent: Math.round(alpha * hRisk * 100) / 100,
      wRiskComponent: Math.round(beta  * wRisk * 100) / 100,
      sRiskComponent: Math.round(gamma * sRisk * 100) / 100,
      rGeo, cFactor,
    },
    formula: `[${P_base} + (${alpha}×${hRisk}) + (${beta}×${wRisk}) + (${gamma}×${sRisk})] × ${rGeo} × ${cFactor} = ${premiumPct}%`,
  };
}

/**
 * Convert premium percentage to INR amount.
 * @param {number} premiumPct  - e.g. 3.5 (%)
 * @param {number} weeklyEarnings - Rider's expected weekly earnings (INR)
 * @returns {number} Premium in INR
 */
function premiumPctToINR(premiumPct, weeklyEarnings) {
  return Math.round((premiumPct / 100) * weeklyEarnings * 100) / 100;
}

module.exports = { computePremium, getCFactor, detectAdverseSelection, premiumPctToINR };
