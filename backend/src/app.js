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

  const normalizeOrigin = (o) => (typeof o === 'string' ? o.trim().replace(/\/+$/, '') : o);

  const corsOptions = {
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!requestOrigin) return callback(null, true);

      // If wildcard or not configured, allow all origins
      if (!env.corsOrigin || env.corsOrigin === '*') {
        return callback(null, true);
      }

      const allowedList = env.corsOrigin
        .split(',')
        .map((item) => normalizeOrigin(item))
        .filter(Boolean);

      const normalizedRequest = normalizeOrigin(requestOrigin);

      if (allowedList.includes('*') || allowedList.includes(normalizedRequest)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  };

  app.use(securityHeaders);
  app.use(cors(corsOptions));
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

  // Fallback: also mount routes at root without /api prefix so requests like /products or /auth/register succeed
  app.use('/', routes);

  // 404 handler for unknown routes
  app.use((req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralised error handling middleware
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
