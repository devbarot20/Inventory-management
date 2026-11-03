'use strict';

const { toUtcDay } = require('../../models/common');
const { calculateBaseline } = require('./baseline');

const DEFAULT_SIMILARITY_CONFIG = {
  durationToleranceDays: 1.5, // similar duration if within +/- 1.5 days
  discountTolerancePct: 15, // similar discount if within +/- 15 percentage points
  excludeStockoutSales: true, // exclude past sales that had stockouts to prevent understated uplift
};

function getDurationInDays(start, end) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round((diff / (1000 * 60 * 60 * 24)) * 10) / 10);
}

/**
 * Checks if a past sale period experienced a stockout for a specific SKU.
 */
function didSalePeriodHaveStockout(sale, stockSnapshots) {
  const saleStart = toUtcDay(sale.startDate).getTime();
  const saleEnd = toUtcDay(sale.endDate).getTime();

  for (const snap of stockSnapshots) {
    const snapTime = toUtcDay(snap.date).getTime();
    if (snapTime >= saleStart && snapTime <= saleEnd) {
      if (snap.unitsAvailable === 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Calculates average daily sales for a SKU during a specific past sale period.
 */
function getSalesDuringPeriod(startDate, endDate, salesHistory) {
  const start = toUtcDay(startDate).getTime();
  const end = toUtcDay(endDate).getTime();

  const saleRows = salesHistory.filter((row) => {
    const rowTime = toUtcDay(row.date).getTime();
    return rowTime >= start && rowTime <= end;
  });

  const durationDays = getDurationInDays(startDate, endDate);
  const totalUnits = saleRows.reduce((sum, r) => sum + r.unitsSold, 0);

  return {
    totalUnits,
    durationDays,
    averageDailyUnits: durationDays > 0 ? totalUnits / durationDays : 0,
    daysRecorded: saleRows.length,
  };
}

/**
 * Finds similar past sales and calculates their uplift ratios over baseline.
 *
 * @param {Object} params
 * @param {string} params.sku
 * @param {Object} params.targetSale - upcoming sale { startDate, endDate, discountPct, plannedSpend }
 * @param {Array} params.pastSales - all past sales occurring before targetSale.startDate
 * @param {Array} params.salesHistory - historical sales rows for this SKU
 * @param {Array} params.stockSnapshots - historical stock snapshots for this SKU
 * @param {Object} [params.config] - similarity config
 */
function findSimilarSalesAndUplift({
  sku,
  targetSale,
  pastSales = [],
  salesHistory = [],
  stockSnapshots = [],
  config = {},
}) {
  const options = { ...DEFAULT_SIMILARITY_CONFIG, ...config };
  const targetDuration = getDurationInDays(targetSale.startDate, targetSale.endDate);
  const targetDiscount = Number(targetSale.discountPct || 0);
  const targetStartTime = new Date(targetSale.startDate).getTime();

  const candidateSales = pastSales.filter((s) => {
    const saleEndTime = new Date(s.endDate).getTime();
    // Must strictly precede the target sale
    return saleEndTime < targetStartTime;
  });

  const similarSalesFound = [];
  const flaggedSales = [];
  const assumptions = [];
  const dataQualityFlags = [];

  for (const pastSale of candidateSales) {
    const pastDuration = getDurationInDays(pastSale.startDate, pastSale.endDate);
    const pastDiscount = Number(pastSale.discountPct || 0);

    const durationDiff = Math.abs(pastDuration - targetDuration);
    const discountDiff = Math.abs(pastDiscount - targetDiscount);

    // Similarity criterion
    const isSimilarDuration = durationDiff <= options.durationToleranceDays;
    const isSimilarDiscount = discountDiff <= options.discountTolerancePct;

    if (!isSimilarDuration || !isSimilarDiscount) {
      continue;
    }

    // Check if product was included in this past sale
    if (pastSale.products && pastSale.products.length > 0 && !pastSale.products.includes(sku)) {
      continue;
    }

    // Check for stockout during this past sale
    const hadStockout = didSalePeriodHaveStockout(pastSale, stockSnapshots);

    if (hadStockout) {
      flaggedSales.push({
        saleId: pastSale.id || pastSale._id,
        name: pastSale.name,
        reason: 'Demand possibly understated due to stockout during sale',
      });
      dataQualityFlags.push(
        `Past sale "${pastSale.name}" had a stockout; demand possibly understated.`,
      );

      if (options.excludeStockoutSales) {
        continue; // Exclude to avoid pulling down the forecast
      }
    }

    // Compute baseline prior to that past sale
    const priorBaselineResult = calculateBaseline({
      sku,
      beforeDate: pastSale.startDate,
      salesHistory,
      stockSnapshots,
      saleEvents: pastSales.filter((p) => p.id !== pastSale.id),
      config,
    });

    const priorBaseline =
      priorBaselineResult.hasEnoughData && priorBaselineResult.baselineDailyUnits > 0
        ? priorBaselineResult.baselineDailyUnits
        : null;

    // Sales volume during the past sale
    const saleSales = getSalesDuringPeriod(pastSale.startDate, pastSale.endDate, salesHistory);

    if (saleSales.totalUnits === 0 && (!priorBaseline || priorBaseline === 0)) {
      continue;
    }

    let upliftRatio;
    if (priorBaseline && priorBaseline > 0) {
      upliftRatio = saleSales.averageDailyUnits / priorBaseline;
    } else {
      // Fallback if prior baseline wasn't available
      upliftRatio = Math.max(1.2, 1 + pastDiscount / 50);
    }

    // Round to 2 decimal places
    upliftRatio = Math.round(upliftRatio * 100) / 100;

    similarSalesFound.push({
      saleId: pastSale.id || pastSale._id,
      name: pastSale.name,
      startDate: pastSale.startDate,
      endDate: pastSale.endDate,
      durationDays: pastDuration,
      discountPct: pastDiscount,
      priorBaselineDailyUnits: priorBaseline,
      saleAverageDailyUnits: Math.round(saleSales.averageDailyUnits * 100) / 100,
      totalUnitsSold: saleSales.totalUnits,
      upliftRatio,
      hadStockout,
    });
  }

  // Calculate spread: low, expected, high uplifts
  let upliftSummary;

  if (similarSalesFound.length > 0) {
    const uplifts = similarSalesFound.map((s) => s.upliftRatio).sort((a, b) => a - b);

    if (uplifts.length === 1) {
      const single = uplifts[0];
      upliftSummary = {
        low: Math.max(1.0, Math.round(single * 0.8 * 100) / 100),
        expected: single,
        high: Math.round(single * 1.25 * 100) / 100,
        similarCount: 1,
      };
      assumptions.push(
        `Uplift based on 1 similar past sale ("${similarSalesFound[0].name}") with +/-20-25% uncertainty spread.`,
      );
    } else {
      const minUplift = uplifts[0];
      const maxUplift = uplifts[uplifts.length - 1];
      const medianUplift =
        uplifts.length % 2 === 1
          ? uplifts[Math.floor(uplifts.length / 2)]
          : Math.round(
              ((uplifts[uplifts.length / 2 - 1] + uplifts[uplifts.length / 2]) / 2) * 100,
            ) / 100;

      upliftSummary = {
        low: Math.max(1.0, minUplift),
        expected: medianUplift,
        high: Math.max(medianUplift, maxUplift),
        similarCount: uplifts.length,
      };
      assumptions.push(
        `Uplift derived from ${uplifts.length} similar past sales (spread: ${minUplift.toFixed(2)}x - ${maxUplift.toFixed(2)}x).`,
      );
    }
  } else {
    // No similar past sales found - use transparent discount-based heuristic
    const expectedUplift = Math.round((1 + (targetDiscount / 100) * 2.5) * 100) / 100;
    const lowUplift = Math.round((1 + (targetDiscount / 100) * 1.5) * 100) / 100;
    const highUplift = Math.round((1 + (targetDiscount / 100) * 3.8) * 100) / 100;

    upliftSummary = {
      low: Math.max(1.0, lowUplift),
      expected: Math.max(1.1, expectedUplift),
      high: Math.max(1.2, highUplift),
      similarCount: 0,
    };
    assumptions.push(
      `No earlier sales with similar discount/length found. Uplift estimated from discount rate (${targetDiscount}%) with heuristic spread.`,
    );
  }

  return {
    sku,
    similarSalesFound,
    flaggedSales,
    upliftSummary,
    assumptions,
    dataQualityFlags,
  };
}

module.exports = {
  findSimilarSalesAndUplift,
  didSalePeriodHaveStockout,
  getSalesDuringPeriod,
  getDurationInDays,
  DEFAULT_SIMILARITY_CONFIG,
};
