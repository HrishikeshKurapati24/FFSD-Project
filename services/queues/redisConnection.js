'use strict';

const IORedis = require('ioredis');

let redisConnection = null;

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  if (!redisConnection) {
    const isTLS = redisUrl.startsWith('rediss://');
    redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      ...(isTLS && { tls: { rejectUnauthorized: false } })
    });
  }

  return redisConnection;
}

module.exports = {
  getRedisConnection,
};

