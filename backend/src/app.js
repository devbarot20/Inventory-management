'use strict';

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const routes = require('./routes');

/**
 * Builds the Express application without starting the HTTP server,
 * so it can be reused by tests (supertest) and by server.js.
 */
function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', routes);

  app.use((req, res) => {
    res
      .status(404)
      .json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
  });

  return app;
}

module.exports = createApp;
