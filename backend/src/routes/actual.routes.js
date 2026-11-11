'use strict';

const { Router } = require('express');
const actualController = require('../controllers/actual.controller');
const validate = require('../middleware/validate');
const { actualsSubmitSchema } = require('../validators/actual.validator');
const { authenticateVerified: authenticate } = require('../middleware/auth');

const router = Router();

// Read comparisons (owner only)
router.get('/comparison/:saleEventId', authenticate, actualController.getComparison);
router.get('/:saleEventId', authenticate, actualController.getActuals);

// Protected writes
router.post(
  '/:saleEventId',
  authenticate,
  validate(actualsSubmitSchema),
  actualController.recordActualsJson,
);

router.post(
  '/import/:saleEventId',
  authenticate,
  actualController.upload.single('file'),
  actualController.importActualsCsv,
);

router.delete('/:saleEventId/:sku', authenticate, actualController.deleteActualSku);
router.delete('/:saleEventId', authenticate, actualController.clearActuals);

module.exports = router;
