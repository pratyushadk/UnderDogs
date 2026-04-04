/**
 * PostgreSQL connection pool — shared across all backend modules
 * Uses pg-pool with environment-driven configuration
 */

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'worksafe_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
  max:      20,          // max connections in pool (SRS NFR-5)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected client error:', err.message);
});

/**
 * Verify DB connectivity at startup.
 * Throws on failure so bootstrap() catches it and exits cleanly.
 */
async function connectDB() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT NOW() AS time, version() AS pg_version');
    console.log(`✅ PostgreSQL connected — ${rows[0].pg_version.split(',')[0]}`);
    console.log(`   Server time: ${rows[0].time}`);
  } finally {
    client.release();
  }
}

/**
 * Execute a parameterized query.
 * All queries MUST go through this — no string interpolation (SRS NFR-11).
 * @param {string} text - SQL with $1, $2 placeholders
 * @param {Array}  params - Bound parameter values
 */
async function query(text, params = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`[DB] Slow query (${duration}ms):\n  ${text.substring(0, 120)}`);
  }
  return result;
}

module.exports = { pool, connectDB, query };
