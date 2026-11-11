'use strict';

const {
  Product,
  SalesHistory,
  StockSnapshot,
  SaleEvent,
  ForecastRun,
  Forecast,
  Actual,
} = require('../models');
const { toOwnerId } = require('../utils/ownership');
const { executeForecastRun } = require('./forecastRun.service');
const { recordActuals } = require('./comparison.service');

const DEMO_PRODUCTS = [
  { sku: 'TSHIRT-BLK-M', name: 'Classic Black T-Shirt (Medium)' },
  { sku: 'HOODIE-GRY-L', name: 'Premium Fleece Hoodie (Large)' },
  { sku: 'CAP-NVY-01', name: 'Embroidered Vintage Cap (Navy)' },
  { sku: 'MUG-WHT-01', name: 'Ceramic Coffee Mug (12oz)' },
  { sku: 'TOTE-NAT-01', name: 'Organic Cotton Canvas Tote Bag' },
];

const DEMO_SKUS = DEMO_PRODUCTS.map((p) => p.sku);

const DEMO_STOCK = {
  'TSHIRT-BLK-M': 35, // Low stock -> High stockout risk
  'HOODIE-GRY-L': 65, // Moderate stock -> Medium stockout risk
  'CAP-NVY-01': 140, // Ample stock -> Low risk
  'MUG-WHT-01': 220, // Ample stock -> Low risk
  'TOTE-NAT-01': 95, // Ample stock -> Low risk
};

/**
 * Loads a complete, realistic demo store environment for the user.
 * Idempotent: clears previously loaded demo entities for this user before recreating.
 */
