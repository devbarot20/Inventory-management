'use strict';

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const routes = require('./routes');
const ApiError = require('./errors/ApiError');
const errorHandler = require('./middleware/errorHandler');
const { securityHeaders, apiRateLimiter } = require('./middleware/security');

/**
 * Builds the Express application without starting the HTTP server,
 * so it can be reused by tests (supertest) and by server.js.
 */
function createApp() {
  const app = express();

  // Trust first proxy (required for express-rate-limit on Render / cloud load balancers)
  app.set('trust proxy', 1);

  const corsOriginSetting =
    !env.corsOrigin || env.corsOrigin === '*'
      ? '*'
      : env.corsOrigin.includes(',')
        ? env.corsOrigin.split(',').map((o) => o.trim())
        : env.corsOrigin;

  app.use(securityHeaders);
  app.use(cors({ origin: corsOriginSetting }));
  app.use(express.json({ limit: '1mb' }));

  // Root welcome route for cloud health probes & browser visits
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'Inventory Demand Forecaster API',
      health: '/api/health',
    });
  });

  app.use('/api', apiRateLimiter);
  app.use('/api', routes);

  // 404 handler for unknown routes
  app.use((req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralised error handling middleware
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
