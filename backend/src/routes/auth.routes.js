'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  planSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/security');

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.post(
  '/verify-email',
  authRateLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail,
);
router.post(
  '/resend-verification',
  authRateLimiter,
  authenticate,
  authController.resendVerification,
);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post(
  '/change-password',
  authRateLimiter,
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.get('/usage', authenticate, authController.getUsage);
router.patch('/plan', authenticate, validate(planSchema), authController.updatePlan);
router.get('/admin-check', authenticate, authorize('admin'), authController.checkAdmin);

module.exports = router;
