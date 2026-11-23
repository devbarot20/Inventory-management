'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const {
  User,
  Product,
  SaleEvent,
  ForecastRun,
  Forecast,
} = require('../src/models');
const { checkUpcomingStockouts } = require('../src/services/scheduledStockoutChecker.service');
const mailer = require('../src/services/mailer');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Scheduled Stockout Warning Checks', () => {
  let app;
  let token;
  let userId;
  let adminToken;
  let sendMailSpy;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    sendMailSpy = jest.spyOn(mailer, 'sendStockoutAlert').mockResolvedValue({ delivered: true });

    // Register standard user
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Store Manager',
      email: 'manager@shop.com',
      password: 'password123',
    });
    token = userRes.body.token;
    userId = userRes.body.user.id;

    // Register admin user
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'System Admin',
      email: 'admin@shop.com',
      password: 'password123',
    });
    await User.findByIdAndUpdate(adminRes.body.user.id, { role: 'admin' });
    adminToken = adminRes.body.token;
  });

  afterEach(() => {
    sendMailSpy.mockRestore();
  });

  it('returns empty results when no sales are scheduled within the window', async () => {
    const summary = await checkUpcomingStockouts({ windowHours: 48, userId });
    expect(summary.totalSalesEvaluated).toBe(0);
    expect(summary.totalHighRiskItems).toBe(0);
    expect(summary.totalAlertsSent).toBe(0);
    expect(sendMailSpy).not.toHaveBeenCalled();
  });

  it('evaluates upcoming sale, flags high-risk SKUs and dispatches email alert', async () => {
    // Create product
    await Product.create({
      sku: 'HOODIE-BLK',
      name: 'Black Hoodie',
      price: 50,
      createdBy: userId,
    });

    // Create upcoming sale starting in 24 hours
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const dayAfter = new Date(Date.now() + 48 * 3600 * 1000);

    const sale = await SaleEvent.create({
      name: 'Midnight Flash Promo',
      startDate: tomorrow,
      endDate: dayAfter,
      discountPct: 20,
      plannedSpend: 200,
      products: ['HOODIE-BLK'],
      createdBy: userId,
    });

    // Create forecast run and a high-risk forecast document
    const run = await ForecastRun.create({
      saleEvent: sale._id,
      createdBy: userId,
      status: 'completed',
      methodVersion: 'v1',
      inputs: {
        startDate: tomorrow,
        endDate: dayAfter,
        discountPct: 20,
        plannedSpend: 200,
        skus: ['HOODIE-BLK'],
      },
      config: {},
    });

    await Forecast.create({
      forecastRun: run._id,
      saleEvent: sale._id,
      sku: 'HOODIE-BLK',
      status: 'ok',
      low: 100,
      expected: 150,
      high: 220,
      unitsAvailable: 20,
      riskLevel: 'high',
      expectedRunOutTime: new Date(tomorrow.getTime() + 4 * 3600 * 1000),
    });

    const summary = await checkUpcomingStockouts({ windowHours: 48, userId });

    expect(summary.totalSalesEvaluated).toBe(1);
    expect(summary.totalHighRiskItems).toBe(1);
    expect(summary.totalAlertsSent).toBe(1);
    expect(summary.results[0].highRiskSkus).toEqual(['HOODIE-BLK']);
    expect(summary.results[0].emailSent).toBe(true);

    expect(sendMailSpy).toHaveBeenCalledWith(
      'manager@shop.com',
      'Store Manager',
      'Midnight Flash Promo',
      expect.any(Array),
    );
  });

  it('skips email dispatch if user has disabled stockout alert notifications', async () => {
    await User.findByIdAndUpdate(userId, {
      'notificationPreferences.emailStockoutAlerts': false,
    });

    const tomorrow = new Date(Date.now() + 12 * 3600 * 1000);
    const dayAfter = new Date(Date.now() + 36 * 3600 * 1000);

    const sale = await SaleEvent.create({
      name: 'Silent Promo',
      startDate: tomorrow,
      endDate: dayAfter,
      discountPct: 15,
      plannedSpend: 100,
      products: ['SKU-TEST'],
      createdBy: userId,
    });

    const run = await ForecastRun.create({
      saleEvent: sale._id,
      createdBy: userId,
      status: 'completed',
      inputs: { startDate: tomorrow, endDate: dayAfter, discountPct: 15, plannedSpend: 100, skus: ['SKU-TEST'] },
      config: {},
    });

    await Forecast.create({
      forecastRun: run._id,
      saleEvent: sale._id,
      sku: 'SKU-TEST',
      status: 'ok',
      low: 50,
      expected: 100,
      high: 150,
      unitsAvailable: 5,
      riskLevel: 'high',
    });

    const summary = await checkUpcomingStockouts({ windowHours: 24, userId });

    expect(summary.totalSalesEvaluated).toBe(1);
    expect(summary.totalHighRiskItems).toBe(1);
    expect(summary.totalAlertsSent).toBe(0);
    expect(summary.results[0].emailSent).toBe(false);
    expect(sendMailSpy).not.toHaveBeenCalled();
  });

  it('exposes POST /api/forecast/check-stockouts for authenticated requests', async () => {
    const res = await request(app)
      .post('/api/forecast/check-stockouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ windowHours: 72 });

    expect(res.status).toBe(200);
    expect(res.body.windowHours).toBe(72);
    expect(res.body.totalSalesEvaluated).toBeDefined();
    expect(res.body.results).toBeInstanceOf(Array);
  });

  it('allows admins to run check-stockouts across all users via allUsers flag', async () => {
    const res = await request(app)
      .post('/api/forecast/check-stockouts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ windowHours: 48, allUsers: true });

    expect(res.status).toBe(200);
    expect(res.body.totalSalesEvaluated).toBeDefined();
  });
});
