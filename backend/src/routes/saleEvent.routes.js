'use strict';

const { Router } = require('express');
const saleEventController = require('../controllers/saleEvent.controller');
const validate = require('../middleware/validate');
const {
  saleEventCreateSchema,
  saleEventUpdateSchema,
} = require('../validators/saleEvent.validator');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', saleEventController.listSaleEvents);
router.get('/:id', saleEventController.getSaleEvent);

// Protected mutations
router.post(
  '/',
  authenticate,
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
