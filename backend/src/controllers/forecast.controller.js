'use strict';

const forecastRunService = require('../services/forecastRun.service');
const scheduledStockoutCheckerService = require('../services/scheduledStockoutChecker.service');

async function runForecast(req, res, next) {
  try {
    const result = await forecastRunService.executeForecastRun(
      req.params.saleEventId,
      req.user.id,
      req.body.config || {},
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getLatestForecast(req, res, next) {
  try {
    const result = await forecastRunService.getLatestForecastRun(
      req.params.saleEventId,
      req.user.id,
    );
    if (!result) {
      return res.status(200).json({ forecastRun: null, forecasts: [] });
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getForecastRun(req, res, next) {
  try {
    const result = await forecastRunService.getForecastRunById(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function listForecastRuns(req, res, next) {
  try {
    const runs = await forecastRunService.listForecastRuns(req.params.saleEventId, req.user.id);
    res.status(200).json({ runs });
  } catch (err) {
    next(err);
  }
}

async function getAlerts(req, res, next) {
  try {
    const alerts = await forecastRunService.listStockoutAlerts(req.user.id);
    res.status(200).json({ alerts, totalAlerts: alerts.length });
  } catch (err) {
    next(err);
  }
}

async function checkStockouts(req, res, next) {
  try {
    const windowHours = req.body?.windowHours ? Number(req.body.windowHours) : 48;
    // Admins can trigger a sweep for all users; normal users only evaluate their own sales
    const userId = req.user.role === 'admin' && req.body?.allUsers ? null : req.user.id;
    const result = await scheduledStockoutCheckerService.checkUpcomingStockouts({
      windowHours,
      userId,
      autoRunMissing: req.body?.autoRunMissing ?? true,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  runForecast,
  getLatestForecast,
  getForecastRun,
  listForecastRuns,
  getAlerts,
  checkStockouts,
};
