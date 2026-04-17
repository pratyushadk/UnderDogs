/**
 * Notification Routes
 *
 * GET  /api/notifications          — fetch unread + recent (last 30)
 * PUT  /api/notifications/:id/read — mark single notification as read
 * PUT  /api/notifications/read-all — mark all as read
 */

const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { authenticateUser } = require('../middleware/authUser');

// ─────────────────────────────────────────────────────────────
// GET /api/notifications
// Returns unread count + last 30 notifications
// ─────────────────────────────────────────────────────────────
router.get('/', authenticateUser, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const result = await query(
      `SELECT notif_id, type, title, body, is_read, metadata, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );

    const unreadCount = result.rows.filter(n => !n.is_read).length;

    return res.json({
      notifications: result.rows,
      unread_count:  unreadCount,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/notifications/:id/read
// ─────────────────────────────────────────────────────────────
router.put('/:id/read', authenticateUser, async (req, res) => {
  const userId  = req.user.user_id;
  const notifId = req.params.id;
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE notif_id = $1 AND user_id = $2',
      [notifId, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/notifications/read-all
// ─────────────────────────────────────────────────────────────
router.put('/read-all', authenticateUser, async (req, res) => {
  const userId = req.user.user_id;
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
