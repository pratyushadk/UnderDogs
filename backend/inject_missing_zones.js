const { Client } = require('pg');

const config = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.bbkawuaywknpmctxsedk',
  password: 'b96b_DiqS-C5geS',
  ssl: { rejectUnauthorized: false }
};

const ZONES = [
  ['Zone_Marathahalli',    'Bengaluru', '{"type":"Polygon","coordinates":[[[77.6956,12.9566],[77.7120,12.9566],[77.7120,12.9430],[77.6956,12.9430],[77.6956,12.9566]]]}', 1.30],
  ['Zone_Electronic_City', 'Bengaluru', '{"type":"Polygon","coordinates":[[[77.6567,12.8452],[77.6720,12.8452],[77.6720,12.8308],[77.6567,12.8308],[77.6567,12.8452]]]}', 1.25],
  ['Zone_HSR_Layout',      'Bengaluru', '{"type":"Polygon","coordinates":[[[77.6317,12.9116],[77.6478,12.9116],[77.6478,12.8972],[77.6317,12.8972],[77.6317,12.9116]]]}', 1.10],
  ['Zone_BTM_Layout',      'Bengaluru', '{"type":"Polygon","coordinates":[[[77.6076,12.9170],[77.6237,12.9170],[77.6237,12.9041],[77.6076,12.9041],[77.6076,12.9170]]]}', 1.05],
  ['Zone_Jayanagar',       'Bengaluru', '{"type":"Polygon","coordinates":[[[77.5818,12.9305],[77.5978,12.9305],[77.5978,12.9172],[77.5818,12.9172],[77.5818,12.9305]]]}', 1.00],
  ['Zone_Yelahanka',       'Bengaluru', '{"type":"Polygon","coordinates":[[[77.5838,13.1005],[77.6010,13.1005],[77.6010,13.0855],[77.5838,13.0855],[77.5838,13.1005]]]}', 1.15],
  ['Zone_Bannerghatta',    'Bengaluru', '{"type":"Polygon","coordinates":[[[77.5968,12.8735],[77.6120,12.8735],[77.6120,12.8585],[77.5968,12.8585],[77.5968,12.8735]]]}', 1.20]
];

async function inject() {
  const client = new Client(config);
  try {
    await client.connect();
    for (const [id, city, geom, risk] of ZONES) {
      await client.query(
        'INSERT INTO zones (zone_id, city, geom, risk_multiplier) VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), $4) ON CONFLICT DO NOTHING',
        [id, city, geom, risk]
      );
      console.log(`Zone ${id} injected.`);
    }
    const res = await client.query('SELECT count(*) FROM zones');
    console.log(`TOTAL ZONES: ${res.rows[0].count}`);
  } catch (err) {
    console.error('Injection failed:', err.message);
  } finally {
    await client.end();
  }
}

inject();
