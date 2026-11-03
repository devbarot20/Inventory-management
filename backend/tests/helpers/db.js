'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { connectDB, disconnectDB } = require('../../src/config/db');

/**
 * Starts an isolated in-memory MongoDB for integration tests.
 * Set MONGOMS_SYSTEM_BINARY=/path/to/mongod to reuse a locally installed mongod
 * instead of downloading one on first run.
 */
let mongoServer;

async function startTestDB() {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
}

async function clearTestDB() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

async function stopTestDB() {
  await disconnectDB();
  if (mongoServer) await mongoServer.stop();
}

module.exports = { startTestDB, clearTestDB, stopTestDB };
