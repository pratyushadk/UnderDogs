/**
 * Traffic Service
 * Fetches real-time traffic congestion from TomTom Traffic API.
 * Used in 15-minute polling loop (Stage 3, FR-3.2).
 *
 * Rate limit: 250 req/day on free tier.
 * Fallback: Interpolate from previous call or return 0.
 */

const axios = require('axios');

const cache = {};
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Fetch TomTom flow segment data for a zone centroid.
 * Returns a speed drop percentage (0–100%) as a normalized traffic disruption score.
 *
 * @param {string} zoneId
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ speedDropPercent: number, currentSpeedKmph: number, freeFlowKmph: number }>}
 */
async function fetchTraffic(zoneId, lat, lon) {
  if (cache[zoneId] && Date.now() - cache[zoneId].fetchedAt < CACHE_TTL_MS) {
    console.log(`[Traffic] Cache hit for ${zoneId}`);
    return cache[zoneId].data;
  }

  try {
    const response = await axios.get(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json`,
      {
        params: {
          key: process.env.TOMTOM_API_KEY,
          point: `${lat},${lon}`,
        },
        timeout: 5000,
      }
    );

    const flow = response.data.flowSegmentData;
    const currentSpeedKmph = flow?.currentSpeed ?? 0;
    const freeFlowKmph     = flow?.freeFlowSpeed ?? 1;
    const speedDropPercent = Math.max(0, Math.round(((freeFlowKmph - currentSpeedKmph) / freeFlowKmph) * 100));

    const result = { speedDropPercent, currentSpeedKmph, freeFlowKmph };
    cache[zoneId] = { data: result, fetchedAt: Date.now() };
    return result;
  } catch (err) {
    console.warn(`[Traffic] TomTom API error for ${zoneId}: ${err.message} — using cache or zero`);
    return cache[zoneId]?.data ?? { speedDropPercent: 0, currentSpeedKmph: 0, freeFlowKmph: 0 };
  }
}

module.exports = { fetchTraffic };
