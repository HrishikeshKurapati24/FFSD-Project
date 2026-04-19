'use strict';

const crypto = require('crypto');
const cache = require('../services/cache/redisCacheService');

function buildScope(req, scope) {
  if (scope === 'public') return 'public';

  const sessionUser = req.session?.user;
  if (sessionUser?.id) return `${sessionUser.userType || 'session'}:${sessionUser.id}`;

  const authUser = req.user;
  if (authUser?.id) return `${authUser.userType || 'auth'}:${authUser.id}`;

  return 'anon';
}

function hashObject(obj) {
  const src = JSON.stringify(obj || {});
  return crypto.createHash('sha1').update(src).digest('hex');
}

function routeCache(options = {}) {
  const {
    namespace = 'misc',
    ttlSeconds = 120,
    scope = 'user',
  } = options;

  return async function cacheMiddleware(req, res, next) {
    if (req.method !== 'GET') return next();

    const redisClient = cache.getClient();
    if (!redisClient) return next();

    const bypass = String(req.query?.cache || '').toLowerCase() === 'false'
      || String(req.headers['x-cache-bypass'] || '').toLowerCase() === 'true';
    if (bypass) return next();

    const scoped = buildScope(req, scope);
    const queryHash = hashObject(req.query || {});
    const key = `${namespace}:${scoped}:${req.baseUrl}${req.path}:${queryHash}`;

    try {
      const cached = await cache.getJSON(key);
      if (cached) {
        res.setHeader('x-cache', 'HIT');
        return res.status(cached.statusCode || 200).json(cached.payload);
      }
    } catch (_) {
      // Fallback to normal response flow.
    }

    const originalJson = res.json.bind(res);
    res.json = async (payload) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await cache.setJSON(key, {
            statusCode: res.statusCode,
            payload,
            cachedAt: new Date().toISOString(),
          }, ttlSeconds);
          res.setHeader('x-cache', 'MISS');
        }
      } catch (_) {
        // Ignore cache set failures.
      }
      return originalJson(payload);
    };

    return next();
  };
}

module.exports = {
  routeCache,
};

