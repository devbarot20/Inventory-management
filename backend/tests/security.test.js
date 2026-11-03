'use strict';

const request = require('supertest');
const express = require('express');
const createApp = require('../src/app');
const rateLimit = require('express-rate-limit');
const ApiError = require('../src/errors/ApiError');
const errorHandler = require('../src/middleware/errorHandler');

describe('Security Hardening & Error Handling Tests (Section 11)', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('HTTP Security Headers (Helmet)', () => {
    it('sets X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets cross-origin resource policy header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });

    it('sets X-DNS-Prefetch-Control or Strict-Transport-Security headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });
  });

  describe('CORS Headers', () => {
    it('returns access-control-allow-origin header for valid requests', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Route Not Found (404) Handler', () => {
    it('returns 404 with standard JSON format for nonexistent endpoints', async () => {
      const res = await request(app).get('/api/nonexistent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toMatch(/Route not found: GET \/api\/nonexistent-route-xyz/i);
    });
  });

  describe('Rate Limiter Behavior', () => {
    it('returns 429 when rate limit threshold is exceeded', async () => {
      // Create isolated test app with a strict rate limit of 2 requests
      const testApp = express();
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 2,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: (req, res, next) => {
          next(ApiError.tooManyRequests('Too many requests, slow down.'));
        },
      });

      testApp.use(testLimiter);
      testApp.get('/test', (req, res) => res.json({ ok: true }));
      testApp.use(errorHandler);

      // Request 1: OK
      const r1 = await request(testApp).get('/test');
      expect(r1.status).toBe(200);

      // Request 2: OK
      const r2 = await request(testApp).get('/test');
      expect(r2.status).toBe(200);

      // Request 3: Exceeded -> 429
      const r3 = await request(testApp).get('/test');
      expect(r3.status).toBe(429);
      expect(r3.body.error).toBeDefined();
      expect(r3.body.error.message).toMatch(/Too many requests, slow down/i);
    });
  });

  describe('Payload Size Limit', () => {
    it('handles JSON payloads and rejects invalid JSON', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid json: ');

      expect(res.status).toBe(400);
    });
  });
});
