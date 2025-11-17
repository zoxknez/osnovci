/**
 * Email Transporter Configuration
 * Modern, cached transporter with retry logic
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { log } from '@/lib/logger';
import { env } from '@/lib/env';

let cachedTransporter: Transporter | null = null;

/**
 * Create email transporter with caching
 * Supports SendGrid (production) and Ethereal (development)
 */
export function createTransporter(): Transporter {
  // Return cached transporter if available
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Development: Use Ethereal test account
  if (process.env.NODE_ENV === 'development' || !env.SENDGRID_API_KEY) {
    if (!env.EMAIL_TEST_USER || !env.EMAIL_TEST_PASS) {
      log.warn('Email test credentials not configured. Using JSON transport (no emails sent).', {
        hint: 'Set EMAIL_TEST_USER and EMAIL_TEST_PASS in .env for development',
      });
      // Return a JSON transport for testing (logs instead of sending)
      cachedTransporter = nodemailer.createTransport({
        jsonTransport: true, // JSON transport doesn't send emails, just logs
      });
      return cachedTransporter;
    }

    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: env.EMAIL_TEST_USER,
        pass: env.EMAIL_TEST_PASS,
      },
    });

    log.info('Email transporter created (Ethereal - Development)', {});
    return cachedTransporter;
  }

  // Production: Use SendGrid
  if (env.SENDGRID_API_KEY) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: env.SENDGRID_API_KEY,
      },
    });

    log.info('Email transporter created (SendGrid - Production)', {});
    return cachedTransporter;
  }

  throw new Error(
    'Email service nije konfigurisan. Postavite SENDGRID_API_KEY za production ili EMAIL_TEST_USER/EMAIL_TEST_PASS za development.',
  );
}

/**
 * Verify transporter connection
 */
export async function verifyTransporter(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    log.error('Email transporter verification failed', { error });
    return false;
  }
}

/**
 * Clear cached transporter (useful for testing)
 */
export function clearTransporterCache(): void {
  cachedTransporter = null;
}

