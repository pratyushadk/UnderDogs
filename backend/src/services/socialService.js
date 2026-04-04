/**
 * Social Disruption Service
 * Fetches social signal data from PredictHQ and NewsAPI.
 * Used in Stage 2 (premium calculation) and Stage 3 (DI enrichment).
 * Per SRS FR-2.2 (S_risk) and FR-3.2.
 *
 * Rate limits:
 *   PredictHQ: 100 req/day free tier → 6-hour cache enforced
 *   NewsAPI:   100 req/day (dev key) → 6-hour cache enforced
 */

const axios = require('axios');

const cache = {};
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Fetch active events from PredictHQ around a location.
 * @param {string} zoneId
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ eventCount: number, highImpactCount: number, sRisk: number }>}
 */
async function fetchPredictHQEvents(zoneId, lat, lon) {
  const cacheKey = `phq_${zoneId}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].fetchedAt < CACHE_TTL_MS) {
    return cache[cacheKey].data;
  }

  try {
    const token = process.env.PREDICTHQ_ACCESS_TOKEN;
    if (!token) throw new Error('PREDICTHQ_ACCESS_TOKEN not set');

    const response = await axios.get('https://api.predicthq.com/v1/events/', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        within: `10km@${lat},${lon}`,
        state: 'active',
        limit: 20,
        sort: 'rank',
      },
      timeout: 8000,
    });

    const events = response.data?.results ?? [];
    const highImpactCount = events.filter(e => (e.rank ?? 0) >= 50).length;
    // Normalize: 0 events → 0.0, 5+ high-impact → 1.0
    const sRisk = Math.min(1.0, highImpactCount / 5);

    const result = { eventCount: events.length, highImpactCount, sRisk };
    cache[cacheKey] = { data: result, fetchedAt: Date.now() };
    return result;
  } catch (err) {
    console.warn(`[Social] PredictHQ error for ${zoneId}: ${err.message}`);
    return cache[cacheKey]?.data ?? { eventCount: 0, highImpactCount: 0, sRisk: 0.1 };
  }
}

/**
 * Fetch local news sentiment for disruption keywords using NewsAPI.
 * @param {string} city
 * @returns {Promise<{ articleCount: number, hasDisruptionKeyword: boolean }>}
 */
async function fetchNewsDisruptionSignal(city = 'Bengaluru') {
  const cacheKey = `news_${city}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].fetchedAt < CACHE_TTL_MS) {
    return cache[cacheKey].data;
  }

  const DISRUPTION_KEYWORDS = ['flood', 'traffic block', 'road closure', 'accident', 'protest', 'shutdown'];

  try {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) throw new Error('NEWSAPI_KEY not set');

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: `${city} (flood OR traffic OR road closure OR accident)`,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
        apiKey,
      },
      timeout: 6000,
    });

    const articles = response.data?.articles ?? [];
    const hasDisruptionKeyword = articles.some(a => {
      const text = ((a.title ?? '') + ' ' + (a.description ?? '')).toLowerCase();
      return DISRUPTION_KEYWORDS.some(kw => text.includes(kw));
    });

    const result = { articleCount: articles.length, hasDisruptionKeyword };
    cache[cacheKey] = { data: result, fetchedAt: Date.now() };
    return result;
  } catch (err) {
    console.warn(`[Social] NewsAPI error for ${city}: ${err.message}`);
    return cache[cacheKey]?.data ?? { articleCount: 0, hasDisruptionKeyword: false };
  }
}

module.exports = { fetchPredictHQEvents, fetchNewsDisruptionSignal };
