/**
 * Email Utilities
 * Retry logic, error handling, and helper functions
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { log } from '@/lib/logger';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
} as const;

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  transporter: Transporter,
  mailOptions: Parameters<Transporter['sendMail']>[0],
  retries = RETRY_CONFIG.maxRetries,
): Promise<EmailResult> {
  let lastError: Error | undefined;
  let delay = RETRY_CONFIG.retryDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);

      // Get preview URL for Ethereal (development)
      let previewUrl: string | false = false;
      if (process.env.NODE_ENV === 'development') {
        try {
          const url = nodemailer.getTestMessageUrl(info);
          previewUrl = url;
        } catch {
          // Ignore if not available
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        ...(previewUrl && { previewUrl }),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt < retries) {
        log.warn(`Email send failed, retrying... (attempt ${attempt + 1}/${retries})`, {
          error: lastError.message,
          delay,
        });

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= RETRY_CONFIG.backoffMultiplier;
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message ?? 'Unknown error';
  log.error('Email send failed after all retries', {
    error: errorMessage,
    attempts: retries + 1,
    to: typeof mailOptions.to === 'string' ? mailOptions.to : 'multiple',
  });

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

