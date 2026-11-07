'use strict';

const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.status(200).json({
    user: req.user,
  });
}

async function updatePlan(req, res, next) {
  try {
    const user = await authService.changePlan(req.user, req.body.plan);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

async function checkAdmin(req, res) {
  res.status(200).json({
    ok: true,
    message: 'Admin access granted',
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  getMe,
  updatePlan,
  checkAdmin,
};
