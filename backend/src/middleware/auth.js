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
    req.rider = decoded; // { rider_id, platform_rider_id, iat, exp }
    next();
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
