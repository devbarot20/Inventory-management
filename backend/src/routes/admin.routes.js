'use strict';

const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { adminRateLimiter } = require('../middleware/security');

const router = Router();

// All admin routes require: valid JWT + admin role
// adminRateLimiter is applied first so unauthenticated bursts are also throttled.
router.use(adminRateLimiter, authenticate, authorize('admin'));

// Placeholder — controllers will be wired in Step 2 and Step 3
router.get('/ping', (req, res) => {
  res.status(200).json({ ok: true, role: req.user.role });
});

module.exports = router;
