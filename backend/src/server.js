'use strict';

const env = require('./config/env');
const createApp = require('./app');

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
