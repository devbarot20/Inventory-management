'use strict';

const forecastRunService = require('../services/forecastRun.service');

async function runForecast(req, res, next) {
  try {
    const result = await forecastRunService.executeForecastRun(
      req.params.saleEventId,
      req.user?.id,
      req.body.config || {},
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getLatestForecast(req, res, next) {
  try {
    const result = await forecastRunService.getLatestForecastRun(req.params.saleEventId);
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
    const result = await forecastRunService.getForecastRunById(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function listForecastRuns(req, res, next) {
  try {
    const runs = await forecastRunService.listForecastRuns(req.params.saleEventId);
    res.status(200).json({ runs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  runForecast,
  getLatestForecast,
  getForecastRun,
  listForecastRuns,
};

