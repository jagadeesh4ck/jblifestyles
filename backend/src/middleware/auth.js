const jwt = require('jsonwebtoken');
const { pool } = require('../db/helpers');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

async function optionalAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // attach minimal user object
      req.user = { id: payload.sub, role: payload.role };
    } catch (err) {
      // invalid token - ignore for optional
    }
  }
  return next();
}

function ensureAuthenticated(req, res, next) {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  return next();
}

function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  return next();
}

module.exports = { optionalAuth, ensureAuthenticated, ensureAdmin, JWT_SECRET };