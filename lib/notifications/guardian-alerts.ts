// Guardian Alert System - Notifications for Parents/Guardians
// Sends email alerts for important events (content moderation, safety concerns)

import { prisma } from "@/lib/db/prisma";
import { createTransporter } from "@/lib/email/transporter";
import { log } from "@/lib/logger";

export interface ContentModerationAlert {
  studentId: string;
  studentName: string;
  contentType: "homework" | "message" | "comment";
  flaggedWords: string[];
  severity: "moderate" | "severe" | "critical";
  originalText: string;
  filteredText?: string;
  timestamp: Date;
  contextUrl?: string; // Link to the content
}

/**
 * Notify all guardians linked to a student about content moderation event
 * @param alert Content moderation alert details
 * @returns Promise<boolean> - True if at least one notification was sent
 */
export async function notifyGuardiansAboutContent(
  alert: ContentModerationAlert,
): Promise<boolean> {
  try {
    // Fetch all guardians linked to this student
    const links = await prisma.link.findMany({
      where: {
        studentId: alert.studentId,
        isActive: true, // Only notify active guardians
      },
      include: {
        guardian: {
          include: {
            user: {
              select: {
                email: true,
                locale: true,
              },
            },
          },
        },
      },
    });

    if (links.length === 0) {
      log.warn("No active guardians found for student", {
        studentId: alert.studentId,
      });
      return false;
    }

    const transporter = createTransporter();
    let successCount = 0;

    // Send notification to each guardian
    for (const link of links) {
      const guardianEmail = link.guardian.user.email;
      if (!guardianEmail) {
        log.warn("Guardian has no email", { guardianId: link.guardianId });
        continue;
      }

      try {
        const emailResult = await transporter.sendMail({
          from: `"Osnovci - Sigurnosna Notifikacija" <${process.env["SMTP_FROM"]}>`,
          to: guardianEmail,
          subject: `⚠️ Upozorenje: Detektovan neprimeren sadržaj - ${alert.studentName}`,
          html: generateContentAlertEmail(alert, link.guardian.name),
          text: generateContentAlertEmailText(alert, link.guardian.name),
        });

        log.info("Content moderation alert sent to guardian", {
          guardianEmail,
          studentId: alert.studentId,
          messageId: emailResult.messageId,
        });

        successCount++;
      } catch (emailError) {
        log.error("Failed to send content alert to guardian", {
          guardianEmail,
          error: emailError,
        });
      }
    }

    return successCount > 0;
  } catch (error) {
    log.error("Failed to notify guardians about content", { error });
    return false;
  }
}

/**
 * Generate HTML email for content moderation alert
 */
