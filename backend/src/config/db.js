'use strict';

const mongoose = require('mongoose');

/**
 * MongoDB connection helpers (Mongoose).
 * The connection string always comes from the environment (MONGODB_URI).
 */

mongoose.set('strictQuery', true);

const STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env (see .env.example).');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  // Register all models, then make sure their declared indexes exist
  // before the API starts serving requests.
  require('../models');
  await mongoose.connection.syncIndexes();

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

function getDBState() {
  return STATE_LABELS[mongoose.connection.readyState] || 'unknown';
}

module.exports = { connectDB, disconnectDB, getDBState };
