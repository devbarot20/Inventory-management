'use strict';

const { Router } = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const { stockSnapshotCreateSchema } = require('../validators/product.validator');
const { authenticateVerified: authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, productController.getStock);
router.post('/', authenticate, validate(stockSnapshotCreateSchema), productController.recordStock);

module.exports = router;
