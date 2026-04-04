/**
 * Model 5: Haversine Velocity Calculator — "The Speed Trap"
 * SRS Section 4.5
 *
 * Detects GPS spoofing by computing the velocity between two consecutive
 * GPS coordinates. If velocity exceeds VELOCITY_LIMIT_KMPH, the system
 * flags the movement as physically impossible in an urban zone.
 *
 * Formula:
 *   d = 2R · arcsin( √[sin²((lat₂-lat₁)/2) + cos(lat₁)·cos(lat₂)·sin²((lon₂-lon₁)/2)] )
 *   velocity (km/h) = d / ((t₂ - t₁) / 3600)
 *
 * Where R = 6371 km (Earth's mean radius)
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate great-circle distance between two GPS coordinates (Haversine formula).
 * @param {number} lat1 - Latitude of point 1 (decimal degrees)
 * @param {number} lon1 - Longitude of point 1 (decimal degrees)
 * @param {number} lat2 - Latitude of point 2 (decimal degrees)
 * @param {number} lon2 - Longitude of point 2 (decimal degrees)
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Compute velocity between two GPS pings.
 * @param {number} lat1 - Previous latitude
 * @param {number} lon1 - Previous longitude
 * @param {number} ts1  - Previous Unix timestamp (seconds)
 * @param {number} lat2 - Current latitude
 * @param {number} lon2 - Current longitude
 * @param {number} ts2  - Current Unix timestamp (seconds)
 * @returns {{ distanceKm: number, velocityKmph: number, elapsedSeconds: number }}
 */
function computeVelocity(lat1, lon1, ts1, lat2, lon2, ts2) {
  const distanceKm = haversineDistance(lat1, lon1, lat2, lon2);
  const elapsedSeconds = ts2 - ts1;

  if (elapsedSeconds <= 0) {
    return { distanceKm, velocityKmph: Infinity, elapsedSeconds };
  }

  const velocityKmph = distanceKm / (elapsedSeconds / 3600);
  return { distanceKm, velocityKmph, elapsedSeconds };
}

/**
 * Evaluate whether a GPS ping violates the velocity threshold.
 * @param {number} lat1 - Previous latitude
 * @param {number} lon1 - Previous longitude
 * @param {number} ts1  - Previous Unix timestamp (seconds)
 * @param {number} lat2 - Current latitude
 * @param {number} lon2 - Current longitude
 * @param {number} ts2  - Current Unix timestamp (seconds)
 * @param {number} [limitKmph=80] - Max allowable velocity
 * @returns {{ isViolation: boolean, velocityKmph: number, distanceKm: number }}
 */
function checkSpeedTrap(lat1, lon1, ts1, lat2, lon2, ts2, limitKmph = 80) {
  const limit = parseFloat(process.env.VELOCITY_LIMIT_KMPH) || limitKmph;
  const { distanceKm, velocityKmph, elapsedSeconds } = computeVelocity(
    lat1, lon1, ts1, lat2, lon2, ts2
  );

  return {
    isViolation: velocityKmph > limit,
    velocityKmph: Math.round(velocityKmph * 100) / 100,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    elapsedSeconds,
    limitKmph: limit,
  };
}

module.exports = { haversineDistance, computeVelocity, checkSpeedTrap };
