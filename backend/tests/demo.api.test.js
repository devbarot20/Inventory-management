'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { Product, SaleEvent, Forecast, Actual, SalesHistory, StockSnapshot } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Demo Store Seeder API', () => {
  let app;
  let token;
  let userId;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Demo Evaluator',
      email: 'evaluator@shop.com',
      password: 'password123',
    });
    token = userRes.body.token;
    userId = userRes.body.user.id;
  });

  it('loads a complete demo store with products, history, forecasts and actuals', async () => {
    const res = await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.productsCount).toBe(5);
    expect(res.body.salesEventsCount).toBe(2);
    expect(res.body.upcomingSaleId).toBeDefined();

    // Verify products created for this user
    const products = await Product.find({ createdBy: userId });
    expect(products.length).toBe(5);

    // Verify 30 days of sales history created
    const historyCount = await SalesHistory.countDocuments({ createdBy: userId });
    expect(historyCount).toBe(150); // 30 days * 5 SKUs

    // Verify 5 stock snapshots created
    const snapshotCount = await StockSnapshot.countDocuments({ createdBy: userId });
    expect(snapshotCount).toBe(5);

    // Verify 2 sale events created
    const sales = await SaleEvent.find({ createdBy: userId });
    expect(sales.length).toBe(2);

    // Verify forecasts were generated for upcoming sale
    const upcomingSale = sales.find((s) => s.campaignLabel === 'Demo-TikTok-MegaDrop');
    expect(upcomingSale).toBeDefined();
    const forecasts = await Forecast.find({ saleEvent: upcomingSale._id });
    expect(forecasts.length).toBe(4);

    // Verify past sale has recorded actuals
    const pastSale = sales.find((s) => s.campaignLabel === 'Demo-Fall-Kickoff');
    expect(pastSale).toBeDefined();
    const actuals = await Actual.find({ saleEvent: pastSale._id });
    expect(actuals.length).toBe(3);
  });

  it('is idempotent on repeated calls', async () => {
    await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${token}`);

    const res2 = await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${token}`);

    expect(res2.status).toBe(200);
    const products = await Product.find({ createdBy: userId });
    expect(products.length).toBe(5);
  });

  it('clears demo data cleanly via POST /api/demo/clear', async () => {
    // Seed first
    await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${token}`);

    const clearRes = await request(app)
      .post('/api/demo/clear')
      .set('Authorization', `Bearer ${token}`);

    expect(clearRes.status).toBe(200);
    expect(clearRes.body.clearedProducts).toBe(5);

    const products = await Product.find({ createdBy: userId });
    expect(products.length).toBe(0);
    const sales = await SaleEvent.find({ createdBy: userId });
    expect(sales.length).toBe(0);
  });
});

