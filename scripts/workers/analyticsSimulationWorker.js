'use strict';

require('dotenv').config();
const { connectDB } = require('../../mongoDB');
const { startAnalyticsSimulationWorker } = require('../../services/queues/analyticsSimulationQueue');

async function boot() {
  await connectDB();
  const worker = startAnalyticsSimulationWorker();

  if (!worker) {
    console.error('[Phase2][Worker] REDIS_URL is missing. Cannot start BullMQ worker.');
    process.exit(1);
  }

  console.log('[Phase2][Worker] Analytics simulation worker is running...');
}

boot().catch((err) => {
  console.error('[Phase2][Worker] Fatal error:', err);
  process.exit(1);
});

