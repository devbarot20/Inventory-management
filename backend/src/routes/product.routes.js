'use strict';

const { Router } = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const { productCreateSchema, productUpdateSchema } = require('../validators/product.validator');
const { authenticate } = require('../middleware/auth');
const { enforceLimit } = require('../middleware/plan');

const router = Router();

// Products list and details
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);

// Protected mutation endpoints
router.post('/', authenticate, enforceLimit('products'), validate(productCreateSchema), productController.createProduct);
router.put('/:id', authenticate, validate(productUpdateSchema), productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

module.exports = router;
