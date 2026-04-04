/**
 * WorkSafe Backend — Express.js Entry Point
 * Startup sequence: validate env → connect DB → mount routes → start cron → listen
 */

// ── Global error capture (must be first) ──────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION]', reason?.message || reason, reason?.stack || '');
});
process.on('uncaughtException', (err) => {
  console.error('❌ [UNCAUGHT EXCEPTION]', err.message, err.stack);
  process.exit(1);
});

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');

// ── Internal modules ──────────────────────────────────────────
const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/validateEnv');

// ── Routes ────────────────────────────────────────────────────
const onboardingRouter = require('./routes/onboarding');
const reportsRouter    = require('./routes/reports');
const claimsRouter     = require('./routes/claims');
const zonesRouter      = require('./routes/zones');
const healthRouter     = require('./routes/health');

// ── Cron Jobs ─────────────────────────────────────────────────
const { startPremiumJob }  = require('./cron/premiumJob');
const { startPollingJob }  = require('./cron/pollingJob');

// ─────────────────────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────────────────────
async function bootstrap() {
  // 1. Validate all required environment variables before anything else
  validateEnv();

  // 2. Connect to PostgreSQL (fails fast if DB is unreachable)
  await connectDB();

  const app = express();

  // 3. Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // 10MB to accommodate base64 images
  app.use(express.urlencoded({ extended: true }));

  // 4. Request logger (dev only)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // 5. Mount routes
  app.use('/health',         healthRouter);
  app.use('/api/onboarding', onboardingRouter);
  app.use('/api/reports',    reportsRouter);
  app.use('/api/claims',     claimsRouter);
  app.use('/api/zones',      zonesRouter);

  // 6. 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // 7. Global error handler
  app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.message, err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  // 8. Start cron jobs
  startPremiumJob();
  startPollingJob();

  // 9. Listen
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ WorkSafe API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   DB: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Fatal startup error:', err.message);
  process.exit(1);
});
