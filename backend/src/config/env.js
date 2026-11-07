'use strict';

/**
 * Centralised access to environment variables.
 * Values are loaded from backend/.env (see .env.example). Never hard-code secrets.
 */
require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  // A local default keeps development friction-free; production must set it explicitly.
  mongodbUri:
    process.env.MONGODB_URI ||
    (nodeEnv === 'production' ? '' : 'mongodb://127.0.0.1:27017/inventory_forecaster'),
  jwtSecret:
    process.env.JWT_SECRET ||
    (nodeEnv === 'production'
      ? (() => {
          throw new Error('JWT_SECRET must be set in production!');
        })()
      : 'dev-jwt-secret-replace-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Public URL of the frontend, used in password-reset links.
  appUrl: (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, ''),
  // Optional transactional email via Resend (https://resend.com). Without a key, emails are logged.
  resendApiKey: process.env.RESEND_API_KEY || '',
  // Email verification is only enforced when mail can really be delivered (or explicitly enabled),
  // so a missing email setup can never lock users out.
  emailVerificationEnabled:
    process.env.EMAIL_VERIFICATION === 'true' ||
    (process.env.EMAIL_VERIFICATION !== 'false' && Boolean(process.env.RESEND_API_KEY)),
  mailFrom: process.env.MAIL_FROM || 'ForecastIQ <onboarding@resend.dev>',
};

module.exports = env;
