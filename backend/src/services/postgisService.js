/**
 * PostGIS Spatial Service
 * All spatial database operations for zone management and rider geofencing.
 * Per SRS FR-4A.1: ST_Contains query to identify qualifying rider cohort.
 * Per SRS NFR-5: Queries must complete in <100ms for 10,000 active sessions.
 */

const { query } = require('../config/db');

/**
 * Get all active zones for polling.
 * @returns {Promise<Array<{ zone_id, city, risk_multiplier, centroid_lat, centroid_lon }>>}
 */
async function getActiveZones() {
  const sql = `
    SELECT
      zone_id,
      city,
      risk_multiplier,
      ST_Y(ST_Centroid(geom)) AS centroid_lat,
      ST_X(ST_Centroid(geom)) AS centroid_lon
    FROM zones
    ORDER BY zone_id
  `;
  const result = await query(sql);
  return result.rows;
}

/**
 * Find all active-policy riders currently inside a given zone polygon.
 * Implements the exact ST_Contains cohort query from SRS FR-4A.1.
 *
 * @param {string} zoneId
 * @returns {Promise<Array<{ rider_id, policy_id, e_avg, shift_pattern }>>}
 */
async function getRidersInZone(zoneId) {
  const sql = `
    SELECT
      r.rider_id,
      p.policy_id,
      r.e_avg,
      r.shift_pattern
    FROM active_sessions s
    JOIN policies p ON s.rider_id = p.rider_id
    JOIN riders   r ON r.rider_id = s.rider_id
    WHERE ST_Contains(
      (SELECT geom FROM zones WHERE zone_id = $1),
      ST_SetSRID(ST_MakePoint(s.current_longitude, s.current_latitude), 4326)
    )
    AND p.status = 'ACTIVE'
    AND p.zone_id = $1
  `;
  const result = await query(sql, [zoneId]);
  return result.rows;
}

/**
 * Count active riders inside a zone (for U_min calculation — Model 2).
 * @param {string} zoneId
 * @returns {Promise<number>}
 */
async function countActiveRidersInZone(zoneId) {
  const sql = `
    SELECT COUNT(*) AS count
    FROM active_sessions s
    JOIN policies p ON s.rider_id = p.rider_id
    WHERE ST_Contains(
      (SELECT geom FROM zones WHERE zone_id = $1),
      ST_SetSRID(ST_MakePoint(s.current_longitude, s.current_latitude), 4326)
    )
    AND p.status = 'ACTIVE'
    AND p.zone_id = $1
  `;
  const result = await query(sql, [zoneId]);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Determine which zone a GPS coordinate falls inside (for onboarding).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string|null>} zone_id or null if outside all zones
 */
async function getZoneForCoordinate(lat, lon) {
  const sql = `
    SELECT zone_id
    FROM zones
    WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326))
    LIMIT 1
  `;
  const result = await query(sql, [lat, lon]);
  return result.rows[0]?.zone_id ?? null;
}

/**
 * Upsert a rider's active session (GPS ping).
 * @param {string} riderId
 * @param {number} lat
 * @param {number} lon
 */
async function upsertActiveSession(riderId, lat, lon) {
  const sql = `
    INSERT INTO active_sessions (rider_id, current_latitude, current_longitude, last_seen_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (rider_id) DO UPDATE SET
      current_latitude  = EXCLUDED.current_latitude,
      current_longitude = EXCLUDED.current_longitude,
      last_seen_at      = NOW()
  `;
  await query(sql, [riderId, lat, lon]);
}

module.exports = {
  getActiveZones,
  getRidersInZone,
  countActiveRidersInZone,
  getZoneForCoordinate,
  upsertActiveSession,
};
