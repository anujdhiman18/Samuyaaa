import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const PRIMARY_EMAIL_TARGET = 'anujdhiman1706@gmail.com';
export const SECONDARY_EMAIL_TARGET = 'jitender0585@gmail.com';
export const EMAIL_TARGET = PRIMARY_EMAIL_TARGET;
export const ALL_EMAIL_TARGETS = [PRIMARY_EMAIL_TARGET, SECONDARY_EMAIL_TARGET];
export const EMAIL_TARGET_STRING = ALL_EMAIL_TARGETS.join(', ');

/**
 * Creates and returns a Nodemailer transporter using Gmail / SMTP credentials
 * configured in process.env.EMAIL_USER and process.env.EMAIL_PASS.
 */
export const getTransporter = () => {
  const user = process.env.EMAIL_USER || PRIMARY_EMAIL_TARGET;
  const pass = process.env.EMAIL_PASS || '';

  if (!pass) {
    console.warn('⚠️ Nodemailer Warning: EMAIL_PASS environment variable is not configured in server/.env.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};
