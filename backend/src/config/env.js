'use strict';

/**
 * Centralised access to environment variables.
 * Values are loaded from backend/.env (see .env.example). Never hard-code secrets.
 */
require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret =
  process.env.JWT_SECRET ||
  (nodeEnv === 'production' ? '' : 'dev-jwt-secret-replace-in-production');

if (nodeEnv === 'production' && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in production!');
}

if (nodeEnv === 'production') {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in production!');
  }
  const productionOrigins = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim());
  if (!productionOrigins.some(Boolean) || productionOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN must list the frontend origin(s) in production!');
  }
  if (!process.env.APP_URL) {
    throw new Error('APP_URL must be set to the public frontend URL in production!');
  }
}

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  // A local default keeps development friction-free; production validates it above.
  mongodbUri:
    process.env.MONGODB_URI ||
    (nodeEnv === 'production' ? '' : 'mongodb://127.0.0.1:27017/inventory_forecaster'),
  jwtSecret,
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
  // Optional Stripe billing keys. If unset, the app runs in simulated billing mode.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

module.exports = env;
