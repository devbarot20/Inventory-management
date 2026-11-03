'use strict';

const { SaleEvent, SalesHistory, StockSnapshot, ForecastRun, Forecast } = require('../models');
const ApiError = require('../errors/ApiError');
const { forecastProductDemand } = require('./forecast');
const { evaluateStockoutRisk } = require('./forecast/stockoutRisk');
const { getDurationInDays } = require('./forecast/similarSales');

async function executeForecastRun(saleEventId, userId, customConfig = {}) {
  const saleEvent = await SaleEvent.findById(saleEventId);
  if (!saleEvent) {
    throw ApiError.notFound('Sale event not found');
  }

  if (!saleEvent.products || saleEvent.products.length === 0) {
    throw ApiError.badRequest(
      'Sale event has no linked products. Add products before forecasting.',
    );
  }

  const skus = saleEvent.products;
  const durationDays = getDurationInDays(saleEvent.startDate, saleEvent.endDate);

  // 1. Load historical sales and snapshots for linked SKUs
  const [salesHistory, stockSnapshots, pastSales] = await Promise.all([
    SalesHistory.find({ sku: { $in: skus } })
      .sort({ date: 1 })
      .lean(),
    StockSnapshot.find({ sku: { $in: skus } })
      .sort({ date: 1 })
      .lean(),
    SaleEvent.find({
      _id: { $ne: saleEvent._id },
      endDate: { $lt: saleEvent.startDate },
    })
      .sort({ startDate: -1 })
      .lean(),
  ]);

  // Group sales and snapshots by SKU
  const salesBySku = new Map();
  const stockBySku = new Map();
  const latestStockBySku = new Map();

  for (const sku of skus) {
    salesBySku.set(sku, []);
    stockBySku.set(sku, []);
  }

  for (const s of salesHistory) {
    if (salesBySku.has(s.sku)) {
      salesBySku.get(s.sku).push(s);
    }
  }

  for (const st of stockSnapshots) {
    if (stockBySku.has(st.sku)) {
      stockBySku.get(st.sku).push(st);
      // Track latest snapshot
      const current = latestStockBySku.get(st.sku);
      if (!current || new Date(st.date) >= new Date(current.date)) {
        latestStockBySku.set(st.sku, st);
      }
    }
  }

  const runAssumptions = new Set([
    'Forecasts are scenario estimates based on historical baseline sales and past similar promotions.',
    'Planned influencer ad spend is an input assumption and does not guarantee sales.',
  ]);
  const runDataQualityFlags = new Set();

  const perSkuResults = [];

  for (const sku of skus) {
    const skuSales = salesBySku.get(sku) || [];
    const skuStock = stockBySku.get(sku) || [];
    const latestSnapshot = latestStockBySku.get(sku);
    const unitsAvailable = latestSnapshot ? latestSnapshot.unitsAvailable : null;

    // Run core forecast algorithm
    const forecastResult = forecastProductDemand({
      sku,
      targetSale: saleEvent,
      salesHistory: skuSales,
      stockSnapshots: skuStock,
      pastSales,
      config: customConfig,
    });

    // Evaluate stockout risk and expected run-out time
    const riskResult = evaluateStockoutRisk({
      low: forecastResult.low,
      expected: forecastResult.expected,
      high: forecastResult.high,
      unitsAvailable,
      startDate: saleEvent.startDate,
      durationDays,
    });

    // Aggregate assumptions
    for (const a of forecastResult.assumptions || []) {
      runAssumptions.add(a);
    }
    for (const f of forecastResult.dataQualityFlags || []) {
      runDataQualityFlags.add(f);
    }

    perSkuResults.push({
      sku,
      status: forecastResult.status,
      low: forecastResult.low,
      expected: forecastResult.expected,
      high: forecastResult.high,
      unitsAvailable,
      riskLevel: riskResult.riskLevel,
      expectedRunOutTime: riskResult.expectedRunOutTime,
      riskReason: riskResult.riskReason,
      baselineDailyUnits: forecastResult.baselineDailyUnits,
      upliftRatio: forecastResult.upliftRatio,
      similarSalesUsed: forecastResult.similarSalesUsed || 0,
      assumptions: forecastResult.assumptions || [],
      dataQualityFlags: forecastResult.dataQualityFlags || [],
    });
  }

  // 2. Persist ForecastRun document
  const forecastRun = await ForecastRun.create({
    saleEvent: saleEvent._id,
    createdBy: userId || null,
    status: 'completed',
    methodVersion: 'baseline-similar-sales-v1',
    inputs: {
      startDate: saleEvent.startDate,
      endDate: saleEvent.endDate,
      discountPct: saleEvent.discountPct,
      plannedSpend: saleEvent.plannedSpend,
      skus,
    },
    config: customConfig,
    assumptions: Array.from(runAssumptions),
    dataQualityFlags: Array.from(runDataQualityFlags),
  });

  // 3. Persist Forecast documents per SKU
  const forecastDocs = perSkuResults.map((r) => ({
    forecastRun: forecastRun._id,
    saleEvent: saleEvent._id,
    sku: r.sku,
    status: r.status,
    low: r.low,
    expected: r.expected,
    high: r.high,
    unitsAvailable: r.unitsAvailable,
    riskLevel: r.riskLevel,
    expectedRunOutTime: r.expectedRunOutTime,
    baselineDailyUnits: r.baselineDailyUnits,
    upliftRatio: r.upliftRatio,
    similarSalesUsed: r.similarSalesUsed,
    assumptions: r.assumptions,
    dataQualityFlags: r.dataQualityFlags,
  }));

  const savedForecasts = await Forecast.insertMany(forecastDocs);

  return {
    forecastRun: forecastRun.toJSON(),
    forecasts: savedForecasts.map((f) => f.toJSON()),
  };
}

async function getLatestForecastRun(saleEventId) {
  const run = await ForecastRun.findOne({ saleEvent: saleEventId, status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  if (!run) {
    return null;
  }

  const forecasts = await Forecast.find({ forecastRun: run._id }).sort({ sku: 1 }).lean();

  return {
    forecastRun: {
      ...run,
      id: run._id.toString(),
    },
    forecasts: forecasts.map((f) => ({
      ...f,
      id: f._id.toString(),
    })),
  };
}

async function getForecastRunById(runId) {
  const run = await ForecastRun.findById(runId).lean();
  if (!run) {
    throw ApiError.notFound('Forecast run not found');
  }

  const forecasts = await Forecast.find({ forecastRun: run._id }).sort({ sku: 1 }).lean();

  return {
    forecastRun: {
      ...run,
      id: run._id.toString(),
    },
    forecasts: forecasts.map((f) => ({
      ...f,
      id: f._id.toString(),
    })),
  };
}

async function listForecastRuns(saleEventId) {
  const runs = await ForecastRun.find({ saleEvent: saleEventId }).sort({ createdAt: -1 }).lean();

  return runs.map((r) => ({
    id: r._id.toString(),
    createdAt: r.createdAt,
    status: r.status,
    methodVersion: r.methodVersion,
    inputs: r.inputs,
  }));
}

module.exports = {
  executeForecastRun,
  getLatestForecastRun,
  getForecastRunById,
  listForecastRuns,
};
