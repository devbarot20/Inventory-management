'use strict';

const mongoose = require('mongoose');
const env = require('../src/config/env');
const { SaleEvent, SalesHistory, StockSnapshot, Actual } = require('../src/models');
const { runTimeOrderedBacktest } = require('../src/services/backtest.service');

function formatPercent(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}

function generateBenchmarkSampleData() {
  const skus = ['TSHIRT-BLK-M', 'HOODIE-GRY-L', 'MUG-WHT-01'];
  const salesHistory = [];
  const stockSnapshots = [];

  // Generate 90 days of history from 2026-06-01 to 2026-08-31
  const startDate = new Date('2026-06-01T00:00:00Z');
  for (let d = 0; d < 90; d++) {
    const currentDate = new Date(startDate.getTime() + d * 86400000);
    const time = currentDate.getTime();

    // Check if currentDate falls inside Sale 1 (June 20-22) or Sale 2 (July 15-17)
    const isSale1 =
      time >= new Date('2026-06-20T00:00:00Z').getTime() &&
      time <= new Date('2026-06-22T00:00:00Z').getTime();
    const isSale2 =
      time >= new Date('2026-07-15T00:00:00Z').getTime() &&
      time <= new Date('2026-07-17T00:00:00Z').getTime();

    for (const sku of skus) {
      let dailyUnits = 10;
      if (sku === 'HOODIE-GRY-L') dailyUnits = 6;
      if (sku === 'MUG-WHT-01') dailyUnits = 15;

      // Small variation +/- 2 units
      const variance = (d % 5) - 2;
      let unitsSold = Math.max(1, dailyUnits + variance);

      // Elevate sales during past flash sales (approx 2.5x to 3x uplift)
      if (isSale1 || isSale2) {
        unitsSold = Math.round(dailyUnits * 2.8 + variance);
      }

      salesHistory.push({
        sku,
        date: currentDate,
        unitsSold,
        price: 25,
        discountPct: isSale1 || isSale2 ? 20 : 0,
      });

      stockSnapshots.push({
        sku,
        date: currentDate,
        unitsAvailable: 250,
      });
    }
  }

  // 3 Historical Flash Sales
  const saleEvents = [
    {
      id: 'sale-01',
      name: 'Summer Kickoff Flash Sale',
      startDate: new Date('2026-06-20T00:00:00Z'),
      endDate: new Date('2026-06-22T00:00:00Z'), // 2 days
      discountPct: 20,
      plannedSpend: 500,
      actualSpend: 520,
      products: ['TSHIRT-BLK-M', 'MUG-WHT-01'],
    },
    {
      id: 'sale-02',
      name: 'Mid-Summer Promo',
      startDate: new Date('2026-07-15T00:00:00Z'),
      endDate: new Date('2026-07-17T00:00:00Z'), // 2 days
      discountPct: 25,
      plannedSpend: 750,
      actualSpend: 700,
      products: ['TSHIRT-BLK-M', 'HOODIE-GRY-L'],
    },
    {
      id: 'sale-03',
      name: 'August Clearance Flash Sale',
      startDate: new Date('2026-08-10T00:00:00Z'),
      endDate: new Date('2026-08-12T00:00:00Z'), // 2 days
      discountPct: 20,
      plannedSpend: 600,
      actualSpend: 650,
      products: ['TSHIRT-BLK-M', 'HOODIE-GRY-L', 'MUG-WHT-01'],
    },
  ];

  // Ground-truth actual sales during sales (with realistic 2.5x to 3.5x uplift)
  const actualsBySaleAndSku = new Map();
  // Sale 1 (June 20-22): 2 days. Normal = 20 units TSHIRT, 30 units MUG. With uplift = 65, 95
  actualsBySaleAndSku.set('sale-01:TSHIRT-BLK-M', { actualUnits: 65, stockoutOccurred: false });
  actualsBySaleAndSku.set('sale-01:MUG-WHT-01', { actualUnits: 95, stockoutOccurred: false });

  // Sale 2 (July 15-17): 2 days. TSHIRT 70, HOODIE 42
  actualsBySaleAndSku.set('sale-02:TSHIRT-BLK-M', { actualUnits: 70, stockoutOccurred: false });
  actualsBySaleAndSku.set('sale-02:HOODIE-GRY-L', { actualUnits: 42, stockoutOccurred: false });

  // Sale 3 (Aug 10-12): 2 days. TSHIRT 68, HOODIE 40, MUG 100
  actualsBySaleAndSku.set('sale-03:TSHIRT-BLK-M', { actualUnits: 68, stockoutOccurred: false });
  actualsBySaleAndSku.set('sale-03:HOODIE-GRY-L', { actualUnits: 40, stockoutOccurred: false });
  actualsBySaleAndSku.set('sale-03:MUG-WHT-01', { actualUnits: 100, stockoutOccurred: false });

  return { salesHistory, stockSnapshots, saleEvents, actualsBySaleAndSku };
}

