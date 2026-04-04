/**
 * Model 3: Live Disruption Index (DI) Calculator
 * SRS Section 4.3
 *
 * Unifies heterogeneous environmental and social data streams into a
 * single normalized severity score (0–100) per polygon.
 *
 * Formula:
 *   DI = (w₁ · I_weather) + (w₂ · I_traffic) + (w₃ · min(100, U_ratio · 100))
 *
 * Default weights (configurable):
 *   w₁ = 0.45 (weather)
 *   w₂ = 0.35 (traffic)
 *   w₃ = 0.20 (crowdsource)
 *   Constraint: w₁ + w₂ + w₃ = 1.0
 *
 * Payout trigger: DI >= 75
 */

const DEFAULT_WEIGHTS = { w1: 0.45, w2: 0.35, w3: 0.20 };

/**
 * Normalize raw weather metrics to a 0–100 scalar.
 * Per SRS Table FR-3.3
 * @param {{ precipitationMmPerHr?: number, isNasaEvent?: boolean, nasaSeverity?: string, earthquakeMagnitude?: number }} raw
 * @returns {number} I_weather (0–100)
 */
function normalizeWeather({ precipitationMmPerHr = 0, isNasaEvent = false, nasaSeverity = 'low', earthquakeMagnitude = 0 }) {
  let score = Math.min(100, precipitationMmPerHr * 10);

  if (isNasaEvent) {
    const nasaMap = { low: 20, medium: 60, high: 100 };
    score = Math.max(score, nasaMap[nasaSeverity] || 20);
  }

  if (earthquakeMagnitude > 0) {
    score = Math.max(score, Math.min(100, earthquakeMagnitude * 15));
  }

  return Math.min(100, Math.round(score * 100) / 100);
}

/**
 * Normalize TomTom traffic speed drop to 0–100.
 * @param {number} speedDropPercent - % drop from normal zone speed (0–100)
 * @returns {number} I_traffic (0–100)
 */
function normalizeTraffic(speedDropPercent) {
  return Math.min(100, Math.max(0, Math.round(speedDropPercent * 100) / 100));
}

/**
 * Compute the Disruption Index for a zone.
 *
 * @param {number} iWeather   - Normalized weather severity (0–100)
 * @param {number} iTraffic   - Normalized traffic severity (0–100)
 * @param {number} uRatio     - Crowdsource ratio: verified_reports / U_min (0–1)
 * @param {{ w1?: number, w2?: number, w3?: number }} [weights]
 * @returns {{ di: number, breakdown: object, isTriggered: boolean }}
 */
function computeDI(iWeather, iTraffic, uRatio = 0, weights = {}) {
  const w1 = weights.w1 ?? DEFAULT_WEIGHTS.w1;
  const w2 = weights.w2 ?? DEFAULT_WEIGHTS.w2;
  const w3 = weights.w3 ?? DEFAULT_WEIGHTS.w3;

  // Validate weight sum
  const weightSum = Math.round((w1 + w2 + w3) * 100) / 100;
  if (Math.abs(weightSum - 1.0) > 0.001) {
    throw new Error(`DI weights must sum to 1.0, got ${weightSum}`);
  }

  const crowdsourceComponent = Math.min(100, uRatio * 100);
  const di = (w1 * iWeather) + (w2 * iTraffic) + (w3 * crowdsourceComponent);
  const diRounded = Math.round(di * 100) / 100;

  const threshold = parseFloat(process.env.DI_THRESHOLD) || 75;

  return {
    di: diRounded,
    isTriggered: diRounded >= threshold,
    threshold,
    breakdown: {
      weatherComponent:     Math.round(w1 * iWeather * 100) / 100,
      trafficComponent:     Math.round(w2 * iTraffic * 100) / 100,
      crowdsourceComponent: Math.round(w3 * crowdsourceComponent * 100) / 100,
      iWeather,
      iTraffic,
      uRatio,
      weights: { w1, w2, w3 },
    },
  };
}

module.exports = { computeDI, normalizeWeather, normalizeTraffic };
