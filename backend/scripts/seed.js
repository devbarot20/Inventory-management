'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const {
  User,
  Product,
  SalesHistory,
  StockSnapshot,
  SaleEvent,
  ForecastRun,
  Forecast,
  Actual,
} = require('../src/models');
const { executeForecastRun } = require('../src/services/forecastRun.service');
const { recordActuals } = require('../src/services/comparison.service');

async function seed() {
  console.log('\n================================================================================');
  console.log('              INVENTORY DEMAND FORECASTER - DATABASE SEED SCRIPT                ');
  console.log('================================================================================');
  console.log(`Connecting to MongoDB at ${env.mongodbUri}…`);

  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB.\n');

  console.log('Cleaning previous collections…');
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    SalesHistory.deleteMany({}),
    StockSnapshot.deleteMany({}),
    SaleEvent.deleteMany({}),
    ForecastRun.deleteMany({}),
    Forecast.deleteMany({}),
    Actual.deleteMany({}),
  ]);

  // 1. Seed Users
  console.log('Creating demo users…');
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminUser = await User.create({
    name: 'Demo Admin',
    email: 'admin@shop.com',
    password: passwordHash,
    role: 'admin',
  });

  await User.create({
    name: 'Inventory Manager',
    email: 'manager@shop.com',
    password: passwordHash,
    role: 'user',
  });

  // 2. Seed Products
  console.log('Creating catalog products…');
  const productsData = [
    { sku: 'TSHIRT-BLK-S', name: 'Classic Black T-Shirt (Small)' },
    { sku: 'TSHIRT-BLK-M', name: 'Classic Black T-Shirt (Medium)' },
    { sku: 'TSHIRT-BLK-L', name: 'Classic Black T-Shirt (Large)' },
    { sku: 'HOODIE-GRY-M', name: 'Premium Fleece Hoodie (Medium)' },
    { sku: 'HOODIE-GRY-L', name: 'Premium Fleece Hoodie (Large)' },
    { sku: 'MUG-WHT-01', name: 'Ceramic Coffee Mug (12oz)' },
    { sku: 'CAP-NVY-01', name: 'Embroidered Vintage Cap (Navy)' },
    { sku: 'TOTE-NAT-01', name: 'Organic Cotton Canvas Tote Bag' },
  ];

  const createdProducts = await Product.insertMany(productsData);
  console.log(`✓ Inserted ${createdProducts.length} products`);

  // 3. Seed 90 Days of Sales History (2026-08-01 to 2026-10-31)
  console.log('Generating 90 days of sales history and stock snapshots…');
  const salesHistoryDocs = [];
  const stockSnapshotDocs = [];

  const startDate = new Date('2026-08-01T00:00:00Z');
  const totalDays = 92;

  // Sale periods to elevate
  const sale1Start = new Date('2026-09-05T00:00:00Z').getTime();
  const sale1End = new Date('2026-09-07T00:00:00Z').getTime();
  const sale2Start = new Date('2026-09-25T00:00:00Z').getTime();
  const sale2End = new Date('2026-09-27T00:00:00Z').getTime();

  for (let d = 0; d < totalDays; d++) {
    const currentDate = new Date(startDate.getTime() + d * 86400000);
    const time = currentDate.getTime();
    const inSale1 = time >= sale1Start && time <= sale1End;
    const inSale2 = time >= sale2Start && time <= sale2End;

    for (const p of productsData) {
      let baseUnits = 10;
      let price = 25.0;

      if (p.sku.startsWith('HOODIE')) {
        baseUnits = 6;
        price = 55.0;
      } else if (p.sku.startsWith('MUG')) {
        baseUnits = 16;
        price = 15.0;
      } else if (p.sku.startsWith('CAP')) {
        baseUnits = 8;
        price = 22.0;
      } else if (p.sku.startsWith('TOTE')) {
        baseUnits = 12;
        price = 18.0;
      }

      // Daily natural noise (-2 to +3)
      const noise = (d % 6) - 2;
      let unitsSold = Math.max(1, baseUnits + noise);
      let discountPct = 0;

      // Apply historical flash sale uplifts
      if (inSale1 && ['TSHIRT-BLK-M', 'MUG-WHT-01'].includes(p.sku)) {
        unitsSold = Math.round(baseUnits * 3.1 + noise);
        discountPct = 20;
      } else if (inSale2 && ['TSHIRT-BLK-M', 'HOODIE-GRY-L', 'CAP-NVY-01'].includes(p.sku)) {
        unitsSold = Math.round(baseUnits * 2.8 + noise);
        discountPct = 25;
      }

      salesHistoryDocs.push({
        sku: p.sku,
        date: currentDate,
        unitsSold,
        price,
        discountPct,
      });
    }
  }

  await SalesHistory.insertMany(salesHistoryDocs);
  console.log(`✓ Inserted ${salesHistoryDocs.length} daily sales history records`);

  // Current Stock Snapshots (dated 2026-11-01)
  const currentStockLevels = {
    'TSHIRT-BLK-S': 120,
    'TSHIRT-BLK-M': 60, // Intentionally tight stock -> will flag High/Medium Risk!
    'TSHIRT-BLK-L': 95,
    'HOODIE-GRY-M': 60,
    'HOODIE-GRY-L': 35, // Intentionally tight stock -> will flag High/Medium Risk!
    'MUG-WHT-01': 220, // Plenty of stock -> Low Risk!
    'CAP-NVY-01': 70,
    'TOTE-NAT-01': 130,
  };

  const snapshotDate = new Date('2026-11-01T00:00:00Z');
  for (const [sku, unitsAvailable] of Object.entries(currentStockLevels)) {
    stockSnapshotDocs.push({
      sku,
      date: snapshotDate,
      unitsAvailable,
    });
  }

  await StockSnapshot.insertMany(stockSnapshotDocs);
  console.log(`✓ Inserted ${stockSnapshotDocs.length} current inventory stock snapshots`);

  // 4. Seed Past Flash Sales with Actuals
  console.log('Creating completed historical flash sales and actuals…');
  const pastSale1 = await SaleEvent.create({
    name: 'Labor Day 48h Flash Sale',
    startDate: new Date('2026-09-05T00:00:00Z'),
    endDate: new Date('2026-09-07T00:00:00Z'),
    discountPct: 20,
    plannedSpend: 500,
    actualSpend: 520,
    campaignLabel: 'TikTok-Promo-LaborDay',
    products: ['TSHIRT-BLK-M', 'MUG-WHT-01'],
    createdBy: adminUser._id,
  });

  const pastSale2 = await SaleEvent.create({
    name: 'Fall Equinox Promo',
    startDate: new Date('2026-09-25T00:00:00Z'),
    endDate: new Date('2026-09-27T00:00:00Z'),
    discountPct: 25,
    plannedSpend: 750,
    actualSpend: 710,
    campaignLabel: 'Influencer-Fall-Blitz',
    products: ['TSHIRT-BLK-M', 'HOODIE-GRY-L', 'CAP-NVY-01'],
    createdBy: adminUser._id,
  });

  // Run forecast on past sale 1 & record actuals
  await executeForecastRun(pastSale1._id, adminUser._id);
  await recordActuals({
    saleEventId: pastSale1._id,
    actualSpend: 520,
    actualRecords: [
      { sku: 'TSHIRT-BLK-M', actualUnits: 64, stockoutOccurred: false },
      { sku: 'MUG-WHT-01', actualUnits: 98, stockoutOccurred: false },
    ],
  });

  // Run forecast on past sale 2 & record actuals
  await executeForecastRun(pastSale2._id, adminUser._id);
  await recordActuals({
    saleEventId: pastSale2._id,
    actualSpend: 710,
    actualRecords: [
      { sku: 'TSHIRT-BLK-M', actualUnits: 68, stockoutOccurred: true },
      { sku: 'HOODIE-GRY-L', actualUnits: 38, stockoutOccurred: false },
      { sku: 'CAP-NVY-01', actualUnits: 46, stockoutOccurred: false },
    ],
  });

  console.log('✓ Recorded forecasts and actuals for past sales');

  // 5. Seed Upcoming Flash Sale and run forecast
  console.log('Creating upcoming flash sale…');
  const upcomingSale = await SaleEvent.create({
    name: 'Black Friday Super Flash Sale',
    startDate: new Date('2026-11-27T00:00:00Z'),
    endDate: new Date('2026-11-29T00:00:00Z'),
    discountPct: 25,
    plannedSpend: 1000,
    campaignLabel: 'BF-TikTok-MegaPromo',
    products: ['TSHIRT-BLK-M', 'HOODIE-GRY-L', 'MUG-WHT-01', 'CAP-NVY-01'],
    createdBy: adminUser._id,
  });

  console.log('Running forecast engine for Black Friday Super Flash Sale…');
  const forecastResult = await executeForecastRun(upcomingSale._id, adminUser._id);
  console.log(`✓ Generated ${forecastResult.forecasts.length} product scenario forecasts`);

  console.log('\n================================================================================');
  console.log('                           SEEDING COMPLETED SUCCESSFULLY!                      ');
  console.log('================================================================================');
  console.log('Default Admin Account:');
  console.log('  Email:    admin@shop.com');
  console.log('  Password: password123\n');
  console.log('Featured Flash Sales in Database:');
  console.log(`  1. ${upcomingSale.name} (Upcoming, 4 SKUs, ready to view on Dashboard)`);
  console.log(`  2. ${pastSale2.name} (Completed, with recorded actuals)`);
  console.log(`  3. ${pastSale1.name} (Completed, with recorded actuals)`);
  console.log('================================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}

module.exports = { seed };

