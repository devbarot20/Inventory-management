'use strict';

const User = require('../models/User');

const FIXED_ADMINS = [
  {
    name: 'Platform Administrator',
    email: 'admin@forecastiq.com',
    password: 'Admin@ForecastIQ2026!',
    role: 'admin',
    plan: 'scale',
    emailVerifiedAt: new Date(),
  },
  {
    name: 'Demo Admin',
    email: 'admin@shop.com',
    password: 'password123',
    role: 'admin',
    plan: 'scale',
    emailVerifiedAt: new Date(),
  },
];

/**
 * Ensure fixed administrator accounts exist on system startup.
 * Guarantees admin login credentials remain stable and reliable.
 */
async function ensureFixedAdmins() {
  for (const adminData of FIXED_ADMINS) {
    try {
      const existing = await User.findOne({ email: adminData.email }).select('+password');
      if (!existing) {
        await User.create(adminData);
        console.log(`[Bootstrap] Ensured fixed admin account: ${adminData.email}`);
      } else {
        let changed = false;
        if (existing.role !== 'admin') {
          existing.role = 'admin';
          changed = true;
        }
        if (existing.deletedAt) {
          existing.deletedAt = undefined;
          changed = true;
        }
        if (changed) {
          await existing.save();
          console.log(`[Bootstrap] Re-asserted fixed admin role: ${adminData.email}`);
        }
      }
    } catch (err) {
      console.error(`[Bootstrap] Error ensuring admin ${adminData.email}:`, err.message);
    }
  }
}

module.exports = {
  ensureFixedAdmins,
  FIXED_ADMINS,
};
