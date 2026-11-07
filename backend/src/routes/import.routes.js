'use strict';

const { Router } = require('express');
const importController = require('../controllers/import.controller');
const { authenticate } = require('../middleware/auth');
const { requireFeature } = require('../middleware/plan');

const router = Router();

// Import CSV via file upload or raw text payload
router.post(
  '/csv',
  authenticate,
  requireFeature('csvImport', 'CSV bulk import'),
  importController.upload.single('file'),
  importController.importCsv,
);

module.exports = router;
