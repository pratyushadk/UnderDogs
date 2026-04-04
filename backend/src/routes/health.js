/**
 * Health check route — GET /health
 * Returns service status, DB connectivity, and cron job states.
 * Used for deployment readiness checks and hackathon demo verification.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

router.get('/', async (_req, res) => {
  let dbStatus = 'disconnected';
  let dbTime = null;

  try {
    const result = await query('SELECT NOW() AS time');
    dbStatus = 'connected';
    dbTime = result.rows[0].time;
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    service: 'WorkSafe API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      serverTime: dbTime,
      host: process.env.DB_HOST,
      name: process.env.DB_NAME,
    },
    config: {
      diThreshold: process.env.DI_THRESHOLD,
      velocityLimitKmph: process.env.VELOCITY_LIMIT_KMPH,
      cRatio: process.env.C_RATIO,
    },
  });
});

module.exports = router;
