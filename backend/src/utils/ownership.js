'use strict';

const mongoose = require('mongoose');
const ApiError = require('../errors/ApiError');

/** Casts a user id (string or ObjectId) to an ObjectId so it also works inside aggregate pipelines. */
function toOwnerId(userId) {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw ApiError.unauthorized('Authentication required');
  }
  return new mongoose.Types.ObjectId(String(userId));
}

/** Loads a sale event only if it belongs to the user; otherwise behaves as "not found". */
async function findOwnedSaleEvent(SaleEvent, saleEventId, userId, { lean = false } = {}) {
  if (!mongoose.isValidObjectId(saleEventId)) {
    throw ApiError.notFound('Sale event not found');
  }
  const query = SaleEvent.findOne({ _id: saleEventId, createdBy: toOwnerId(userId) });
  const event = await (lean ? query.lean() : query);
  if (!event) {
    throw ApiError.notFound('Sale event not found');
  }
  return event;
}

module.exports = { toOwnerId, findOwnedSaleEvent };
