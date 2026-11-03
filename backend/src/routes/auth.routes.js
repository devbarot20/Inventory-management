'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/security');

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/admin-check', authenticate, authorize('admin'), authController.checkAdmin);

module.exports = router;
