/**
 * Email Module - Main Export
 * Consolidates all email functionality
 */

export { sendCustomEmail as sendEmail, sendVerificationEmail } from "./service";
export * from "./templates";
export { createTransporter } from "./transporter";
export * from "./utils";
