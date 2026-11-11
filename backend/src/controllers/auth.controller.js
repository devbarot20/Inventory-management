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

async function verifyEmail(req, res, next) {
  try {
    await authService.verifyEmail(req.body.token);
    res.status(200).json({ message: 'Email verified. Your workspace is unlocked.' });
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const result = await authService.resendVerification(req.user);
    res.status(200).json({
      message: result.alreadyVerified
        ? 'Your email is already verified.'
        : 'Verification email sent. Check your inbox.',
    });
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

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    res.status(200).json(result);
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
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
  changePassword,
  updatePlan,
  getUsage,
  checkAdmin,
};
