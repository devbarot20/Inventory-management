'use strict';

const env = require('../config/env');

/**
 * GET /api/health
 * Lightweight liveness check used by the frontend home page.
 */
function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'inventory-forecaster-api',
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
