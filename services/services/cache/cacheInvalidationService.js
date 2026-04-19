'use strict';

const cache = require('./redisCacheService');

async function invalidateDashboardCaches() {
  return cache.delByPattern('dashboard:*');
}

async function invalidateExploreCaches() {
  return cache.delByPattern('explore:*');
}

async function invalidateRankingsCaches() {
  return cache.delByPattern('rankings:*');
}

async function invalidateSearchCaches() {
  return cache.delByPattern('search:*');
}

async function invalidateStatsCaches() {
  const targets = await Promise.all([
    cache.delByPattern('stats:*'),
    cache.delByPattern('dashboard:*'),
    cache.delByPattern('rankings:*'),
  ]);
  return targets.reduce((sum, n) => sum + n, 0);
}

module.exports = {
  invalidateDashboardCaches,
  invalidateExploreCaches,
  invalidateRankingsCaches,
  invalidateSearchCaches,
  invalidateStatsCaches,
};

