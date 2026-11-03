'use strict';

const { SaleEvent, ForecastRun, Forecast, Actual } = require('../models');
const ApiError = require('../errors/ApiError');

/**
 * Pure evaluation for a single SKU comparing forecast vs actual sales.
 */
function evaluateSkuComparison({ forecast, actualUnits, stockoutOccurred }) {
  if (!forecast || forecast.status !== 'ok' || forecast.expected === null) {
    return {
      evaluated: false,
      actualUnits,
      stockoutOccurred: Boolean(stockoutOccurred),
      forecastStatus: forecast ? forecast.status : 'missing',
      low: null,
      expected: null,
      high: null,
      unitsAvailable: forecast?.unitsAvailable ?? null,
      riskLevel: forecast?.riskLevel ?? null,
      error: null,
      absoluteError: null,
      withinRange: null,
      warningCorrect: null,
      unitsShort: null,
      unitsLeftOver: null,
    };
  }

  const expected = forecast.expected;
  const low = forecast.low;
  const high = forecast.high;
  const unitsAvailable = forecast.unitsAvailable;
  const riskLevel = forecast.riskLevel;

  const error = Math.round(expected - actualUnits);
  const absoluteError = Math.abs(error);
  const withinRange = actualUnits >= low && actualUnits <= high;

  // Warning correctness
  let warningCorrect;
  if (stockoutOccurred) {
    // If stockout occurred, warning was correct if high or medium risk was alerted
    warningCorrect = riskLevel === 'high' || riskLevel === 'medium';
  } else {
    // If no stockout occurred, correct if low risk was predicted
    warningCorrect = riskLevel === 'low';
  }

  // Stock remaining or short
  let unitsLeftOver;
  let unitsShort;
  if (unitsAvailable !== null && unitsAvailable !== undefined) {
    unitsLeftOver = Math.max(0, Math.round(unitsAvailable - actualUnits));
    unitsShort = Math.max(0, Math.round(actualUnits - unitsAvailable));
  } else {
    unitsLeftOver = 0;
    unitsShort = 0;
  }

  return {
    evaluated: true,
    actualUnits,
    stockoutOccurred: Boolean(stockoutOccurred),
    forecastStatus: forecast.status,
    low,
    expected,
    high,
    unitsAvailable,
    riskLevel,
    error,
    absoluteError,
    withinRange,
    warningCorrect,
    unitsShort,
    unitsLeftOver,
  };
}

/**
 * Calculates aggregate summary metrics (MAE, WAPE, Bias, Within-Range, Warning Accuracy)
 * across an array of evaluated SKU comparisons.
 */
function computeAggregateMetrics(comparisons) {
  const evaluated = comparisons.filter((c) => c.evaluated);
  const totalSkus = comparisons.length;
  const evaluatedCount = evaluated.length;

  if (evaluatedCount === 0) {
    return {
      totalSkus,
      evaluatedSkus: 0,
      totalActualUnits: 0,
      totalExpectedUnits: 0,
      mae: 0,
      wapePct: 0,
      biasPct: 0,
      withinRangeCount: 0,
      withinRangePct: 0,
      warningCorrectCount: 0,
      warningAccuracyPct: 0,
      totalUnitsLeftOver: 0,
      totalUnitsShort: 0,
    };
  }

  let totalActualUnits = 0;
  let totalExpectedUnits = 0;
  let totalAbsoluteError = 0;
  let totalError = 0;
  let withinRangeCount = 0;
  let warningCorrectCount = 0;
  let totalUnitsLeftOver = 0;
  let totalUnitsShort = 0;

  for (const item of evaluated) {
    totalActualUnits += item.actualUnits;
    totalExpectedUnits += item.expected;
    totalAbsoluteError += item.absoluteError;
    totalError += item.error;
    if (item.withinRange) withinRangeCount += 1;
    if (item.warningCorrect) warningCorrectCount += 1;
    if (item.unitsLeftOver) totalUnitsLeftOver += item.unitsLeftOver;
    if (item.unitsShort) totalUnitsShort += item.unitsShort;
  }

  const mae = Number((totalAbsoluteError / evaluatedCount).toFixed(2));
  const wapePct =
    totalActualUnits > 0
      ? Number(((totalAbsoluteError / totalActualUnits) * 100).toFixed(2))
      : totalAbsoluteError === 0
        ? 0
        : 100;

  const biasPct =
    totalActualUnits > 0
      ? Number(((totalError / totalActualUnits) * 100).toFixed(2))
      : 0;

  const withinRangePct = Number(((withinRangeCount / evaluatedCount) * 100).toFixed(2));
  const warningAccuracyPct = Number(((warningCorrectCount / evaluatedCount) * 100).toFixed(2));

  return {
    totalSkus,
    evaluatedSkus: evaluatedCount,
    totalActualUnits,
    totalExpectedUnits,
    mae,
    wapePct,
    biasPct,
    withinRangeCount,
    withinRangePct,
    warningCorrectCount,
    warningAccuracyPct,
    totalUnitsLeftOver,
    totalUnitsShort,
  };
}

/**
 * Record actuals for a sale event, compute error metrics against the latest forecast run,
 * and save to the Actual collection.
 */