async function runCli() {
  const isSampleFlag = process.argv.includes('--sample');
  let dbConnected = false;
  let saleEvents = [];
  let salesHistory = [];
  let stockSnapshots = [];
  const actualsBySaleAndSku = new Map();

  console.log('\n================================================================================');
  console.log('              INVENTORY DEMAND FORECASTER - BACKTEST RUNNER (E7)                ');
  console.log('================================================================================');
  console.log(
    'Methodology: Time-ordered historical validation strictly before each sale startDate.',
  );
  console.log('Invariant 1: Zero future data leakage (sales after target startDate are excluded).');
  console.log(
    'Invariant 2: Target sale uses plannedSpend only (actualSpend excluded from forecast).',
  );
  console.log('Baseline comparison: Model forecast vs Naive steady-state flat baseline.\n');

  try {
    if (!isSampleFlag && env.mongodbUri) {
      process.stdout.write('Connecting to MongoDB… ');
      await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 2500 });
      dbConnected = true;
      console.log('Connected.');

      saleEvents = await SaleEvent.find().lean();
      salesHistory = await SalesHistory.find().lean();
      stockSnapshots = await StockSnapshot.find().lean();
      const actuals = await Actual.find().lean();

      for (const a of actuals) {
        const sId = a.saleEvent?.toString();
        if (sId && a.sku) {
          actualsBySaleAndSku.set(`${sId}:${a.sku}`, {
            actualUnits: a.actualUnits,
            stockoutOccurred: Boolean(a.stockoutOccurred),
          });
        }
      }
    }
  } catch (err) {
    console.log(
      `Could not connect to database (${err.message}). Using benchmark historical scenario.`,
    );
  }

  // If DB was not connected or contained insufficient sales, run benchmark dataset
  if (!dbConnected || saleEvents.length < 2 || actualsBySaleAndSku.size === 0) {
    console.log(
      'Running backtest on standard benchmark historical sales dataset (3 flash sales, 90 days history)…\n',
    );
    const sample = generateBenchmarkSampleData();
    saleEvents = sample.saleEvents;
    salesHistory = sample.salesHistory;
    stockSnapshots = sample.stockSnapshots;
    for (const [k, v] of sample.actualsBySaleAndSku.entries()) {
      actualsBySaleAndSku.set(k, v);
    }
  } else {
    console.log(
      `Loaded ${saleEvents.length} sale events and ${salesHistory.length} sales records from database.\n`,
    );
  }

  const result = runTimeOrderedBacktest({
    saleEvents,
    salesHistory,
    stockSnapshots,
    actualsBySaleAndSku,
  });

  // Print Per-Sale Results
  console.log('--------------------------------------------------------------------------------');
  console.log('SALE EVENT BREAKDOWN:');
  console.log('--------------------------------------------------------------------------------');
  console.log(
    'Sale Name'.padEnd(28) +
      'Window'.padEnd(16) +
      'SKUs'.padStart(6) +
      'Actual'.padStart(8) +
      'Naive MAE'.padStart(11) +
      'Model MAE'.padStart(11) +
      'Improvement'.padStart(14) +
      'Within Range'.padStart(14),
  );
  console.log('-'.repeat(108));

  for (const s of result.saleReports) {
    const startStr = s.startDate ? new Date(s.startDate).toISOString().slice(5, 10) : '';
    const endStr = s.endDate ? new Date(s.endDate).toISOString().slice(5, 10) : '';
    const windowStr = `${startStr}→${endStr}`;

    console.log(
      s.saleName.slice(0, 26).padEnd(28) +
        windowStr.padEnd(16) +
        String(s.evaluatedSkus).padStart(6) +
        String(s.actualUnitsTotal).padStart(8) +
        `${s.naiveMae} u`.padStart(11) +
        `${s.modelMae} u`.padStart(11) +
        formatPercent(s.maeImprovementPct).padStart(14) +
        `${s.withinRangePct}%`.padStart(14),
    );
  }

  // Print Overall Performance Summary
  console.log('\n================================================================================');
  console.log('                         OVERALL BACKTEST PERFORMANCE                           ');
  console.log('================================================================================');
  console.log(
    `Evaluated Flash Sales:     ${result.evaluatedSalesCount} of ${result.totalSalesBacktested}`,
  );
  console.log(`Total SKU Forecasts:       ${result.totalEvaluations}`);
  console.log(`Total Units Demanded:      ${result.totalActualUnits.toLocaleString()} units`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Naive Baseline MAE:        ${result.naiveMae} units`);
  console.log(`Model Forecast MAE:        ${result.modelMae} units`);
  console.log(`MAE Error Reduction:       ${formatPercent(result.maeImprovementPct)} improvement`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Naive Baseline WAPE:       ${result.naiveWapePct}%`);
  console.log(`Model Forecast WAPE:       ${result.modelWapePct}%`);
  console.log(`WAPE Error Reduction:      ${formatPercent(result.wapeImprovementPct)} improvement`);
  console.log('--------------------------------------------------------------------------------');
  console.log(
    `Within-Range Coverage:     ${result.withinRangePct}% (${result.withinRangeCount} of ${result.totalEvaluations} in Low-High bounds)`,
  );
  console.log('================================================================================\n');

  if (dbConnected) {
    await mongoose.disconnect();
  }

  process.exit(0);
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error('Backtest script error:', err);
    process.exit(1);
  });
}

module.exports = {
  runCli,
  generateBenchmarkSampleData,
};
