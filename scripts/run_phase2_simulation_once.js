'use strict';

require('dotenv').config();
const { connectDB, closeConnection } = require('../mongoDB');
const { runSimulationTick } = require('../services/analytics/analyticsSimulationScheduler');

async function main() {
  await connectDB();
  const result = await runSimulationTick('manual-script');
  console.log('[Phase2] Simulation tick result:', result);
  await closeConnection();
}

main().catch(async (err) => {
  console.error('[Phase2] Simulation failed:', err);
  await closeConnection();
  process.exit(1);
});

