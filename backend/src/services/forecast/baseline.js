'use strict';

const { toUtcDay } = require('../../models/common');

const DEFAULT_CONFIG = {
  lookbackDays: 60, // examine last 60 days of history before the sale
  minNormalDays: 7, // require at least 7 normal days to form a baseline
};

/**
 * Checks if a date falls inside any sale event interval [startDate, endDate].
 */
function isDateInSaleEvent(date, saleEvents) {
  const time = date.getTime();
  for (const sale of saleEvents) {
    const start = new Date(sale.startDate).getTime();
    const end = new Date(sale.endDate).getTime();
    if (time >= start && time <= end) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates the baseline daily sales for a SKU before a target date.
 * Excludes:
 *  - past flash sale periods
 *  - stockout days (where unitsAvailable === 0 in snapshots)
 *
 * @param {Object} params
 * @param {string} params.sku
 * @param {Date|string} params.beforeDate - cut-off date (start of the upcoming sale)
 * @param {Array} params.salesHistory - array of { date, unitsSold }
 * @param {Array} params.stockSnapshots - array of { date, unitsAvailable }
 * @param {Array} params.saleEvents - array of past { startDate, endDate, name }
 * @param {Object} [params.config] - optional overrides for lookbackDays and minNormalDays
 *
 * @returns {Object} { baselineDailyUnits, normalDaysCount, normalDays, excludedSaleDays, excludedStockoutDays }
 */
function calculateBaseline({
  sku,
  beforeDate,
  salesHistory = [],
  stockSnapshots = [],
  saleEvents = [],
  config = {},
}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  const targetDate = toUtcDay(beforeDate);
  const earliestDate = new Date(targetDate.getTime() - options.lookbackDays * 24 * 60 * 60 * 1000);

  // Map of stockout dates: dateString -> boolean (true if unitsAvailable === 0)
  const stockoutDateSet = new Set();
  for (const snap of stockSnapshots) {
    if (snap.unitsAvailable === 0) {
      stockoutDateSet.add(toUtcDay(snap.date).toISOString().slice(0, 10));
    }
  }

  // Filter sales history to the lookback window before targetDate
  const candidateRows = salesHistory.filter((row) => {
    const rowDate = toUtcDay(row.date);
    return rowDate >= earliestDate && rowDate < targetDate;
  });

  const normalDays = [];
  let excludedSaleDays = 0;
  let excludedStockoutDays = 0;

  for (const row of candidateRows) {
    const rowDate = toUtcDay(row.date);
    const dateStr = rowDate.toISOString().slice(0, 10);

    // 1. Exclude if falls in a past sale period
    if (isDateInSaleEvent(rowDate, saleEvents)) {
      excludedSaleDays++;
      continue;
    }

    // 2. Exclude if this day had a stockout
    if (stockoutDateSet.has(dateStr)) {
      excludedStockoutDays++;
      continue;
    }

    normalDays.push({
      date: rowDate,
      unitsSold: row.unitsSold,
    });
  }

  if (normalDays.length < options.minNormalDays) {
    return {
      sku,
      hasEnoughData: false,
      reason: `Only ${normalDays.length} normal sales days found in lookback window (minimum required: ${options.minNormalDays})`,
      normalDaysCount: normalDays.length,
      baselineDailyUnits: null,
      excludedSaleDays,
      excludedStockoutDays,
    };
  }

  const totalUnits = normalDays.reduce((sum, d) => sum + d.unitsSold, 0);
  const baselineDailyUnits = Math.round((totalUnits / normalDays.length) * 100) / 100;

  return {
    sku,
    hasEnoughData: true,
    baselineDailyUnits,
    normalDaysCount: normalDays.length,
    normalDays,
    excludedSaleDays,
    excludedStockoutDays,
  };
}

module.exports = {
  calculateBaseline,
  isDateInSaleEvent,
  DEFAULT_CONFIG,
};
