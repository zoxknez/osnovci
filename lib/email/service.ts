/**
 * Email Service - Modern Email Sending
 * Uses template system and retry logic for reliable email delivery
 */

import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import type { WeeklyReportData } from "@/lib/reports/weekly-report-generator";
import { queueEmail } from "./queue";
import { createActivityNotificationTemplate } from "./templates/activity-notification";
import { createFamilyLinkTemplate } from "./templates/family-link";
import { createFlaggedContentTemplate } from "./templates/flagged-content";
import { createParentalAlertTemplate } from "./templates/parental-alert";
import { createParentalConsentTemplate } from "./templates/parental-consent";
import { createVerificationEmailTemplate } from "./templates/verification";
import { createWeeklyReportTemplate } from "./templates/weekly-report";
import { createWelcomeEmailTemplate } from "./templates/welcome";
import { createTransporter } from "./transporter";
import {
  type EmailResult,
  isValidEmail,
  sanitizeEmail,
  sendEmailWithRetry,
} from "./utils";

/**
 * Get email from address with fallback
 */
function getEmailFrom(): string {
  if (!env.EMAIL_FROM && process.env.NODE_ENV === "production") {
    log.error("EMAIL_FROM environment variable is missing in production!");
  }
  return env.EMAIL_FROM || "noreply@osnovci.app";
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  token: string,
): Promise<EmailResult> {
  try {
    // Validate email
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    // Create verification URL
    const baseUrl =
      env.NEXTAUTH_URL ||
      (process.env["VERCEL_URL"]
        ? `https://${process.env["VERCEL_URL"]}`
        : "http://localhost:3000");
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // Generate email template
    const template = createVerificationEmailTemplate(userName, verificationUrl);

    // Queue email (with retry logic built-in)
    const result = await queueEmail({
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      from: getEmailFrom(),
      priority: "high", // Verification emails are high priority
    });

    if (result.queued) {
      log.info("Verification email queued", {
        to: sanitizedEmail,
        jobId: result.jobId,
      });

      return {
        success: true,
        ...(result.jobId && { messageId: result.jobId }),
      };
    } else if (result.sentImmediately) {
      return {
        success: true,
        messageId: "immediate",
      };
    }

    return {
      success: false,
      error: "Failed to queue email",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send verification email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();
    const template = createWelcomeEmailTemplate(userName);

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.success) {
      log.info("Welcome email sent", { to: sanitizedEmail });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send welcome email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send family link invitation email
 */
export async function sendFamilyLink(
  toEmail: string,
  linkCode: string,
  studentName: string,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();
    const template = createFamilyLinkTemplate(linkCode, studentName);

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.success) {
      log.info("Family link email sent", { to: sanitizedEmail });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send family link email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send parental consent email
 */
export async function sendParentalConsent(
  toEmail: string,
  verificationCode: string,
  studentName: string,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();
    const template = createParentalConsentTemplate(
      verificationCode,
      studentName,
    );

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.success) {
      log.info("Parental consent email sent", { to: sanitizedEmail });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send parental consent email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send activity notification to parent
 */
export async function sendActivityNotification(
  toEmail: string,
  activityType: string,
  description: string,
  studentName: string,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();
    const template = createActivityNotificationTemplate(
      activityType,
      description,
      studentName,
    );

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.success) {
      log.info("Activity notification email sent", {
        to: sanitizedEmail,
        activityType,
      });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send activity notification email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send flagged content notification to parent
 */
export async function sendFlaggedContent(
  toEmail: string,
  fileName: string,
  reasons: string[],
  studentName: string,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();
    const template = createFlaggedContentTemplate(
      fileName,
      reasons,
      studentName,
    );

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.success) {
      log.info("Flagged content email sent", {
        to: sanitizedEmail,
        fileName,
      });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send flagged content email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send weekly report to parent
 */
export async function sendWeeklyReport(
  toEmail: string,
  guardianName: string,
  report: WeeklyReportData,
  viewOnlineUrl: string,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();
    const template = createWeeklyReportTemplate(
      guardianName,
      report,
      viewOnlineUrl,
    );

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.success) {
      log.info("Weekly report email sent", { to: sanitizedEmail });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send weekly report email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send parental alert email (security incidents, lockouts, etc.)
 */
export async function sendParentalAlert(
  toEmail: string,
  alertType: string,
  metadata: Record<string, string>,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();
    const template = createParentalAlertTemplate(alertType, metadata);

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      priority: "high",
    });

    if (result.success) {
      log.info("Parental alert email sent", {
        to: sanitizedEmail,
        alertType,
      });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send parental alert email", {
      to: toEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send custom email (generic function)
 * Use for cases where template doesn't exist
 */
export async function sendCustomEmail(
  toEmail: string,
  subject: string,
  html: string,
  text?: string,
): Promise<EmailResult> {
  try {
    const sanitizedEmail = sanitizeEmail(toEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const transporter = createTransporter();

    const result = await sendEmailWithRetry(transporter, {
      from: getEmailFrom(),
      to: sanitizedEmail,
      subject,
      text: text || subject,
      html,
    });

    if (result.success) {
      log.info("Custom email sent", { to: sanitizedEmail, subject });
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("Failed to send custom email", {
      to: toEmail,
      subject,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Export types
export type { EmailResult, WeeklyReportData };
