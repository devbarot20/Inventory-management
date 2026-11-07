'use strict';

const env = require('../config/env');

/**
 * Sends a transactional email through Resend when RESEND_API_KEY is set.
 * Otherwise the message is printed to the server log so development works without email setup.
 */
async function sendMail({ to, subject, text }) {
  if (!env.resendApiKey) {
    if (!env.isTest) {
      console.log(`[mail:dev] To: ${to}\nSubject: ${subject}\n${text}`);
    }
    return { delivered: false };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.mailFrom, to: [to], subject, text }),
  });
  if (!res.ok) {
    throw new Error(`Email provider responded with status ${res.status}`);
  }
  return { delivered: true };
}

async function sendPasswordReset(to, name, resetUrl) {
  return sendMail({
    to,
    subject: 'Reset your ForecastIQ password',
    text:
      `Hi ${name},\n\nWe received a request to reset your password. ` +
      `Open this link within one hour to choose a new one:\n\n${resetUrl}\n\n` +
      'If you did not request this, you can ignore this email.',
  });
}

async function sendVerification(to, name, verifyUrl) {
  return sendMail({
    to,
    subject: 'Verify your ForecastIQ email',
    text:
      `Hi ${name},\n\nWelcome to ForecastIQ! Confirm your email address to unlock your workspace. ` +
      `The link is valid for 24 hours:\n\n${verifyUrl}\n\n` +
      'If you did not create this account, you can ignore this email.',
  });
}

module.exports = { sendMail, sendPasswordReset, sendVerification };
