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

async function seed() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected to Supabase for final seed');

    // 1. Run seed_zones.sql first (if not already done)
    const seedZonesPath = path.join(__dirname, '../database/seed_zones.sql');
    if (fs.existsSync(seedZonesPath)) {
        console.log('Executing seed_zones.sql...');
        const szSql = fs.readFileSync(seedZonesPath, 'utf8');
        await client.query(szSql);
    }

    // 2. Run seed_extended.sql (this contains all 10 zones and 10 riders)
    const seedExtPath = path.join(__dirname, '../database/seed_extended.sql');
    if (fs.existsSync(seedExtPath)) {
        console.log('Executing seed_extended.sql...');
        const seSql = fs.readFileSync(seedExtPath, 'utf8');
        // We run it as one query.
        await client.query(seSql);
    }

    console.log('FINAL MEGA SEED COMPLETED SUCCESSFULLY');
    
    // Verify count
    const res = await client.query('SELECT count(*) FROM zones');
    console.log(`Total zones now in DB: ${res.rows[0].count}`);

  } catch (err) {
    console.error('Mega Seed Failed:', err.message);
  } finally {
    await client.end();
  }
}

seed();