async function loadDemoData(userId) {
  const owner = toOwnerId(userId);

  // 1. Upsert Products
  for (const prod of DEMO_PRODUCTS) {
    await Product.findOneAndUpdate(
      { createdBy: owner, sku: prod.sku },
      { name: prod.name, createdBy: owner },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
  }

  // 2. Clear old demo sales history and snapshots for these SKUs
  await Promise.all([
    SalesHistory.deleteMany({ createdBy: owner, sku: { $in: DEMO_SKUS } }),
    StockSnapshot.deleteMany({ createdBy: owner, sku: { $in: DEMO_SKUS } }),
  ]);

  // 3. Generate 30 days of daily sales history (ending yesterday)
  const now = new Date();
  const historyDocs = [];
  const snapshotDocs = [];

  for (let i = 30; i >= 1; i--) {
    const dayDate = new Date(now.getTime() - i * 86400000);
    dayDate.setUTCHours(0, 0, 0, 0);

    // Realistic daily baseline sales
    historyDocs.push(
      { sku: 'TSHIRT-BLK-M', date: dayDate, unitsSold: 12 + (i % 4), createdBy: owner },
      { sku: 'HOODIE-GRY-L', date: dayDate, unitsSold: 7 + (i % 3), createdBy: owner },
      { sku: 'CAP-NVY-01', date: dayDate, unitsSold: 6 + (i % 2), createdBy: owner },
      { sku: 'MUG-WHT-01', date: dayDate, unitsSold: 10 + (i % 3), createdBy: owner },
      { sku: 'TOTE-NAT-01', date: dayDate, unitsSold: 5 + (i % 2), createdBy: owner },
    );
  }

  // 4. Current Stock Snapshots (as of today)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const [sku, unitsAvailable] of Object.entries(DEMO_STOCK)) {
    snapshotDocs.push({
      sku,
      date: today,
      unitsAvailable,
      createdBy: owner,
    });
  }

  await Promise.all([
    SalesHistory.insertMany(historyDocs),
    StockSnapshot.insertMany(snapshotDocs),
  ]);

  // 5. Create or Refresh Past Flash Sale with Recorded Actuals
  const pastStartDate = new Date(now.getTime() - 14 * 86400000);
  const pastEndDate = new Date(now.getTime() - 12 * 86400000);

  let pastSale = await SaleEvent.findOne({
    createdBy: owner,
    campaignLabel: 'Demo-Fall-Kickoff',
  });

  if (!pastSale) {
    pastSale = await SaleEvent.create({
      name: 'Fall Season Kickoff Drop',
      startDate: pastStartDate,
      endDate: pastEndDate,
      discountPct: 20,
      plannedSpend: 600,
      actualSpend: 630,
      campaignLabel: 'Demo-Fall-Kickoff',
      products: ['TSHIRT-BLK-M', 'MUG-WHT-01', 'CAP-NVY-01'],
      createdBy: owner,
    });
  } else {
    pastSale.startDate = pastStartDate;
    pastSale.endDate = pastEndDate;
    pastSale.products = ['TSHIRT-BLK-M', 'MUG-WHT-01', 'CAP-NVY-01'];
    await pastSale.save();
  }

  // Run forecast & record actuals for past sale
  await executeForecastRun(pastSale._id, owner);
  await recordActuals({
    saleEventId: pastSale._id,
    actualSpend: 630,
    actualRecords: [
      { sku: 'TSHIRT-BLK-M', actualUnits: 68, stockoutOccurred: true },
      { sku: 'MUG-WHT-01', actualUnits: 94, stockoutOccurred: false },
      { sku: 'CAP-NVY-01', actualUnits: 44, stockoutOccurred: false },
    ],
    userId: owner,
  });

  // 6. Create or Refresh Upcoming Flash Sale (Ready on Dashboard)
  const upcomingStartDate = new Date(now.getTime() + 2 * 86400000);
  const upcomingEndDate = new Date(now.getTime() + 4 * 86400000);

  let upcomingSale = await SaleEvent.findOne({
    createdBy: owner,
    campaignLabel: 'Demo-TikTok-MegaDrop',
  });

  if (!upcomingSale) {
    upcomingSale = await SaleEvent.create({
      name: 'Weekend TikTok Mega Drop',
      startDate: upcomingStartDate,
      endDate: upcomingEndDate,
      discountPct: 25,
      plannedSpend: 1000,
      campaignLabel: 'Demo-TikTok-MegaDrop',
      products: ['TSHIRT-BLK-M', 'HOODIE-GRY-L', 'CAP-NVY-01', 'MUG-WHT-01'],
      createdBy: owner,
    });
  } else {
    upcomingSale.startDate = upcomingStartDate;
    upcomingSale.endDate = upcomingEndDate;
    upcomingSale.products = ['TSHIRT-BLK-M', 'HOODIE-GRY-L', 'CAP-NVY-01', 'MUG-WHT-01'];
    await upcomingSale.save();
  }

  // Generate scenario forecasts & stockout warnings for upcoming sale
  const forecastResult = await executeForecastRun(upcomingSale._id, owner);

  return {
    message: 'Demo store data loaded successfully',
    productsCount: DEMO_PRODUCTS.length,
    salesHistoryDays: 30,
    salesEventsCount: 2,
    upcomingSaleId: upcomingSale._id.toString(),
    upcomingSaleName: upcomingSale.name,
    forecastsGenerated: forecastResult.forecasts.length,
  };
}

/**
 * Removes demo store data for the user.
 */
async function clearDemoData(userId) {
  const owner = toOwnerId(userId);

  // Find demo sales
  const demoSales = await SaleEvent.find({
    createdBy: owner,
    campaignLabel: { $in: ['Demo-Fall-Kickoff', 'Demo-TikTok-MegaDrop'] },
  }).lean();

  const saleIds = demoSales.map((s) => s._id);

  await Promise.all([
    Forecast.deleteMany({ saleEvent: { $in: saleIds } }),
    ForecastRun.deleteMany({ saleEvent: { $in: saleIds } }),
    Actual.deleteMany({ saleEvent: { $in: saleIds } }),
    SaleEvent.deleteMany({ _id: { $in: saleIds } }),
    SalesHistory.deleteMany({ createdBy: owner, sku: { $in: DEMO_SKUS } }),
    StockSnapshot.deleteMany({ createdBy: owner, sku: { $in: DEMO_SKUS } }),
    Product.deleteMany({ createdBy: owner, sku: { $in: DEMO_SKUS } }),
  ]);

  return {
    message: 'Demo store data cleared successfully',
    clearedProducts: DEMO_SKUS.length,
    clearedSales: demoSales.length,
  };
}

module.exports = {
  loadDemoData,
  clearDemoData,
  DEMO_PRODUCTS,
  DEMO_SKUS,
};
