'use strict';

const env = require('../config/env');
const { getDBState } = require('../config/db');

/**
 * GET /api/health
 * Liveness check used by the frontend home page. Also reports the database connection state.
 */
function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'inventory-forecaster-api',
    environment: env.nodeEnv,
    database: getDBState(),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
