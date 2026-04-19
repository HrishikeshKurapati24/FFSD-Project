'use strict';

/**
 * AnalyticsHeartbeat
 * ------------------
 * A singleton document that persists the last successful analytics simulation
 * run across server restarts. Used by the scheduler to detect downtime gaps
 * and decide whether to trigger a catch-up simulation on startup.
 *
 * There is always exactly one document in this collection, identified by
 * _id: 'singleton'.
 */

const { mongoose } = require('../mongoDB');

const analyticsHeartbeatSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'singleton' },

    /** Timestamp of the last completed runSimulationCycle() */
    lastRunAt: { type: Date, default: null },

    /** What triggered the last run: 'startup' | 'catchup' | 'interval' | 'manual' */
    lastRunTrigger: { type: String, default: null },

    /** Summary result returned by runSimulationCycle() */
    lastRunResult: {
      campaignsProcessed: { type: Number, default: 0 },
      collabsProcessed:   { type: Number, default: 0 },
      postsProcessed:     { type: Number, default: 0 },
    },
  },
  {
    // Disable automatic createdAt/updatedAt — we manage lastRunAt manually.
    timestamps: false,
    // Allow the string _id override.
    _id: false,
  }
);

const AnalyticsHeartbeat = mongoose.model('AnalyticsHeartbeat', analyticsHeartbeatSchema);

module.exports = { AnalyticsHeartbeat };
