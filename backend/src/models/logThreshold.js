/**
 * Model 2: Dynamic Logarithmic Thresholding
 * SRS Section 4.2
 *
 * Prevents single or small groups of bad actors from fraudulently triggering
 * zone-wide payouts by requiring a logarithmically scaled number of
 * independent verified reports proportional to the zone's active rider density.
 *
 * Formula:
 *   U_min = max( U_base, ⌈ k · ln(N + 1) ⌉ )
 *
 * Defaults:
 *   U_base = 3   (minimum threshold regardless of density)
 *   k      = 2.5 (logarithmic scaling constant)
 */

const DEFAULT_U_BASE = 3;
const DEFAULT_K      = 2.5;

/**
 * Compute the minimum verified reports required to trigger a crowdsource payout.
 *
 * @param {number} N       - Active premium-paying riders currently inside the polygon
 * @param {number} [uBase] - Minimum baseline (default: 3)
 * @param {number} [k]     - Logarithmic scaling constant (default: 2.5)
 * @returns {{ uMin: number, formula: string, example: string }}
 */
function computeUMin(N, uBase = DEFAULT_U_BASE, k = DEFAULT_K) {
  if (N < 0) throw new Error('N (active riders) cannot be negative');

  const logComponent = Math.ceil(k * Math.log(N + 1));
  const uMin = Math.max(uBase, logComponent);

  return {
    uMin,
    activeRiders: N,
    uBase,
    k,
    logComponent,
    formula: `max(${uBase}, ⌈${k} · ln(${N}+1)⌉) = max(${uBase}, ${logComponent}) = ${uMin}`,
  };
}

/**
 * Compute the crowdsource ratio (U_ratio) used in the DI formula.
 * @param {number} verifiedReports - Count of approved crowdsource reports
 * @param {number} uMin            - Threshold from computeUMin
 * @returns {number} U_ratio clamped to [0, 1]
 */
function computeURatio(verifiedReports, uMin) {
  if (uMin <= 0) return 1;
  return Math.min(1, verifiedReports / uMin);
}

/**
 * Check if the crowdsource threshold has been met to trigger a DI override.
 * @param {number} verifiedReports
 * @param {number} uMin
 * @returns {boolean}
 */
function isThresholdMet(verifiedReports, uMin) {
  return verifiedReports >= uMin;
}

module.exports = { computeUMin, computeURatio, isThresholdMet };
