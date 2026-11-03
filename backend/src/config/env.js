'use strict';

/**
 * Centralised access to environment variables.
 * Values are loaded from backend/.env (see .env.example). Never hard-code secrets.
 */
require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  // A local default keeps development friction-free; production must set it explicitly.
  mongodbUri:
    process.env.MONGODB_URI ||
    (nodeEnv === 'production' ? '' : 'mongodb://127.0.0.1:27017/inventory_forecaster'),
};

module.exports = env;
