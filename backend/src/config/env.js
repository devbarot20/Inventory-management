'use strict';

/**
 * Centralised access to environment variables.
 * Values are loaded from backend/.env (see .env.example). Never hard-code secrets.
 */
require('dotenv').config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

module.exports = env;
