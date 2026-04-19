'use strict';

const jwt = require('jsonwebtoken');
const { Admin } = require('../mongoDB');

const ADMIN_NAMESPACE = '/admin';
const ADMIN_EVENTS = {
  CONNECTED: 'admin:connected',
  CAMPAIGN_UPDATE: 'admin:campaign:update',
  REVENUE_UPDATE: 'admin:revenue:update',
  ORDER_UPDATE: 'admin:order:update',
  METRICS_UPDATE: 'admin:metrics:update',
};

const VALID_ADMIN_ROLES = new Set(['superadmin', 'community', 'finance', 'analyst']);

function parseCookieHeader(cookieHeader = '') {
  const cookies = {};
  const parts = cookieHeader.split(';');

  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rawValue.join('=') || '');
  }

  return cookies;
}

function extractBearerFromAuthHeader(authHeader = '') {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const lower = authHeader.toLowerCase();
  if (!lower.startsWith('bearer ')) return null;
  return authHeader.slice(7).trim();
}

function extractToken(socket) {
  const fromAuthObject = socket.handshake?.auth?.token;
  if (typeof fromAuthObject === 'string' && fromAuthObject.trim()) {
    return fromAuthObject.replace(/^Bearer\s+/i, '').trim();
  }

  const authHeader = socket.handshake?.headers?.authorization;
  const bearerToken = extractBearerFromAuthHeader(authHeader);
  if (bearerToken) return bearerToken;

  const cookieHeader = socket.handshake?.headers?.cookie || '';
  const cookies = parseCookieHeader(cookieHeader);
  if (cookies.adminToken) return cookies.adminToken;

  return null;
}

async function adminSocketAuth(socket, next) {
  try {
    const token = extractToken(socket);
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.userType !== 'admin' || !decoded.role) {
      return next(new Error('Invalid admin token'));
    }

    if (!VALID_ADMIN_ROLES.has(decoded.role)) {
      return next(new Error('Unauthorized admin role'));
    }

    const adminUser = await Admin.findOne({ userId: decoded.userId }).select('userId username role').lean();
    if (!adminUser || !VALID_ADMIN_ROLES.has(adminUser.role)) {
      return next(new Error('Admin user not found or unauthorized'));
    }

    socket.data.admin = {
      userId: adminUser.userId,
      username: adminUser.username,
      role: adminUser.role,
    };

    return next();
  } catch (err) {
    return next(new Error('Authentication failed'));
  }
}

function initAdminNamespace(io) {
  const adminNamespace = io.of(ADMIN_NAMESPACE);
  adminNamespace.use(adminSocketAuth);

  adminNamespace.on('connection', (socket) => {
    socket.emit(ADMIN_EVENTS.CONNECTED, {
      ok: true,
      namespace: ADMIN_NAMESPACE,
      role: socket.data?.admin?.role || null,
      connectedAt: new Date().toISOString(),
    });
  });

  return adminNamespace;
}

module.exports = {
  initAdminNamespace,
  ADMIN_NAMESPACE,
  ADMIN_EVENTS,
};