async function recordActuals({ saleEventId, actualRecords, actualSpend }) {
  const saleEvent = await SaleEvent.findById(saleEventId);
  if (!saleEvent) {
    throw ApiError.notFound('Flash sale event not found');
  }

  // Find latest forecast run
  const latestRun = await ForecastRun.findOne({ saleEvent: saleEventId }).sort({ runAt: -1 });
  const forecasts = latestRun
    ? await Forecast.find({ forecastRun: latestRun._id }).lean()
    : [];

  const forecastBySku = new Map();
  for (const f of forecasts) {
    forecastBySku.set(f.sku, f);
  }

  const results = [];

  for (const rec of actualRecords) {
    const sku = (rec.sku || '').trim().toUpperCase();
    const actualUnits = Math.round(Number(rec.actualUnits));
    const stockoutOccurred =
      rec.stockoutOccurred === true ||
      rec.stockoutOccurred === 'true' ||
      rec.stockoutOccurred === 1 ||
      rec.stockoutOccurred === '1';

    const forecastDoc = forecastBySku.get(sku);
    const evaluation = evaluateSkuComparison({
      forecast: forecastDoc,
      actualUnits,
      stockoutOccurred,
    });

    // Upsert into Actual model
    const savedActual = await Actual.findOneAndUpdate(
      { saleEvent: saleEvent._id, sku },
      {
        saleEvent: saleEvent._id,
        sku,
        forecast: forecastDoc?._id || null,
        actualUnits,
        stockoutOccurred,
        errorMeasures: {
          error: evaluation.error,
          absoluteError: evaluation.absoluteError,
          withinRange: evaluation.withinRange,
          warningCorrect: evaluation.warningCorrect,
          unitsShort: evaluation.unitsShort,
          unitsLeftOver: evaluation.unitsLeftOver,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );

    results.push({
      id: savedActual._id.toString(),
      sku,
      ...evaluation,
    });
  }

  // Update actualSpend on SaleEvent if supplied
  if (actualSpend !== undefined && actualSpend !== null && !isNaN(Number(actualSpend))) {
    saleEvent.actualSpend = Number(actualSpend);
    await saleEvent.save();
  }

  const summary = computeAggregateMetrics(results);

  return {
    saleEvent: {
      id: saleEvent._id.toString(),
      name: saleEvent.name,
      startDate: saleEvent.startDate,
      endDate: saleEvent.endDate,
      plannedSpend: saleEvent.plannedSpend,
      actualSpend: saleEvent.actualSpend,
      discountPct: saleEvent.discountPct,
    },
    forecastRun: latestRun
      ? {
          id: latestRun._id.toString(),
          runAt: latestRun.runAt,
          algorithmVersion: latestRun.algorithmVersion,
        }
      : null,
    summary,
    comparisons: results,
  };
}

/**
 * Get forecast vs actual comparison data for a given sale event.
 */
async function getComparison(saleEventId) {
  const saleEvent = await SaleEvent.findById(saleEventId);
  if (!saleEvent) {
    throw ApiError.notFound('Flash sale event not found');
  }

  const latestRun = await ForecastRun.findOne({ saleEvent: saleEventId }).sort({ runAt: -1 });
  const forecasts = latestRun
    ? await Forecast.find({ forecastRun: latestRun._id }).lean()
    : [];

  const actuals = await Actual.find({ saleEvent: saleEventId }).lean();

  const forecastBySku = new Map();
  for (const f of forecasts) {
    forecastBySku.set(f.sku, f);
  }

  const comparisons = [];
  const actualSkuSet = new Set();

  for (const a of actuals) {
    actualSkuSet.add(a.sku);
    const forecastDoc = forecastBySku.get(a.sku);
    const evalData = evaluateSkuComparison({
      forecast: forecastDoc,
      actualUnits: a.actualUnits,
      stockoutOccurred: a.stockoutOccurred,
    });

    comparisons.push({
      id: a._id.toString(),
      sku: a.sku,
      ...evalData,
    });
  }

  // Also include any forecast SKUs that don't have actuals recorded yet
  for (const f of forecasts) {
    if (!actualSkuSet.has(f.sku)) {
      comparisons.push({
        id: null,
        sku: f.sku,
        evaluated: false,
        actualUnits: null,
        stockoutOccurred: null,
        forecastStatus: f.status,
        low: f.low,
        expected: f.expected,
        high: f.high,
        unitsAvailable: f.unitsAvailable,
        riskLevel: f.riskLevel,
        error: null,
        absoluteError: null,
        withinRange: null,
        warningCorrect: null,
        unitsShort: null,
        unitsLeftOver: null,
      });
    }
  }

  const summary = computeAggregateMetrics(comparisons);

  return {
    saleEvent: {
      id: saleEvent._id.toString(),
      name: saleEvent.name,
      startDate: saleEvent.startDate,
      endDate: saleEvent.endDate,
      plannedSpend: saleEvent.plannedSpend,
      actualSpend: saleEvent.actualSpend,
      discountPct: saleEvent.discountPct,
    },
    forecastRun: latestRun
      ? {
          id: latestRun._id.toString(),
          runAt: latestRun.runAt,
          algorithmVersion: latestRun.algorithmVersion,
        }
      : null,
    summary,
    comparisons,
  };
}

module.exports = {
  evaluateSkuComparison,
  computeAggregateMetrics,
  recordActuals,
  getComparison,
};
