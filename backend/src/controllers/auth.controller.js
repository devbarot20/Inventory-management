'use strict';

const authService = require('../services/auth.service');
const { Product, SaleEvent } = require('../models');
const { serializePlan } = require('../config/plans');

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

async function forgotPassword(req, res, next) {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.status(200).json({
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.status(200).json({
    user: req.user,
  });
}

async function getUsage(req, res, next) {
  try {
    const [products, campaigns] = await Promise.all([
      Product.countDocuments({ createdBy: req.user._id }),
      SaleEvent.countDocuments({ createdBy: req.user._id }),
    ]);
    res.status(200).json({ plan: serializePlan(req.user.plan), usage: { products, campaigns } });
  } catch (err) {
    next(err);
  }
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
  forgotPassword,
  resetPassword,
  getMe,
  updatePlan,
  getUsage,
  checkAdmin,
};
