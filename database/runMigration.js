/**
 * WorkSafe DB Migration Runner
 * Usage:  node runMigration.js v2
 *         node runMigration.js v3
 */
require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node runMigration.js v3');
  process.exit(1);
}

const sqlFile = path.join(__dirname, `migrate_${version}.sql`);
if (!fs.existsSync(sqlFile)) {
  console.error(`Migration file not found: ${sqlFile}`);
  process.exit(1);
}

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
});

const sql = fs.readFileSync(sqlFile, 'utf8');

console.log(`▶  Running migration ${version}...`);
pool.query(sql)
  .then(result => {
    const rows = Array.isArray(result) ? result.flatMap(r => r.rows) : (result.rows || []);
    console.log('✅ Migration done!');
    if (rows.length) console.log('Columns verified:', rows.map(r => r.column_name).join(', '));
    pool.end();
  })
  .catch(err => {
    console.error('❌ Migration FAILED:', err.message);
    pool.end();
    process.exit(1);
  });
