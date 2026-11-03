'use strict';

const { calculateBaseline, isDateInSaleEvent } = require('./baseline');
const {
  findSimilarSalesAndUplift,
  didSalePeriodHaveStockout,
  getSalesDuringPeriod,
} = require('./similarSales');
const { applyOptionalSpendAdjustment } = require('./spendAdjustment');
const { forecastProductDemand, forecastSaleEventDemand } = require('./forecaster');

module.exports = {
  calculateBaseline,
  isDateInSaleEvent,
  findSimilarSalesAndUplift,
  didSalePeriodHaveStockout,
  getSalesDuringPeriod,
  applyOptionalSpendAdjustment,
  forecastProductDemand,
  forecastSaleEventDemand,
};
