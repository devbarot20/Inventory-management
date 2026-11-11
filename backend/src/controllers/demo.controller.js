'use strict';

const demoSeedService = require('../services/demoSeed.service');

async function seedDemo(req, res, next) {
  try {
    const result = await demoSeedService.loadDemoData(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function clearDemo(req, res, next) {
  try {
    const result = await demoSeedService.clearDemoData(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  seedDemo,
  clearDemo,
};

