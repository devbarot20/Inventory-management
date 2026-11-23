'use strict';

const { SaleEvent, User, ForecastRun, Forecast } = require('../models');
const { executeForecastRun } = require('./forecastRun.service');
const mailer = require('./mailer');

/**
 * Scans upcoming flash sales within a specified lookahead window (default 48h)
 * and verifies stockout hazards against the latest forecast.
 *
 * If any high-risk SKUs are identified, it dispatches automated stockout alert emails
 * to users with active notification preferences.
 *
 * @param {Object} [options]
 * @param {number} [options.windowHours=48] - Horizon in hours to check ahead for upcoming sales.
 * @param {string|null} [options.userId=null] - Restrict evaluation to a specific user (or null for all).
 * @param {boolean} [options.autoRunMissing=true] - Execute forecast if none exists yet.
 * @returns {Promise<Object>} Execution summary with evaluated sales and alert results.
 */
async function checkUpcomingStockouts({
  windowHours = 48,
  userId = null,
  autoRunMissing = true,
} = {}) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + Math.max(1, windowHours) * 3600 * 1000);

  const saleQuery = {
    startDate: { $gte: now, $lte: windowEnd },
  };
  if (userId) {
    saleQuery.createdBy = userId;
  }

  const upcomingSales = await SaleEvent.find(saleQuery).sort({ startDate: 1 }).lean();

  const results = [];
  let totalHighRiskItems = 0;
  let totalAlertsSent = 0;

  for (const sale of upcomingSales) {
    if (!sale.products || sale.products.length === 0) {
      continue;
    }

    // Identify the owning store manager / user
    let user = null;
    if (sale.createdBy) {
      user = await User.findById(sale.createdBy).lean();
      if (!user || user.deletedAt) {
        continue;
      }
    }

    // Locate latest completed forecast run
    let latestRun = await ForecastRun.findOne({ saleEvent: sale._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .lean();

    // If missing and auto-run is enabled, execute the forecasting engine
    if (!latestRun && autoRunMissing && sale.createdBy) {
      try {
        const runResult = await executeForecastRun(sale._id, sale.createdBy, {});
        latestRun = runResult.forecastRun;
      } catch (err) {
        results.push({
          saleEventId: sale._id.toString(),
          saleName: sale.name,
          startDate: sale.startDate,
          status: 'error',
          error: err.message,
        });
        continue;
      }
    }

    if (!latestRun) {
      results.push({
        saleEventId: sale._id.toString(),
        saleName: sale.name,
        startDate: sale.startDate,
        status: 'no_forecast',
      });
      continue;
    }

    // Fetch high-risk SKUs for this forecast run
    const highRiskForecasts = await Forecast.find({
      forecastRun: latestRun._id,
      riskLevel: 'high',
    }).lean();

    const highRiskCount = highRiskForecasts.length;
    totalHighRiskItems += highRiskCount;

    let emailSent = false;
    if (highRiskCount > 0 && user) {
      const emailEnabled = user.notificationPreferences?.emailStockoutAlerts !== false;
      if (emailEnabled && user.email) {
        try {
          await mailer.sendStockoutAlert(
            user.email,
            user.name || 'Store Manager',
            sale.name,
            highRiskForecasts,
          );
          emailSent = true;
          totalAlertsSent += 1;
        } catch {
          // Mailer errors should not abort check loop
        }
      }
    }

    results.push({
      saleEventId: sale._id.toString(),
      saleName: sale.name,
      startDate: sale.startDate,
      status: 'evaluated',
      highRiskCount,
      highRiskSkus: highRiskForecasts.map((f) => f.sku),
      emailSent,
    });
  }

  return {
    evaluatedAt: new Date().toISOString(),
    windowHours,
    totalSalesEvaluated: upcomingSales.length,
    totalHighRiskItems,
    totalAlertsSent,
    results,
  };
}

module.exports = {
  checkUpcomingStockouts,
};
