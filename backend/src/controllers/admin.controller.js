'use strict';

const adminService = require('../services/admin.service');

/** GET /api/admin/users?search=&page=&limit= */
async function listUsers(req, res, next) {
  try {
    const { search, page, limit } = req.query;
    const result = await adminService.listUsers({ search, page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users/:id */
async function getUser(req, res, next) {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/users/:id/role  — body: { role: 'admin' | 'user' } */
async function updateUserRole(req, res, next) {
  try {
    const user = await adminService.updateUserRole(
      req.params.id,
      req.body.role,
      req.user,
      { ip: req.ip, userAgent: req.get('user-agent') },
    );
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/users/:id/plan  — body: { plan: 'starter' | 'growth' | 'scale' } */
async function updateUserPlan(req, res, next) {
  try {
    const user = await adminService.updateUserPlan(
      req.params.id,
      req.body.plan,
      req.user,
      { ip: req.ip, userAgent: req.get('user-agent') },
    );
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/users/:id  — soft-delete */
async function deleteUser(req, res, next) {
  try {
    const result = await adminService.deleteUser(req.params.id, req.user, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/stats */
async function getStats(req, res, next) {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/audit-logs?page=1&limit=20&action= */
async function listAuditLogs(req, res, next) {
  try {
    const { action, page, limit } = req.query;
    const result = await adminService.listAuditLogs({ action, page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  getUser,
  updateUserRole,
  updateUserPlan,
  deleteUser,
  getStats,
  listAuditLogs,
};