function generateContentAlertEmail(
  alert: ContentModerationAlert,
  guardianName: string,
): string {
  const severityColors = {
    moderate: "#f59e0b", // Orange
    severe: "#ef4444", // Red
    critical: "#dc2626", // Dark Red
  };

  const severityLabels = {
    moderate: "Umeren",
    severe: "Ozbiljan",
    critical: "Kritičan",
  };

  const contentTypeLabels = {
    homework: "domaćem zadatku",
    message: "poruci",
    comment: "komentaru",
  };

  return `
<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sigurnosno Upozorenje - Osnovci</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <div style="background-color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
      <span style="font-size: 30px;">⚠️</span>
    </div>
    <h1 style="color: white; margin: 0; font-size: 24px;">Sigurnosno Upozorenje</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">Detektovan potencijalno neprimeren sadržaj</p>
  </div>

  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <p style="margin-top: 0;">Poštovani/a <strong>${guardianName}</strong>,</p>

    <div style="background-color: ${severityColors[alert.severity]}15; border-left: 4px solid ${severityColors[alert.severity]}; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: ${severityColors[alert.severity]};">
        Nivo ozbiljnosti: ${severityLabels[alert.severity]}
      </p>
    </div>

    <p>Naš sistem za automatsku moderaciju sadržaja je detektovao potencijalno neprimeren tekst koji je <strong>${alert.studentName}</strong> uneo/la u ${contentTypeLabels[alert.contentType]}.</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; font-size: 16px; color: #374151;">📋 Detalji incidenta:</h3>
      <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
        <li><strong>Učenik:</strong> ${alert.studentName}</li>
        <li><strong>Tip sadržaja:</strong> ${contentTypeLabels[alert.contentType]}</li>
        <li><strong>Vreme:</strong> ${alert.timestamp.toLocaleString("sr-Latn")}</li>
        <li><strong>Detektovane reči:</strong> ${alert.flaggedWords.map((word) => `"${word}"`).join(", ")}</li>
      </ul>
    </div>

    ${
      alert.severity === "moderate" || alert.severity === "severe"
        ? `
    <div style="background-color: #dbeafe; border: 1px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; font-size: 16px; color: #1e40af;">✅ Akcija sistema:</h3>
      <p style="margin: 5px 0; color: #1e3a8a;">Tekst je automatski <strong>filtriran</strong> i neprikladne reči su zamenjene zvezdičama (*).</p>
      ${alert.filteredText ? `<p style="margin: 10px 0; color: #4b5563; font-style: italic;">"${alert.filteredText}"</p>` : ""}
    </div>
    `
        : ""
    }

    ${
      alert.severity === "critical"
        ? `
    <div style="background-color: #fee2e2; border: 1px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin-top: 0; font-size: 16px; color: #991b1b;">🛑 Akcija sistema:</h3>
      <p style="margin: 5px 0; color: #7f1d1d;">Sadržaj je <strong>blokiran</strong> i nije sačuvan u sistem. Učenik je obavešten.</p>
    </div>
    `
        : ""
    }

    <h3 style="font-size: 16px; color: #374151; margin-top: 25px;">💡 Šta dalje?</h3>
    <ul style="color: #4b5563; line-height: 1.8;">
      <li><strong>Razgovarajte sa detetom</strong> o prikladnom ponašanju na internetu</li>
      <li><strong>Pratite aktivnost</strong> - Možete pregledati sve aktivnosti u aplikaciji</li>
      <li><strong>Postavite pravila</strong> - Razjasnite koja ponašanja su prihvatljiva</li>
      <li><strong>Budite podrška</strong> - Deca ponekad ne razumeju posledice svojih reči</li>
    </ul>

    ${
      alert.contextUrl
        ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${alert.contextUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        Pogledaj Detalje u Aplikaciji
      </a>
    </div>
    `
        : ""
    }

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        <strong>Napomena:</strong> Ovo je automatski generisano upozorenje. Naš sistem koristi napredne algoritme za detekciju neprikladnog sadržaja kako bi obezbedio sigurno okruženje za sve učenike.
      </p>
    </div>

    <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 15px; margin: 25px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 13px; color: #166534; text-align: center;">
        🔒 <strong>Bezbednost dece je naš prioritet.</strong><br>
        Sve aktivnosti su evidentirane u skladu sa COPPA zakonom.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 13px;">
    <p>Osnovci - Digitalni asistent za osnovce</p>
    <p style="margin: 5px 0;">
      <a href="${process.env["NEXT_PUBLIC_APP_URL"]}" style="color: #667eea; text-decoration: none;">osnovci.app</a> •
      <a href="${process.env["NEXT_PUBLIC_APP_URL"]}/privatnost" style="color: #667eea; text-decoration: none;">Privatnost</a> •
      <a href="${process.env["NEXT_PUBLIC_APP_URL"]}/kontakt" style="color: #667eea; text-decoration: none;">Kontakt</a>
    </p>
    <p style="margin: 10px 0; font-size: 11px; color: #9ca3af;">
      Primiš ovaj email jer si povezan/a sa učenikom na Osnovci platformi.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email for content moderation alert (fallback)
 */
