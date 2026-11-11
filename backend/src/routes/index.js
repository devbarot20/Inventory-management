'use strict';

const { Router } = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const stockRoutes = require('./stock.routes');
const importRoutes = require('./import.routes');
const saleEventRoutes = require('./saleEvent.routes');
const forecastRoutes = require('./forecast.routes');
const actualRoutes = require('./actual.routes');
const demoRoutes = require('./demo.routes');
const billingRoutes = require('./billing.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);
router.use('/import', importRoutes);
router.use('/sales', saleEventRoutes);
router.use('/forecast', forecastRoutes);
router.use('/actuals', actualRoutes);
router.use('/demo', demoRoutes);
router.use('/billing', billingRoutes);

module.exports = router;
