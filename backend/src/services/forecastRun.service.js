'use strict';

const mongoose = require('mongoose');
const { User, SaleEvent, SalesHistory, StockSnapshot, ForecastRun, Forecast } = require('../models');
const ApiError = require('../errors/ApiError');
const { toOwnerId, findOwnedSaleEvent } = require('../utils/ownership');
const { forecastProductDemand } = require('./forecast');
const { evaluateStockoutRisk } = require('./forecast/stockoutRisk');
const { getDurationInDays } = require('./forecast/similarSales');
const mailer = require('./mailer');

async function executeForecastRun(saleEventId, userId, customConfig = {}) {
  const owner = toOwnerId(userId);
  const saleEvent = await findOwnedSaleEvent(SaleEvent, saleEventId, owner);

  if (!saleEvent.products || saleEvent.products.length === 0) {
    throw ApiError.badRequest(
      'Sale event has no linked products. Add products before forecasting.',
    );
  }

  const skus = saleEvent.products;
  const durationDays = getDurationInDays(saleEvent.startDate, saleEvent.endDate);

  // 1. Load historical sales and snapshots for linked SKUs
  const [salesHistory, stockSnapshots, pastSales] = await Promise.all([
    SalesHistory.find({ createdBy: owner, sku: { $in: skus } })
      .sort({ date: 1 })
      .lean(),
    StockSnapshot.find({ createdBy: owner, sku: { $in: skus } })
      .sort({ date: 1 })
      .lean(),
    SaleEvent.find({
      createdBy: owner,
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

  // 4. Send stockout alert email if any SKU is high risk
  const highRiskItems = perSkuResults.filter((r) => r.riskLevel === 'high');
  if (highRiskItems.length > 0) {
    try {
      const user = await User.findById(owner).lean();
      if (user?.email && user.notificationPreferences?.emailStockoutAlerts !== false) {
        await mailer.sendStockoutAlert(user.email, user.name, saleEvent.name, highRiskItems);
      }
    } catch (err) {
      console.error(`Stockout alert email failed: ${err.message}`);
    }
  }

  return {
    forecastRun: forecastRun.toJSON(),
    forecasts: savedForecasts.map((f) => f.toJSON()),
  };
}

async function getLatestForecastRun(saleEventId, userId) {
  await findOwnedSaleEvent(SaleEvent, saleEventId, userId, { lean: true });
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

async function getForecastRunById(runId, userId) {
  const owner = toOwnerId(userId);
  const run = mongoose.isValidObjectId(runId)
    ? await ForecastRun.findOne({ _id: runId, createdBy: owner }).lean()
    : null;
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

async function listForecastRuns(saleEventId, userId) {
  await findOwnedSaleEvent(SaleEvent, saleEventId, userId, { lean: true });
  const runs = await ForecastRun.find({ saleEvent: saleEventId }).sort({ createdAt: -1 }).lean();

  return runs.map((r) => ({
    id: r._id.toString(),
    createdAt: r.createdAt,
    status: r.status,
    methodVersion: r.methodVersion,
    inputs: r.inputs,
  }));
}

/**
 * Returns active stockout risk alerts (high & medium risk SKUs) across the user's sale events.
 */
async function listStockoutAlerts(userId) {
  const owner = toOwnerId(userId);
  const events = await SaleEvent.find({ createdBy: owner }).sort({ startDate: -1 }).lean();
  if (events.length === 0) return [];

  const alerts = [];
  for (const event of events) {
    // eslint-disable-next-line no-await-in-loop
    const latestRun = await ForecastRun.findOne({ saleEvent: event._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .lean();
    if (!latestRun) continue;

    // eslint-disable-next-line no-await-in-loop
    const risky = await Forecast.find({
      forecastRun: latestRun._id,
      riskLevel: { $in: ['high', 'medium'] },
    })
      .sort({ riskLevel: 1, sku: 1 })
      .lean();

    for (const f of risky) {
      const reorderUnits =
        f.unitsAvailable !== null && f.unitsAvailable !== undefined && f.high !== null
          ? Math.max(0, Math.ceil(f.high - f.unitsAvailable))
          : null;
      alerts.push({
        id: `${event._id.toString()}:${f.sku}`,
        saleEventId: event._id.toString(),
        saleName: event.name,
        startDate: event.startDate,
        sku: f.sku,
        riskLevel: f.riskLevel,
        unitsAvailable: f.unitsAvailable,
        expected: f.expected,
        high: f.high,
        reorderUnits,
        expectedRunOutTime: f.expectedRunOutTime,
      });
    }
  }

  // Sort high risk first
  alerts.sort((a, b) => (a.riskLevel === 'high' ? -1 : 1) - (b.riskLevel === 'high' ? -1 : 1));
  return alerts;
}

module.exports = {
  executeForecastRun,
  getLatestForecastRun,
  getForecastRunById,
  listForecastRuns,
  listStockoutAlerts,
};
