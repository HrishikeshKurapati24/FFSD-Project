'use strict';

const { Queue, Worker } = require('bullmq');
const { getRedisConnection } = require('./redisConnection');
const SubscriptionService = require('../subscription/subscriptionService');

const QUEUE_NAME = 'subscription-management';
const EXPIRY_JOB_NAME = 'check-expired-subscriptions';

let queue = null;
let worker = null;

function getQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;

  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
}

/**
 * Schedules a repeatable job to check for expired subscriptions every hour.
 */
async function scheduleSubscriptionExpiryCheck() {
  const q = getQueue();
  if (!q) {
    console.log('[SubscriptionQueue] Redis not available, skipping BullMQ scheduling');
    return null;
  }

  // Remove existing repeatable jobs with the same name to avoid duplicates
  const repeatableJobs = await q.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === EXPIRY_JOB_NAME) {
      await q.removeRepeatableByKey(job.key);
    }
  }

  console.log('[SubscriptionQueue] Scheduling hourly subscription expiry check…');
  return q.add(EXPIRY_JOB_NAME, {}, {
    repeat: {
      pattern: '0 * * * *', // Every hour at minute 0
    },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}

function startSubscriptionWorker() {
  const connection = getRedisConnection();
  if (!connection || worker) return worker;

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name === EXPIRY_JOB_NAME) {
        console.log('[SubscriptionQueue] Running scheduled expiry check…');
        const count = await SubscriptionService.checkAndExpireSubscriptions();
        return { expiredCount: count };
      }
    },
    {
      connection,
      concurrency: 1,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[SubscriptionQueue] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`[SubscriptionQueue] Job ${job?.id || 'unknown'} failed:`, err.message);
  });

  return worker;
}

module.exports = {
  scheduleSubscriptionExpiryCheck,
  startSubscriptionWorker,
  getQueue,
  QUEUE_NAME,
};
