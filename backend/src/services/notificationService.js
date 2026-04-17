/**
 * Notification Service
 * Shared helper — call from any route/cron that generates user-facing events.
 * Inserts a row into the notifications table.
 * Does NOT throw — failure to notify must never break the main flow.
 */

const { query } = require('../config/db');

/**
 * Create a notification for a user.
 * @param {string} userId     - UUID from users table
 * @param {string} type       - notif_type ENUM value
 * @param {string} title      - Short notification title
 * @param {string} body       - Notification body text
 * @param {object} [metadata] - Optional JSON payload (e.g. { zone_id, payout_amount })
 */
async function createNotification(userId, type, title, body, metadata = {}) {
  if (!userId) return; // Don't fail if no user is associated
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(metadata)]
    );
  } catch (err) {
    // Log but never surface to caller
    console.error('[NotificationService] Failed to create notification:', err.message);
  }
}

/**
 * Look up user_id from rider_id (needed when settlement pipeline triggers).
 * Returns null if rider has no associated user account (demo riders).
 */
async function getUserIdForRider(riderId) {
  try {
    const result = await query(
      'SELECT user_id FROM riders WHERE rider_id = $1 LIMIT 1',
      [riderId]
    );
    return result.rows[0]?.user_id || null;
  } catch {
    return null;
  }
}

module.exports = { createNotification, getUserIdForRider };
