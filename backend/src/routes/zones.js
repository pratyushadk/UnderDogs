/**
 * Zones Route — GET /api/zones
 * Returns all zones with their latest DI score for the frontend map.
 */
const { Router } = require('express');
const { query }  = require('../config/db');

const router = Router();

// GET /api/zones — all zones + latest DI log entry each
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        z.zone_id,
        z.city,
        z.risk_multiplier,
        ST_AsGeoJSON(z.geom)::json AS geom,
        COALESCE(
          (SELECT di_score FROM zone_disruption_log
           WHERE zone_id = z.zone_id
           ORDER BY computed_at DESC LIMIT 1), 0
        ) AS current_di,
        COALESCE(
          (SELECT i_traffic FROM zone_disruption_log
           WHERE zone_id = z.zone_id
           ORDER BY computed_at DESC LIMIT 1), 0
        ) AS current_traffic,
        COALESCE(
          (SELECT i_weather FROM zone_disruption_log
           WHERE zone_id = z.zone_id
           ORDER BY computed_at DESC LIMIT 1), 0
        ) AS current_weather
      FROM zones z
      ORDER BY z.zone_id
    `);
    res.json(rows);
  } catch (err) {
    console.error('[Zones]', err.message);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

module.exports = router;
