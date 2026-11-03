'use strict';

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const routes = require('./routes');
const ApiError = require('./errors/ApiError');
const errorHandler = require('./middleware/errorHandler');

/**
 * Builds the Express application without starting the HTTP server,
 * so it can be reused by tests (supertest) and by server.js.
 */
function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

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
