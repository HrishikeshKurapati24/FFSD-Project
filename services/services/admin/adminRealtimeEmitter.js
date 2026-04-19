'use strict';

const { getAdminNamespace } = require('../realtime/socketServer');
const cacheInvalidation = require('../cache/cacheInvalidationService');

const ADMIN_EVENTS = {
  CAMPAIGN_UPDATE: 'admin:campaign:update',
  REVENUE_UPDATE: 'admin:revenue:update',
  ORDER_UPDATE: 'admin:order:update',
  METRICS_UPDATE: 'admin:metrics:update',
};

let metricsTimer = null;
let pendingMetricsPayload = null;

function emitToAdmin(eventName, payload = {}) {
  const namespace = getAdminNamespace();
  if (!namespace) return false;

  namespace.emit(eventName, {
    ...payload,
    emittedAt: new Date().toISOString(),
  });
  return true;
}

function emitCampaignUpdate(payload = {}) {
  cacheInvalidation.invalidateExploreCaches().catch(() => {});
  cacheInvalidation.invalidateSearchCaches().catch(() => {});
  return emitToAdmin(ADMIN_EVENTS.CAMPAIGN_UPDATE, payload);
}

function emitRevenueUpdate(payload = {}) {
  cacheInvalidation.invalidateDashboardCaches().catch(() => {});
  cacheInvalidation.invalidateStatsCaches().catch(() => {});
  return emitToAdmin(ADMIN_EVENTS.REVENUE_UPDATE, payload);
}

function emitOrderUpdate(payload = {}) {
  cacheInvalidation.invalidateStatsCaches().catch(() => {});
  cacheInvalidation.invalidateDashboardCaches().catch(() => {});
  return emitToAdmin(ADMIN_EVENTS.ORDER_UPDATE, payload);
}

function emitMetricsUpdate(payload = {}, options = {}) {
  const delayMs = typeof options.delayMs === 'number' ? options.delayMs : 1500;
  pendingMetricsPayload = { ...(pendingMetricsPayload || {}), ...payload };

  if (metricsTimer) return true;
  metricsTimer = setTimeout(() => {
    emitToAdmin(ADMIN_EVENTS.METRICS_UPDATE, pendingMetricsPayload || {});
    pendingMetricsPayload = null;
    metricsTimer = null;
  }, delayMs);

  return true;
}

module.exports = {
  ADMIN_EVENTS,
  emitCampaignUpdate,
  emitRevenueUpdate,
  emitOrderUpdate,
  emitMetricsUpdate,
};
