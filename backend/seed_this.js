require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
const bcrypt     = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
});

async function run() {
  await client.connect();

  const existing = await client.query(
    "SELECT user_id FROM users WHERE email = 'admin@worksafe.in'"
  );

  if (existing.rows.length > 0) {
    console.log('Admin already exists! Login: admin@worksafe.in / WorkSafe@Admin2026');
    return;
  }

  const hash = await bcrypt.hash('WorkSafe@Admin2026', 12);
  await client.query(
    "INSERT INTO users (user_id, name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, 'ADMIN', true)",
    [uuidv4(), 'WorkSafe Admin', 'admin@worksafe.in', hash]
  );

  console.log('');
  console.log('Admin created successfully!');
  console.log('  Email:    admin@worksafe.in');
  console.log('  Password: WorkSafe@Admin2026');
  console.log('  Login at: http://localhost:3000/admin/login');
}

run().catch(e => console.error('FAILED:', e.message)).finally(() => client.end());
