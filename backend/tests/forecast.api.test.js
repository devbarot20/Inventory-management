'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { Product, SalesHistory, StockSnapshot, ForecastRun, Forecast } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');
const { evaluateStockoutRisk } = require('../src/services/forecast/stockoutRisk');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Stockout Risk Logic (E4)', () => {
  const startDate = '2026-11-20T00:00:00.000Z';
  const durationDays = 2; // 48-hour flash sale

  it('assigns Low risk when stock covers the peak high-case demand', () => {
    const risk = evaluateStockoutRisk({
      low: 50,
      expected: 80,
      high: 120,
      unitsAvailable: 150, // 150 >= 120
      startDate,
      durationDays,
    });

    expect(risk.riskLevel).toBe('low');
    expect(risk.expectedRunOutTime).toBeNull();
    expect(risk.bufferUnits).toBe(30);
  });

  it('assigns Medium risk when stock covers expected but not high, computing run-out time', () => {
    const risk = evaluateStockoutRisk({
      low: 50,
      expected: 80,
      high: 120,
      unitsAvailable: 90, // 80 <= 90 < 120
      startDate,
      durationDays,
    });

    expect(risk.riskLevel).toBe('medium');
    expect(risk.expectedRunOutTime).toBeTruthy();
    expect(risk.stockDeficit).toBe(30); // 120 - 90

    // High demand rate = 120 units over 2 days = 60 units/day
    // 90 units will run out at 1.5 days (36 hours after start)
    const runOutMs = new Date(risk.expectedRunOutTime).getTime();
    const startMs = new Date(startDate).getTime();
    const elapsedHours = (runOutMs - startMs) / (1000 * 60 * 60);
    expect(elapsedHours).toBeCloseTo(36, 0);
  });

  it('assigns High risk when expected demand exceeds stock, computing run-out time', () => {
    const risk = evaluateStockoutRisk({
      low: 50,
      expected: 80,
      high: 120,
      unitsAvailable: 40, // 40 < 80
      startDate,
      durationDays,
    });

    expect(risk.riskLevel).toBe('high');
    expect(risk.expectedRunOutTime).toBeTruthy();
    expect(risk.stockDeficit).toBe(40); // 80 - 40 on expected
  });

  it('returns null risk when stock snapshot is missing', () => {
    const risk = evaluateStockoutRisk({
      low: 50,
      expected: 80,
      high: 120,
      unitsAvailable: null,
      startDate,
      durationDays,
    });

    expect(risk.riskLevel).toBeNull();
    expect(risk.expectedRunOutTime).toBeNull();
  });
});

describe('Forecast API Endpoint (E3, E4)', () => {
  let app;
  let token;
  let saleEventId;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Forecaster Admin',
      email: 'forecaster@shop.com',
      password: 'password123',
    });
    token = userRes.body.token;

    // Create products
    await Product.create([
      { sku: 'TEE-HIGH-STOCK', name: 'Abundant Tee' },
      { sku: 'TEE-LOW-STOCK', name: 'Scarce Tee' },
    ]);

    // Seed 14 days of historical sales (10 units/day)
    for (let i = 1; i <= 14; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      await SalesHistory.create([
        { sku: 'TEE-HIGH-STOCK', date: `2026-11-${dayStr}T00:00:00.000Z`, unitsSold: 10 },
        { sku: 'TEE-LOW-STOCK', date: `2026-11-${dayStr}T00:00:00.000Z`, unitsSold: 10 },
      ]);
    }

    // Seed stock snapshots: 200 units for TEE-HIGH-STOCK, 15 units for TEE-LOW-STOCK
    await StockSnapshot.create([
      { sku: 'TEE-HIGH-STOCK', date: '2026-11-15T00:00:00.000Z', unitsAvailable: 200 },
      { sku: 'TEE-LOW-STOCK', date: '2026-11-15T00:00:00.000Z', unitsAvailable: 15 },
    ]);

    // Create a 2-day flash sale for Nov 20-22
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Nov Flash Drop',
        startDate: '2026-11-20T00:00:00.000Z',
        endDate: '2026-11-22T00:00:00.000Z',
        discountPct: 25,
        plannedSpend: 600,
        products: ['TEE-HIGH-STOCK', 'TEE-LOW-STOCK'],
      });
    saleEventId = saleRes.body.saleEvent.id;
  });

  it('executes forecast run, saves ForecastRun and Forecasts, and assigns risk levels', async () => {
    const res = await request(app)
      .post(`/api/forecast/run/${saleEventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('forecastRun');
    expect(res.body).toHaveProperty('forecasts');

    const run = res.body.forecastRun;
    expect(run.status).toBe('completed');
    expect(run.methodVersion).toBe('baseline-similar-sales-v1');
    expect(run.inputs.skus).toEqual(['TEE-HIGH-STOCK', 'TEE-LOW-STOCK']);
    expect(run.assumptions.length).toBeGreaterThan(0);

    const forecasts = res.body.forecasts;
    expect(forecasts.length).toBe(2);

    const highStockForecast = forecasts.find((f) => f.sku === 'TEE-HIGH-STOCK');
    const lowStockForecast = forecasts.find((f) => f.sku === 'TEE-LOW-STOCK');

    expect(highStockForecast.status).toBe('ok');
    expect(highStockForecast.low).toBeLessThanOrEqual(highStockForecast.expected);
    expect(highStockForecast.expected).toBeLessThanOrEqual(highStockForecast.high);
    // 200 units available comfortably covers high demand estimate -> Low risk
    expect(highStockForecast.unitsAvailable).toBe(200);
    expect(highStockForecast.riskLevel).toBe('low');
    expect(highStockForecast.expectedRunOutTime).toBeNull();

    // 15 units available is less than expected -> High risk
    expect(lowStockForecast.status).toBe('ok');
    expect(lowStockForecast.unitsAvailable).toBe(15);
    expect(lowStockForecast.riskLevel).toBe('high');
    expect(lowStockForecast.expectedRunOutTime).toBeTruthy();

    // Verify stored in DB
    const runInDb = await ForecastRun.findById(run.id);
    expect(runInDb).toBeTruthy();
    const forecastsInDb = await Forecast.find({ forecastRun: run.id });
    expect(forecastsInDb.length).toBe(2);
  });

  it('retrieves the latest forecast run for a sale event via GET /api/forecast/latest/:saleEventId', async () => {
    // Run forecast once
    await request(app)
      .post(`/api/forecast/run/${saleEventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const latestRes = await request(app).get(`/api/forecast/latest/${saleEventId}`);
    expect(latestRes.status).toBe(200);
    expect(latestRes.body.forecastRun).toBeTruthy();
    expect(latestRes.body.forecasts.length).toBe(2);
  });
});
