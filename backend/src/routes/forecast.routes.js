'use strict';

const { Router } = require('express');
const forecastController = require('../controllers/forecast.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Execute forecast run for a sale event
router.post('/run/:saleEventId', authenticate, forecastController.runForecast);

// Retrieve latest forecast run for a sale event
router.get('/latest/:saleEventId', authenticate, forecastController.getLatestForecast);

// Retrieve specific forecast run by run ID
router.get('/run/:id', authenticate, forecastController.getForecastRun);

// List historical runs for a sale event
router.get('/runs/:saleEventId', authenticate, forecastController.listForecastRuns);

module.exports = router;
