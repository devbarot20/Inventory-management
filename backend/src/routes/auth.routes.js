'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, planSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/security');

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.getMe);
router.get('/usage', authenticate, authController.getUsage);
router.patch('/plan', authenticate, validate(planSchema), authController.updatePlan);
router.get('/admin-check', authenticate, authorize('admin'), authController.checkAdmin);

module.exports = router;
