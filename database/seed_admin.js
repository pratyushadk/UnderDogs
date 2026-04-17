/**
 * Admin Seed Script
 * Run once to create the first admin account.
 * Usage: node database/seed_admin.js
 * 
 * The script will:
 *   1. Create a user with role = 'ADMIN'
 *   2. Print the credentials to console
 *
 * DEFAULT CREDENTIALS (change before production!):
 *   Email:    admin@worksafe.in
 *   Password: WorkSafe@Admin2026
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const ADMIN_EMAIL    = 'admin@worksafe.in';
const ADMIN_PASSWORD = 'WorkSafe@Admin2026';
const ADMIN_NAME     = 'WorkSafe Admin';

async function seedAdmin() {
  const client = new Client({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existing = await client.query(
      'SELECT user_id FROM users WHERE email = $1 AND role = $2',
      [ADMIN_EMAIL, 'ADMIN']
    );
    if (existing.rows.length > 0) {
      console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
      console.log('   To reset password, run: UPDATE users SET password_hash = ... WHERE email = \'admin@worksafe.in\'');
      return;
    }

    // Hash password
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const userId = uuidv4();

    await client.query(
      `INSERT INTO users (user_id, name, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, 'ADMIN', true)`,
      [userId, ADMIN_NAME, ADMIN_EMAIL, hash]
    );

    console.log('\n🎉 Admin account created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email    : ${ADMIN_EMAIL}`);
    console.log(`  Password : ${ADMIN_PASSWORD}`);
    console.log(`  Role     : ADMIN`);
    console.log(`  Login at : http://localhost:5173/admin/login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  Change the password in production!');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedAdmin();
