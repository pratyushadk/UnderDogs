/**
 * Environment variable validator — fails fast at startup if required vars are missing.
 * Per SRS NFR-8: no secret shall be hardcoded or silently missing.
 */

const REQUIRED_VARS = [
  'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'PORT', 'JWT_SECRET',
  'OPENWEATHERMAP_API_KEY',
  'TOMORROW_IO_API_KEY',
  'TOMTOM_API_KEY',
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET',
  'MOCK_PARTNER_API_URL', 'MOCK_PARTNER_API_SECRET',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('   → Check your .env file and restart.');
    process.exit(1);
  }
  console.log('✅ Environment variables validated.');
}

module.exports = { validateEnv };
