'use strict';

/**
 * One-off migration for data created before per-user isolation.
 * Assigns every record that has no owner to the given user.
 *
 * Usage: node scripts/claimLegacyData.js user@example.com
 */
require('dotenv').config();
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const { User, Product, SaleEvent, StockSnapshot, SalesHistory, ForecastRun } = require('../src/models');

async function main() {
  const email = (process.argv[2] || '').toLowerCase();
  if (!email) throw new Error('Usage: node scripts/claimLegacyData.js user@example.com');

  await connectDB(env.mongodbUri);
  const user = await User.findOne({ email });
  if (!user) throw new Error(`No user found with email ${email}`);

  const orphan = { $or: [{ createdBy: null }, { createdBy: { $exists: false } }] };
  for (const [name, Model] of [
    ['products', Product],
    ['sale events', SaleEvent],
    ['stock snapshots', StockSnapshot],
    ['sales history', SalesHistory],
    ['forecast runs', ForecastRun],
  ]) {
    // eslint-disable-next-line no-await-in-loop
    const res = await Model.updateMany(orphan, { $set: { createdBy: user._id } });
    console.log(`${name}: ${res.modifiedCount} claimed`);
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
