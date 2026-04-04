/**
 * Polling Cron Job — 15-Minute Disruption Index Loop
 * SRS FR-3.1: "A node-cron job SHALL execute every 15 minutes"
 * SRS FR-3.2: Concurrent API fetch using Promise.all
 * SRS FR-3.4: DI Computation via Model 3
 * SRS FR-3.5: Threshold breach → trigger settlement pipeline
 * SRS FR-3.6: Persist every DI result to zone_disruption_log
 */

const cron = require('node-cron');
const { getActiveZones, getRidersInZone } = require('../services/postgisService');
const { fetchWeather, fetchNasaEvents, fetchEarthquakes } = require('../services/weatherService');
const { fetchTraffic } = require('../services/trafficService');
const { computeDI, normalizeWeather, normalizeTraffic } = require('../models/disruptionIndex');
const { computeUMin, computeURatio } = require('../models/logThreshold');
const { query } = require('../config/db');
const { triggerSettlement } = require('./settlementPipeline');

let isRunning = false; // Prevent overlapping runs

/**
 * Core polling logic — runs for all active zones.
 */
async function runPollingCycle() {
  if (isRunning) {
    console.log('[Polling] Previous cycle still running — skipping.');
    return;
  }
  isRunning = true;
  const startTime = Date.now();
  console.log(`\n[Polling] Cycle started: ${new Date().toISOString()}`);

  try {
    const zones = await getActiveZones();
    console.log(`[Polling] Processing ${zones.length} active zones...`);

    // Process all zones concurrently (SRS FR-3.2: Promise.all)
    await Promise.all(zones.map(async (zone) => {
      try {
        const { zone_id, centroid_lat, centroid_lon } = zone;

        // Fetch all data concurrently per zone
        const [weather, nasa, usgs, traffic, verifiedReports, activeRiderCount] = await Promise.all([
          fetchWeather(zone_id, centroid_lat, centroid_lon),
          fetchNasaEvents(centroid_lat, centroid_lon),
          fetchEarthquakes(centroid_lat, centroid_lon),
          fetchTraffic(zone_id, centroid_lat, centroid_lon),
          getVerifiedReportCount(zone_id),
          getActiveRiderCount(zone_id),
        ]);

        // Normalize inputs (SRS FR-3.3)
        const iWeather = normalizeWeather({
          precipitationMmPerHr: weather.precipitationMmPerHr,
          isNasaEvent: nasa.isActive,
          nasaSeverity: nasa.severity,
          earthquakeMagnitude: usgs.maxMagnitude,
        });
        const iTraffic = normalizeTraffic(traffic.speedDropPercent);

        // Compute U_ratio for crowdsource component
        const { uMin } = computeUMin(activeRiderCount);
        const uRatio = computeURatio(verifiedReports, uMin);

        // Compute DI (SRS FR-3.4)
        const { di, isTriggered, breakdown } = computeDI(iWeather, iTraffic, uRatio);

        // Persist to zone_disruption_log (SRS FR-3.6)
        await query(
          `INSERT INTO zone_disruption_log (zone_id, di_score, i_weather, i_traffic, u_ratio)
           VALUES ($1, $2, $3, $4, $5)`,
          [zone_id, di, iWeather, iTraffic, uRatio]
        );

        console.log(`  [${zone_id}] DI=${di} | Weather=${iWeather} | Traffic=${iTraffic} | U_ratio=${uRatio}${isTriggered ? ' 🚨 TRIGGERED' : ''}`);

        // Threshold breach → trigger settlement (SRS FR-3.5)
        if (isTriggered) {
          await triggerSettlement(zone_id, di, 'API');
        }
      } catch (err) {
        console.error(`[Polling] Error processing zone ${zone.zone_id}:`, err.message);
      }
    }));

    const elapsed = Date.now() - startTime;
    console.log(`[Polling] Cycle complete in ${elapsed}ms (SRS NFR-1 limit: 30000ms) ${elapsed > 30000 ? '⚠️ SLOW' : '✅'}`);
  } catch (err) {
    console.error('[Polling] Fatal cycle error:', err.message);
  } finally {
    isRunning = false;
  }
}

async function getVerifiedReportCount(zoneId) {
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000); // last 4 hours
  const res = await query(
    `SELECT COUNT(*) AS count FROM crowdsource_reports
     WHERE zone_id = $1 AND verdict = 'APPROVED' AND reported_at > $2`,
    [zoneId, since]
  );
  return parseInt(res.rows[0].count, 10);
}

async function getActiveRiderCount(zoneId) {
  const res = await query(
    `SELECT COUNT(*) AS count FROM active_sessions s
     JOIN policies p ON s.rider_id = p.rider_id
     WHERE p.zone_id = $1 AND p.status = 'ACTIVE'`,
    [zoneId]
  );
  return parseInt(res.rows[0].count, 10);
}

function startPollingJob() {
  const schedule = process.env.CRON_POLLING_SCHEDULE || '*/15 * * * *';
  console.log(`[Cron] Zone polling job scheduled: "${schedule}"`);

  cron.schedule(schedule, runPollingCycle, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  // Run immediately on startup for instant demo feedback
  if (process.env.NODE_ENV === 'development') {
    console.log('[Cron] Running initial polling cycle on startup (dev mode)...');
    setTimeout(runPollingCycle, 3000);
  }
}

module.exports = { startPollingJob, runPollingCycle };
