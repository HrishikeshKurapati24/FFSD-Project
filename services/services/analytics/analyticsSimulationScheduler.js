'use strict';

/**
 * analyticsSimulationScheduler.js
 * ---------------------------------
 * Manages the 30-minute simulation tick schedule.
 *
 * On startup it reads the AnalyticsHeartbeat document to decide whether a
 * catch-up tick is needed:
 *
 *   • Never run before  → fire immediately (first-boot).
 *   • Gap > 30 min      → fire immediately labelled 'catchup'.
 *   • Gap ≤ 30 min      → skip startup tick; the interval will handle it.
 */

const AnalyticsSimulationService = require('./analyticsSimulationService');
const HeartbeatService            = require('./analyticsHeartbeatService');
const { enqueueSimulationJob, getQueue } = require('../queues/analyticsSimulationQueue');

const SIMULATION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let timer            = null;
let isRunningFallback = false;

/**
 * Enqueues (BullMQ) or directly runs a simulation cycle.
 *
 * @param {string} trigger - Label for this run ('startup'|'catchup'|'interval'|'manual')
 */
async function runSimulationTick(trigger = 'manual') {
  const queue = getQueue();

  if (queue) {
    // BullMQ path — pass trigger so the worker can forward it to the service.
    const job = await enqueueSimulationJob({ trigger, at: new Date().toISOString() });
    return { mode: 'bullmq', jobId: job?.id || null };
  }

  // Direct fallback path (no Redis).
  if (isRunningFallback) {
    return { mode: 'direct', skipped: true, reason: 'already-running' };
  }

  isRunningFallback = true;
  try {
    const result = await AnalyticsSimulationService.runSimulationCycle(trigger);
    return { mode: 'direct', result };
  } finally {
    isRunningFallback = false;
  }
}

/**
 * Determines whether a catch-up tick is required based on how long ago the
 * last successful simulation ran.
 *
 * @returns {Promise<{ needed: boolean, reason: string, gapMs: number|null }>}
 */
async function evaluateStartupTick() {
  const lastRunAt = await HeartbeatService.getLastRunAt();

  if (!lastRunAt) {
    return { needed: true, reason: 'first-boot', gapMs: null };
  }

  const gapMs = Date.now() - lastRunAt.getTime();

  if (gapMs > SIMULATION_INTERVAL_MS) {
    return { needed: true, reason: 'catchup', gapMs };
  }

  return { needed: false, reason: 'within-interval', gapMs };
}

/**
 * Starts the analytics simulation scheduler.
 * Checks for a missed simulation window on startup before beginning the
 * regular 30-minute interval.
 */
async function startAnalyticsSimulationScheduler() {
  if (timer) return timer;

  console.log('[Phase2] Evaluating startup simulation requirement…');

  const { needed, reason, gapMs } = await evaluateStartupTick();

  if (needed) {
    const gapLabel = gapMs !== null
      ? `~${(gapMs / 3_600_000).toFixed(1)}h since last run`
      : 'never run before';

    const trigger = reason === 'first-boot' ? 'startup' : 'catchup';
    console.log(`[Phase2] Startup tick required (${gapLabel}) — triggering '${trigger}' simulation`);

    runSimulationTick(trigger).catch((err) => {
      console.error(`[Phase2] Startup '${trigger}' tick failed:`, err.message);
    });
  } else {
    const gapMin = (gapMs / 60_000).toFixed(1);
    console.log(`[Phase2] Last simulation ran ${gapMin}min ago — within interval, skipping startup tick`);
  }

  console.log('[Phase2] Starting analytics simulation scheduler (every 30 minutes)');
  timer = setInterval(() => {
    runSimulationTick('interval').catch((err) => {
      console.error('[Phase2] Scheduled simulation tick failed:', err.message);
    });
  }, SIMULATION_INTERVAL_MS);

  return timer;
}

module.exports = {
  startAnalyticsSimulationScheduler,
  runSimulationTick,
};