function generateContentAlertEmailText(
  alert: ContentModerationAlert,
  guardianName: string,
): string {
  const severityLabels = {
    moderate: "Umeren",
    severe: "Ozbiljan",
    critical: "Kritičan",
  };

  const contentTypeLabels = {
    homework: "domaćem zadatku",
    message: "poruci",
    comment: "komentaru",
  };

  return `
⚠️ SIGURNOSNO UPOZORENJE - OSNOVCI

Poštovani/a ${guardianName},

Naš sistem za automatsku moderaciju sadržaja je detektovao potencijalno neprimeren tekst koji je ${alert.studentName} uneo/la u ${contentTypeLabels[alert.contentType]}.

DETALJI INCIDENTA:
- Učenik: ${alert.studentName}
- Tip sadržaja: ${contentTypeLabels[alert.contentType]}
- Nivo ozbiljnosti: ${severityLabels[alert.severity]}
- Vreme: ${alert.timestamp.toLocaleString("sr-Latn")}
- Detektovane reči: ${alert.flaggedWords.join(", ")}

${
  alert.severity === "moderate" || alert.severity === "severe"
    ? `AKCIJA SISTEMA: Tekst je automatski filtriran i neprikladne reči su zamenjene zvezdičama (*).`
    : ""
}

${
  alert.severity === "critical"
    ? `AKCIJA SISTEMA: Sadržaj je blokiran i nije sačuvan u sistem. Učenik je obavešten.`
    : ""
}

ŠTA DALJE?
1. Razgovarajte sa detetom o prikladnom ponašanju na internetu
2. Pratite aktivnost - Možete pregledati sve aktivnosti u aplikaciji
3. Postavite pravila - Razjasnite koja ponašanja su prihvatljiva
4. Budite podrška - Deca ponekad ne razumeju posledice svojih reči

${alert.contextUrl ? `Pogledaj detalje: ${alert.contextUrl}` : ""}

---
🔒 Bezbednost dece je naš prioritet.
Sve aktivnosti su evidentirane u skladu sa COPPA zakonom.

Osnovci - Digitalni asistent za osnovce
${process.env["NEXT_PUBLIC_APP_URL"]}
  `.trim();
}

/**
 * Notify guardians about general safety concerns (e.g., unusual activity)
 */
export async function notifyGuardiansAboutSafetyConcern(
  studentId: string,
  concern: {
    type: "unusual_activity" | "privacy_breach" | "suspicious_login";
    description: string;
    timestamp: Date;
    recommendation: string;
  },
): Promise<boolean> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!student) {
      log.error("Student not found for safety alert", { studentId });
      return false;
    }

    // Fetch all active guardians
    const links = await prisma.link.findMany({
      where: {
        studentId,
        isActive: true,
      },
      include: {
        guardian: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (links.length === 0) {
      log.warn("No active guardians found for safety alert", { studentId });
      return false;
    }

    const transporter = createTransporter();
    let successCount = 0;

    for (const link of links) {
      const guardianEmail = link.guardian.user.email;
      if (!guardianEmail) continue;

      try {
        await transporter.sendMail({
          from: `"Osnovci - Sigurnost" <${process.env["SMTP_FROM"]}>`,
          to: guardianEmail,
          subject: `🔒 Sigurnosno obaveštenje - ${student.name}`,
          html: `
            <h2>Sigurnosno obaveštenje</h2>
            <p>Poštovani/a ${link.guardian.name},</p>
            <p>${concern.description}</p>
            <p><strong>Preporuka:</strong> ${concern.recommendation}</p>
            <p>Vreme: ${concern.timestamp.toLocaleString("sr-Latn")}</p>
          `,
          text: `Sigurnosno obaveštenje\n\n${concern.description}\n\nPreporuka: ${concern.recommendation}\nVreme: ${concern.timestamp.toLocaleString("sr-Latn")}`,
        });

        successCount++;
      } catch (emailError) {
        log.error("Failed to send safety alert", {
          guardianEmail,
          error: emailError,
        });
      }
    }

    return successCount > 0;
  } catch (error) {
    log.error("Failed to notify guardians about safety concern", { error });
    return false;
  }
}
