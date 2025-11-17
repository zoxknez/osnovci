// Email Templates for various notifications
import { log } from "@/lib/logger";
import {
  sendActivityNotification,
  sendFamilyLink,
  sendFlaggedContent,
  sendParentalConsent,
  sendWeeklyReport,
} from "./service";

/**
 * Send family link invitation email
 */
export async function sendFamilyLinkEmail(
  email: string,
  linkCode: string,
  studentName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info("Sending family link email", {
      email,
      linkCode,
      studentName,
    });

    const result = await sendFamilyLink(email, linkCode, studentName);

    if (result.success) {
      log.info("Family link email sent successfully", {
        email,
        linkCode,
        studentName,
      });
    } else {
      log.error("Failed to send family link email", {
        error: result.error,
        email,
      });
    }

    return result;
  } catch (error) {
    log.error("Failed to send family link email", { error, email });
    return { success: false, error: "Email send failed" };
  }
}

/**
 * Send parental consent verification email
 */
export async function sendParentalConsentEmail(
  email: string,
  verificationCode: string,
  studentName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info("Sending parental consent email", {
      email,
      verificationCode,
      studentName,
    });

    const result = await sendParentalConsent(
      email,
      verificationCode,
      studentName,
    );

    if (result.success) {
      log.info("Parental consent email sent successfully", {
        email,
        verificationCode,
        studentName,
      });
    } else {
      log.error("Failed to send parental consent email", {
        error: result.error,
        email,
      });
    }

    return result;
  } catch (error) {
    log.error("Failed to send parental consent email", { error, email });
    return { success: false, error: "Email send failed" };
  }
}

/**
 * Send activity notification to parent
 */
export async function sendActivityNotificationEmail(
  email: string,
  activityType: string,
  description: string,
  studentName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info("Sending activity notification email", {
      email,
      activityType,
      description,
      studentName,
    });

    const result = await sendActivityNotification(
      email,
      activityType,
      description,
      studentName,
    );

    if (result.success) {
      log.info("Activity notification email sent successfully", {
        email,
        activityType,
        description,
        studentName,
      });
    } else {
      log.error("Failed to send activity notification email", {
        error: result.error,
        email,
      });
    }

    return result;
  } catch (error) {
    log.error("Failed to send activity notification email", { error, email });
    return { success: false, error: "Email send failed" };
  }
}

/**
 * Send flagged content notification to parent
 */
export async function sendFlaggedContentEmail(
  email: string,
  fileName: string,
  reasons: string[],
  studentName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info("Sending flagged content notification email", {
      email,
      fileName,
      reasons,
      studentName,
    });

    const result = await sendFlaggedContent(
      email,
      fileName,
      reasons,
      studentName,
    );

    if (result.success) {
      log.info("Flagged content email sent successfully", {
        email,
        fileName,
        reasons,
        studentName,
      });
    } else {
      log.error("Failed to send flagged content email", {
        error: result.error,
        email,
      });
    }

    return result;
  } catch (error) {
    log.error("Failed to send flagged content email", { error, email });
    return { success: false, error: "Email send failed" };
  }
}

/**
 * Send weekly report to parent
 */
export async function sendWeeklyReportEmail(
  email: string,
  guardianName: string,
  report: any,
  viewOnlineUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info("Sending weekly report email", {
      email,
      guardianName,
      viewOnlineUrl,
    });

    const result = await sendWeeklyReport(
      email,
      guardianName,
      report,
      viewOnlineUrl,
    );

    if (result.success) {
      log.info("Weekly report email sent successfully", {
        email,
        guardianName,
      });
    } else {
      log.error("Failed to send weekly report email", {
        error: result.error,
        email,
      });
    }

    return result;
  } catch (error) {
    log.error("Failed to send weekly report email", { error, email });
    return { success: false, error: "Email send failed" };
  }
}
