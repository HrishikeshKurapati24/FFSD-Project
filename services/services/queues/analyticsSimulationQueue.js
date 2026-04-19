'use strict';

const { Queue, Worker } = require('bullmq');
const { getRedisConnection } = require('./redisConnection');
const AnalyticsSimulationService = require('../analytics/analyticsSimulationService');

const QUEUE_NAME = 'analytics-simulation';
const JOB_NAME = 'run-simulation-cycle';

let queue = null;
let worker = null;
let processing = false;

function getQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;

  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection });
  }
  return queue;
}

async function enqueueSimulationJob(payload = {}) {
  const q = getQueue();
  if (!q) return null;

  return q.add(JOB_NAME, payload, {
    attempts: 3,
    removeOnComplete: 50,
    removeOnFail: 100,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}

function startAnalyticsSimulationWorker() {
  const connection = getRedisConnection();
  if (!connection || worker) return worker;

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (processing) return { skipped: true, reason: 'already-processing' };
      processing = true;
      // Forward the trigger label supplied by the scheduler (e.g. 'catchup', 'interval').
      const trigger = job?.data?.trigger || 'manual';
      try {
        return await AnalyticsSimulationService.runSimulationCycle(trigger);
      } finally {
        processing = false;
      }
    },
    {
      connection,
      concurrency: 1,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[Phase2][BullMQ] Job ${job.id} completed`, result);
  });
  worker.on('failed', (job, err) => {
    console.error(`[Phase2][BullMQ] Job ${job?.id || 'unknown'} failed:`, err.message);
  });

  return worker;
}

module.exports = {
  enqueueSimulationJob,
  startAnalyticsSimulationWorker,
  getQueue,
  QUEUE_NAME,
};

