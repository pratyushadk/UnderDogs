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

async function init() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected to Supabase');

    const sqlPath = path.join(__dirname, '../database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing full init.sql...');
    await client.query(sql);
    console.log('Database initialized successfully.');

    const seedZonesPath = path.join(__dirname, '../database/seed_zones.sql');
    const seedZonesSql = fs.readFileSync(seedZonesPath, 'utf8');
    console.log('Executing seed_zones.sql...');
    await client.query(seedZonesSql);
    console.log('Zones seeded successfully.');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

init();
