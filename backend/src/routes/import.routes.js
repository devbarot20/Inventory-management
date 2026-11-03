'use strict';

const { Router } = require('express');
const importController = require('../controllers/import.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Import CSV via file upload or raw text payload
router.post(
  '/csv',
  authenticate,
  importController.upload.single('file'),
  importController.importCsv,
);

module.exports = router;
