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

/**
 * Send parental alert email (security incidents, lockouts, etc.)
 */
export async function sendParentalAlertEmail(
  email: string,
  alertType: string,
  metadata: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info("Sending parental alert email", {
      email,
      alertType,
      metadata,
    });

    const { createTransporter } = await import("./transporter");
    const { sendEmailWithRetry } = await import("./utils");

    let subject = "";
    let html = "";

    if (alertType === "consent_lockout") {
      subject = "🚨 Osnovci: Sigurnosno upozorenje - Verifikacija pristanka";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">🚨 Sigurnosno upozorenje</h2>
          
          <p>Poštovani,</p>
          
          <p>
            Detektovali smo <strong>${metadata['attemptCount'] || "više"} neuspelih pokušaja</strong> 
            verifikacije koda pristanka za učenika <strong>${metadata['studentName'] || "Vaše dete"}</strong>.
          </p>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Kod je privremeno blokiran iz bezbednosnih razloga.</strong>
            </p>
          </div>
          
          <p><strong>Šta treba da uradite:</strong></p>
          <ul>
            <li>Ako ste Vi pokušavali verifikaciju, sačekajte 15 minuta i pokušajte ponovo</li>
            <li>Ako niste Vi pokušavali verifikaciju, molimo kontaktirajte nas ODMAH</li>
            <li>Proverite da li neko neovlašćeno ima pristup vašem email-u</li>
          </ul>
          
          <p>
            Možete zatražiti novi kod pristanka sa strane učenika ili kontaktirati našu podršku.
          </p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Ovo je automatska poruka iz sigurnosnog sistema Osnovci aplikacije.
          </p>
        </div>
      `;
    } else {
      subject = "🚨 Osnovci: Sigurnosno upozorenje";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">🚨 Sigurnosno upozorenje</h2>
          <p>Detektovan je sigurnosni incident: ${alertType}</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Ovo je automatska poruka iz sigurnosnog sistema Osnovci aplikacije.
          </p>
        </div>
      `;
    }

    const transporter = createTransporter();
    const result = await sendEmailWithRetry(transporter, {
      to: email,
      subject,
      html,
    });

    if (result.success) {
      log.info("Parental alert email sent successfully", {
        email,
        alertType,
      });
    } else {
      log.error("Failed to send parental alert email", {
        error: result.error,
        email,
      });
    }

    return result;
  } catch (error) {
    log.error("Failed to send parental alert email", { error, email });
    return { success: false, error: "Email send failed" };
  }
}
