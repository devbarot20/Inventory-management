'use strict';

const { Router } = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const {
  productCreateSchema,
  productUpdateSchema,
  variantMatrixSchema,
} = require('../validators/product.validator');
const { authenticateVerified: authenticate } = require('../middleware/auth');
const { enforceLimit } = require('../middleware/plan');

const router = Router();

// Products list and details
router.get('/', authenticate, productController.listProducts);
router.get('/:id', authenticate, productController.getProduct);

// Batch variant matrix generator
router.post(
  '/variants/matrix',
  authenticate,
  validate(variantMatrixSchema),
  productController.generateVariantMatrix,
);

// Protected mutation endpoints
router.post(
  '/',
  authenticate,
  enforceLimit('products'),
  validate(productCreateSchema),
  productController.createProduct,
);
router.put('/:id', authenticate, validate(productUpdateSchema), productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

module.exports = router;
