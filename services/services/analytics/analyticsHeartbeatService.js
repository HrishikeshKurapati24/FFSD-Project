'use strict';

/**
 * analyticsHeartbeatService.js
 * ----------------------------
 * Encapsulates all reads and writes to the singleton AnalyticsHeartbeat
 * document. This service is the single source of truth for "when did the
 * analytics simulation last run successfully?"
 */

const { AnalyticsHeartbeat } = require('../../models/AnalyticsHeartbeat');

/**
 * Returns the Date of the last successful simulation run, or null if the
 * engine has never been run (e.g. fresh database).
 *
 * @returns {Promise<Date|null>}
 */
async function getLastRunAt() {
  try {
    const doc = await AnalyticsHeartbeat.findById('singleton').lean();
    return doc?.lastRunAt ? new Date(doc.lastRunAt) : null;
  } catch (err) {
    console.error('[Heartbeat] Failed to read heartbeat document:', err.message);
    return null;
  }
}

/**
 * Upserts the singleton heartbeat document to record a successful simulation
 * cycle. Should be called immediately after runSimulationCycle() resolves.
 *
 * @param {string} trigger  - What triggered this run ('startup'|'catchup'|'interval'|'manual')
 * @param {object} result   - The result object returned by runSimulationCycle()
 * @returns {Promise<void>}
 */
async function recordRun(trigger, result = {}) {
  try {
    await AnalyticsHeartbeat.findByIdAndUpdate(
      'singleton',
      {
        $set: {
          lastRunAt:      new Date(),
          lastRunTrigger: trigger || 'manual',
          lastRunResult: {
            campaignsProcessed: result.campaignsProcessed ?? 0,
            collabsProcessed:   result.collabsProcessed   ?? 0,
            postsProcessed:     result.postsProcessed     ?? 0,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    // Non-fatal — a failed heartbeat write should not crash the simulation.
    console.error('[Heartbeat] Failed to write heartbeat document:', err.message);
  }
}

module.exports = {
  getLastRunAt,
  recordRun,
};
