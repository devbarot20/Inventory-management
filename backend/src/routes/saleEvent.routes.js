'use strict';

const { Router } = require('express');
const saleEventController = require('../controllers/saleEvent.controller');
const validate = require('../middleware/validate');
const {
  saleEventCreateSchema,
  saleEventUpdateSchema,
} = require('../validators/saleEvent.validator');
const { authenticate } = require('../middleware/auth');
const { enforceLimit } = require('../middleware/plan');

const router = Router();

router.get('/', authenticate, saleEventController.listSaleEvents);
router.get('/:id', authenticate, saleEventController.getSaleEvent);

// Protected mutations
router.post(
  '/',
  authenticate,
  enforceLimit('campaigns'),
  validate(saleEventCreateSchema),
  saleEventController.createSaleEvent,
);
router.put(
  '/:id',
  authenticate,
  validate(saleEventUpdateSchema),
  saleEventController.updateSaleEvent,
);
router.delete('/:id', authenticate, saleEventController.deleteSaleEvent);

module.exports = router;
