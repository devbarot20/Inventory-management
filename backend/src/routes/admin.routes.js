'use strict';

const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { adminRateLimiter } = require('../middleware/security');
const validate = require('../middleware/validate');
const adminController = require('../controllers/admin.controller');
const { adminUpdateRoleSchema, adminUpdatePlanSchema } = require('../validators/admin.validator');

const router = Router();

// All admin routes require: valid JWT + admin role (applied to every route in this router)
router.use(adminRateLimiter, authenticate, authorize('admin'));

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/role', validate(adminUpdateRoleSchema), adminController.updateUserRole);
router.patch('/users/:id/plan', validate(adminUpdatePlanSchema), adminController.updateUserPlan);
router.delete('/users/:id', adminController.deleteUser);

// ── Stats (wired in Step 3) ───────────────────────────────────────────────────
// router.get('/stats', adminController.getStats);

module.exports = router;
