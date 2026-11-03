'use strict';

const productService = require('../services/product.service');

async function listProducts(req, res, next) {
  try {
    const products = await productService.listProducts({
      search: req.query.search,
    });
    res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.body, req.user?.id);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function recordStock(req, res, next) {
  try {
    const snapshot = await productService.recordStock(req.body);
    res.status(201).json({ snapshot });
  } catch (err) {
    next(err);
  }
}

async function getStock(req, res, next) {
  try {
    const snapshots = await productService.getStockSnapshots(req.query.sku);
    res.status(200).json({ snapshots });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  recordStock,
  getStock,
};

