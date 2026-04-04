const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.bbkawuaywknpmctxsedk',
  password: 'b96b_DiqS-C5geS',
  ssl: { rejectUnauthorized: false }
};

async function cleanSeed() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected to Supabase for CLEAN seed');

    // 1. Truncate all tables to avoid foreign key / duplicate ID conflicts
    console.log('Truncating tables...');
    await client.query('TRUNCATE policies, claims, disruption_events, active_sessions, zone_disruption_log, riders, zones CASCADE');

    // 2. Run init.sql to ensure schema is fresh (extensions etc)
    const initPath = path.join(__dirname, '../database/init.sql');
    const initSql = fs.readFileSync(initPath, 'utf8');
    console.log('Ensuring schema (init.sql)...');
    await client.query(initSql);

    // 3. Run seed_zones.sql (3 zones)
    const seedZonesPath = path.join(__dirname, '../database/seed_zones.sql');
    const szSql = fs.readFileSync(seedZonesPath, 'utf8');
    console.log('Executing seed_zones.sql...');
    await client.query(szSql);

    // 4. Run seed_extended.sql (The full 10 zones and 10 riders)
    const seedExtPath = path.join(__dirname, '../database/seed_extended.sql');
    const seSql = fs.readFileSync(seedExtPath, 'utf8');
    console.log('Executing seed_extended.sql (The Mega Seed)...');
    await client.query(seSql);

    console.log('SUCCESS: All 10 zones and 10 riders are now live in the database.');
    
    // Final check
    const res = await client.query('SELECT count(*) FROM zones');
    console.log(`Total active zones: ${res.rows[0].count}`);

  } catch (err) {
    console.error('Clean Seed Failed:', err.stack);
  } finally {
    await client.end();
  }
}

cleanSeed();
