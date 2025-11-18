/**
 * Email Module - Main Export
 * Consolidates all email functionality
 */

export { sendCustomEmail as sendEmail, sendVerificationEmail } from './service';
export { createTransporter } from './transporter';
export * from './templates';
export * from './utils';
