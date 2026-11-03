'use strict';

const saleEventService = require('../services/saleEvent.service');

async function listSaleEvents(req, res, next) {
  try {
    const saleEvents = await saleEventService.listSaleEvents();
    res.status(200).json({ saleEvents });
  } catch (err) {
    next(err);
  }
}

async function getSaleEvent(req, res, next) {
  try {
    const saleEvent = await saleEventService.getSaleEventById(req.params.id);
    res.status(200).json({ saleEvent });
  } catch (err) {
    next(err);
  }
}

async function createSaleEvent(req, res, next) {
  try {
    const saleEvent = await saleEventService.createSaleEvent(req.body, req.user?.id);
    res.status(201).json({ saleEvent });
  } catch (err) {
    next(err);
  }
}

async function updateSaleEvent(req, res, next) {
  try {
    const saleEvent = await saleEventService.updateSaleEvent(req.params.id, req.body);
    res.status(200).json({ saleEvent });
  } catch (err) {
    next(err);
  }
}

async function deleteSaleEvent(req, res, next) {
  try {
    const result = await saleEventService.deleteSaleEvent(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSaleEvents,
  getSaleEvent,
  createSaleEvent,
  updateSaleEvent,
  deleteSaleEvent,
};

