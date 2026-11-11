'use strict';

const { Router } = require('express');
const demoController = require('../controllers/demo.controller');
const { authenticateVerified: authenticate } = require('../middleware/auth');

const router = Router();

// Load complete sample store demo data
router.post('/seed', authenticate, demoController.seedDemo);

// Clear demo data
router.post('/clear', authenticate, demoController.clearDemo);

module.exports = router;
