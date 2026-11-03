'use strict';

const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const createApp = require('./app');

async function start() {
  try {
    await connectDB(env.mongodbUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    console.error('Is MongoDB running? Check MONGODB_URI in backend/.env.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.port} is already in use. Set a different PORT in backend/.env ` +
          '(and update NEXT_PUBLIC_API_URL in frontend/.env.local to match).',
      );
    } else {
      console.error('Failed to start server:', err);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
