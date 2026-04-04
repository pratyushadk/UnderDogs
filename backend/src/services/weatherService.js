/**
 * Weather Service
 * Fetches current weather data from OpenWeatherMap for a given zone centroid.
 * Used in the 15-minute polling loop (Stage 3, FR-3.2).
 *
 * Fallback: If API is unavailable (timeout > 5s), returns cached value.
 * Rate limit: 60 req/min on free tier — safe for up to 3 zones per poll.
 */

const axios = require('axios');

// Simple in-memory cache: { zoneId → { data, fetchedAt } }
const cache = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetch current weather for a lat/lon coordinate.
 * @param {string} zoneId
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ precipitationMmPerHr: number, windSpeedKmph: number, description: string, raw: object }>}
 */
async function fetchWeather(zoneId, lat, lon) {
  // Check cache first
  if (cache[zoneId] && Date.now() - cache[zoneId].fetchedAt < CACHE_TTL_MS) {
    console.log(`[Weather] Cache hit for ${zoneId}`);
    return cache[zoneId].data;
  }

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHERMAP_API_KEY,
        units: 'metric',
      },
      timeout: 5000,
    });

    const d = response.data;
    const precipitationMmPerHr = d.rain?.['1h'] ?? 0;
    const windSpeedKmph = (d.wind?.speed ?? 0) * 3.6; // m/s → km/h

    const result = {
      precipitationMmPerHr,
      windSpeedKmph,
      description: d.weather?.[0]?.description ?? 'unknown',
      alerts: [],
      raw: d,
    };

    cache[zoneId] = { data: result, fetchedAt: Date.now() };
    return result;
  } catch (err) {
    console.warn(`[Weather] API error for ${zoneId}: ${err.message} — using cache or zero`);
    return cache[zoneId]?.data ?? { precipitationMmPerHr: 0, windSpeedKmph: 0, description: 'unavailable', alerts: [] };
  }
}

/**
 * Fetch NASA EONET active events and check if any intersect a bounding box.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [radiusDeg=0.2]
 * @returns {Promise<{ isActive: boolean, severity: string, eventTitle: string|null }>}
 */
async function fetchNasaEvents(lat, lon, radiusDeg = 0.2) {
  try {
    const response = await axios.get(`${process.env.NASA_EONET_BASE_URL}`, {
      params: { status: 'open', limit: 50 },
      timeout: 5000,
    });

    const events = response.data.events ?? [];
    const nearby = events.filter((ev) => {
      const coords = ev.geometry?.[0]?.coordinates;
      if (!coords) return false;
      const [eLon, eLat] = coords;
      return Math.abs(eLat - lat) < radiusDeg && Math.abs(eLon - lon) < radiusDeg;
    });

    if (nearby.length === 0) return { isActive: false, severity: 'none', eventTitle: null };

    return { isActive: true, severity: 'medium', eventTitle: nearby[0].title };
  } catch (err) {
    console.warn(`[NASA EONET] API error: ${err.message}`);
    return { isActive: false, severity: 'none', eventTitle: null };
  }
}

/**
 * Fetch USGS earthquake data for a location.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [radiusKm=50]
 * @returns {Promise<{ maxMagnitude: number, count: number }>}
 */
async function fetchEarthquakes(lat, lon, radiusKm = 50) {
  try {
    const response = await axios.get(`${process.env.USGS_BASE_URL}`, {
      params: {
        format: 'geojson',
        latitude: lat,
        longitude: lon,
        maxradiuskm: radiusKm,
        minmagnitude: 2.0,
        orderby: 'magnitude',
        limit: 5,
      },
      timeout: 5000,
    });

    const features = response.data.features ?? [];
    const maxMagnitude = features[0]?.properties?.mag ?? 0;
    return { maxMagnitude, count: features.length };
  } catch (err) {
    console.warn(`[USGS] API error: ${err.message}`);
    return { maxMagnitude: 0, count: 0 };
  }
}

module.exports = { fetchWeather, fetchNasaEvents, fetchEarthquakes };
