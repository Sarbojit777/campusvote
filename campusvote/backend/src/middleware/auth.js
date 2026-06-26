const jwt = require('jsonwebtoken');

function authenticateStudent(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'No token provided', code: 'UNAUTHORIZED' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (payload.role !== 'student') {
      return res.status(403).json({ error: true, message: 'Student access required', code: 'FORBIDDEN' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: true, message: 'Invalid or expired token', code: 'TOKEN_INVALID' });
  }
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'No token provided', code: 'UNAUTHORIZED' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: true, message: 'Admin access required', code: 'FORBIDDEN' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: true, message: 'Invalid or expired token', code: 'TOKEN_INVALID' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (!req.admin?.isSuperAdmin) {
    return res.status(403).json({ error: true, message: 'Super admin access required', code: 'FORBIDDEN' });
  }
  next();
}

module.exports = { authenticateStudent, authenticateAdmin, requireSuperAdmin };
