'use strict';

const request = require('supertest');

const createApp = require('../src/app');

describe('GET /api/health', () => {
  const app = createApp();

  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('disconnected');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('returns 404 JSON for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/Route not found/);
  });
});
