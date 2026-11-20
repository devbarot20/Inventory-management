'use strict';

const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });
const { connectDB } = require('../src/config/db');
const { User } = require('../src/models');

async function createAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_BOOTSTRAP_CONFIRM } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this command.');
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (ADMIN_BOOTSTRAP_CONFIRM?.trim().toLowerCase() !== email) {
    throw new Error('Set ADMIN_BOOTSTRAP_CONFIRM to the exact admin email to confirm provisioning.');
  }
  if (ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 128) {
    throw new Error('ADMIN_PASSWORD must be between 12 and 128 characters.');
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error(`An account already exists for ${email}; this command never overwrites accounts.`);
  }

  const user = await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password: ADMIN_PASSWORD,
    role: 'admin',
    emailVerificationRequired: true,
    emailVerifiedAt: new Date(),
  });

  console.log(`Created initial admin account: ${user.email}`);
}

createAdmin()
  .catch((err) => {
    console.error(`Admin provisioning failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
