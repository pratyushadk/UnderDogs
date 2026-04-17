/**
 * User Authentication Middleware
 * Verifies JWTs issued by /auth/signup and /auth/login.
 * Attaches req.user = { user_id, role } to the request.
 *
 * NOTE: Separate from existing authenticate() middleware which reads
 * { rider_id, platform_rider_id } — both coexist without conflict.
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT and attach req.user.
 * Returns 401 if missing/invalid/expired.
 */
function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Accept both new user tokens { user_id, role } and legacy rider tokens { rider_id }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired — please log in again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Role guard — must be used AFTER authenticateUser.
 * Returns 403 if user is not ADMIN.
 */
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateUser, authorizeAdmin };
