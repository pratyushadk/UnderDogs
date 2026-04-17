/**
 * JWT Authentication Middleware
 * Validates Bearer tokens on all protected routes.
 * Per SRS NFR-7: missing/invalid/expired tokens → HTTP 401.
 *
 * NOTE: In the hackathon demo, the JWT is issued by the mock partner API
 * using the same JWT_SECRET. In production, it would be validated via
 * the delivery platform's auth server.
 */

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.rider = { ...decoded };

    // New-style user JWT: needs rider_id looked up from DB
    if (decoded.user_id && !decoded.rider_id) {
      const { query } = require('../config/db');
      (async () => {
        try {
          const resDB = await query(
            `SELECT r.rider_id, p.zone_id
             FROM riders r
             LEFT JOIN policies p ON p.rider_id = r.rider_id AND p.status = 'ACTIVE'
             WHERE r.user_id = $1
             LIMIT 1`,
            [decoded.user_id]
          );
          if (resDB.rows.length) {
            req.rider.rider_id = resDB.rows[0].rider_id;
            req.rider.zone_id  = resDB.rows[0].zone_id;
          }
          next();
        } catch (e) {
          next(e);
        }
      })();
    } else {
      next();
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Internal service authentication middleware.
 * Used on routes called by the mock partner API server.
 */
function authenticateInternal(req, res, next) {
  const secret = req.headers['x-internal-token'];
  if (secret !== process.env.MOCK_PARTNER_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized internal call' });
  }
  next();
}

module.exports = { authenticate, authenticateInternal };
