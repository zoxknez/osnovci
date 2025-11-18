/**
 * Comprehensive Content Moderation Service
 * Combines: Profanity filter, PII detection, OpenAI moderation, Age checks
 * Logs all moderation actions to database
 */

import prisma from "@/lib/db/prisma";
import { ContentType, ModerationStatus } from "@prisma/client";
import { log } from "@/lib/logger";
import { ContentFilter, PIIDetector, AgeFilter } from "./content-filter";
import {
  moderateTextWithAI,
  getRecommendedAction,
  type OpenAIModerationResult,
} from "./openai-moderation";

export interface ModerationInput {
  text: string;
  contentType: ContentType;
  contentId: string;
  userId: string;
  studentId?: string;
  userAge?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ModerationOutput {
  approved: boolean;
  moderated: string;
  status: ModerationStatus;
  action: "allow" | "warn" | "filter" | "block" | "flag";
  severity: "none" | "mild" | "moderate" | "severe" | "critical";
  warnings: string[];
  flaggedWords: string[];
  flaggedCategories: string[];
  notifyParent: boolean;
  blockReason?: string;
  moderationLogId: string;
}

/**
 * Main moderation function - combines all checks
 */
export async function moderateContent(
  input: ModerationInput
): Promise<ModerationOutput> {
  const warnings: string[] = [];
  const flaggedWords: string[] = [];
  const flaggedCategories: string[] = [];
  let moderated = input.text;
  let notifyParent = false;
  let aiResult: OpenAIModerationResult | null = null;

  try {
    // 1. Profanity Filter (local, instant)
    const profanityCheck = ContentFilter.check(input.text);
    if (!profanityCheck.safe) {
      warnings.push(
        `Profanity detected: ${profanityCheck.flagged.join(", ")}`
      );
      flaggedWords.push(...profanityCheck.flagged);
      moderated = profanityCheck.filtered;
      notifyParent = profanityCheck.notifyParent;
    }

    // 2. PII Detection (personal information)
    const piiCheck = PIIDetector.detect(moderated);
    if (piiCheck.detected) {
      warnings.push(`Personal information detected: ${piiCheck.types.join(", ")}`);
      moderated = piiCheck.masked;
      notifyParent = true;
    }

    // 3. Age Appropriateness Check (if age provided)
    if (input.userAge) {
      const ageCheck = AgeFilter.isAppropriate(moderated, input.userAge);
      if (!ageCheck.appropriate) {
        warnings.push(ageCheck.reason || "Content not age-appropriate");
      }
    }

    // 4. AI Moderation (OpenAI - async, more thorough)
    aiResult = await moderateTextWithAI(input.text);
    if (aiResult.flagged) {
      warnings.push(
        `AI flagged: ${aiResult.flaggedCategories.join(", ")}`
      );
      flaggedCategories.push(...aiResult.flaggedCategories);

      const aiAction = getRecommendedAction(aiResult);
      if (aiAction.notifyParent) {
        notifyParent = true;
      }
    }

    // 5. Auto-correct common issues
    moderated = ContentFilter.autoCorrect(moderated);

    // 6. Determine final action
    const finalSeverity = determineSeverity(profanityCheck.severity, aiResult);
    const finalAction = determineAction(profanityCheck.action, aiResult, piiCheck.detected);
    const finalStatus = determineStatus(finalAction, aiResult?.flagged || false);

    // 7. Log to database
    const moderationLog = await prisma.moderationLog.create({
      data: {
        contentType: input.contentType,
        contentId: input.contentId,
        originalText: input.text,
        moderatedText: moderated !== input.text ? moderated : null,
        userId: input.userId,
        studentId: input.studentId,
        status: finalStatus,
        flagged: aiResult?.flagged || !profanityCheck.safe || piiCheck.detected,
        severity: finalSeverity,
        flaggedWords: flaggedWords.length > 0 ? JSON.stringify(flaggedWords) : null,
        ...(aiResult
          ? {
              categories: {
                profanity: !profanityCheck.safe,
                pii: piiCheck.detected,
                ai: aiResult.flagged,
              },
              aiProvider: "openai",
              aiConfidence: aiResult.highestScore * 100,
              aiCategories: aiResult.categoryScores,
            }
          : {}),
        hasPII: piiCheck.detected,
        piiTypes: piiCheck.detected ? piiCheck.types.join(",") : null,
        actionTaken: finalAction,
        notifyParent,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    // 8. Notify parent if needed (async, non-blocking)
    if (notifyParent && input.studentId) {
      notifyParentAsync(input.studentId, moderationLog.id, warnings).catch((err) =>
        log.error("Failed to notify parent", err)
      );
    }

    log.info("Content moderation completed", {
      contentType: input.contentType,
      approved: finalAction === "allow",
      action: finalAction,
      severity: finalSeverity,
      flagged: moderationLog.flagged,
      warningsCount: warnings.length,
    });

    return {
      approved: finalAction === "allow",
      moderated,
      status: finalStatus,
      action: finalAction,
      severity: finalSeverity,
      warnings,
      flaggedWords,
      flaggedCategories,
      notifyParent,
      blockReason: finalAction === "block" ? warnings[0] : undefined,
      moderationLogId: moderationLog.id,
    };
  } catch (error) {
    log.error("Moderation failed", error, {
      contentType: input.contentType,
      contentId: input.contentId,
    });

    // Fail-safe: block on error
    const errorLog = await prisma.moderationLog.create({
      data: {
        contentType: input.contentType,
        contentId: input.contentId,
        originalText: input.text,
        userId: input.userId,
        studentId: input.studentId,
        status: "FLAGGED",
        flagged: true,
        severity: "critical",
        actionTaken: "block",
        notifyParent: true,
        metadata: { error: "Moderation system error" },
      },
    });

    return {
      approved: false,
      moderated: input.text,
      status: "FLAGGED",
      action: "block",
      severity: "critical",
      warnings: ["Moderation system error - content blocked for review"],
      flaggedWords: [],
      flaggedCategories: [],
      notifyParent: true,
      blockReason: "System error - manual review required",
      moderationLogId: errorLog.id,
    };
  }
}

/**
 * Batch moderate multiple contents
 */
export async function moderateContents(
  inputs: ModerationInput[]
): Promise<ModerationOutput[]> {
  return Promise.all(inputs.map(moderateContent));
}

/**
 * Determine final severity from multiple checks
 */
function determineSeverity(
  profanitySeverity: string,
  aiResult: OpenAIModerationResult | null
): "none" | "mild" | "moderate" | "severe" | "critical" {
  const severityLevels = ["none", "mild", "moderate", "severe", "critical"];

  const profanityLevel = severityLevels.indexOf(profanitySeverity);
  const aiLevel = aiResult ? severityLevels.indexOf(aiResult.severity) : 0;

  const maxLevel = Math.max(profanityLevel, aiLevel);
  return severityLevels[maxLevel] as "none" | "mild" | "moderate" | "severe" | "critical";
}

/**
 * Determine final action from multiple checks
 */
function determineAction(
  profanityAction: string,
  aiResult: OpenAIModerationResult | null,
  hasPII: boolean
): "allow" | "warn" | "filter" | "block" | "flag" {
  const actionPriority = { block: 4, flag: 3, filter: 2, warn: 1, allow: 0 };

  let maxAction = profanityAction as "allow" | "warn" | "filter" | "block" | "flag";
  let maxPriority = actionPriority[maxAction] || 0;

  if (aiResult) {
    const aiAction = getRecommendedAction(aiResult).action;
    const aiPriority = actionPriority[aiAction];
    if (aiPriority > maxPriority) {
      maxAction = aiAction;
      maxPriority = aiPriority;
    }
  }

  if (hasPII && maxPriority < actionPriority.filter) {
    maxAction = "filter";
  }

  return maxAction;
}

/**
 * Determine moderation status
 */
function determineStatus(
  action: string,
  aiFlagged: boolean
): ModerationStatus {
  if (action === "block") return "REJECTED";
  if (action === "flag" || aiFlagged) return "FLAGGED";
  if (action === "allow") return "APPROVED";
  return "PENDING";
}

/**
 * Notify parent about flagged content (async)
 */
async function notifyParentAsync(
  studentId: string,
  moderationLogId: string,
  warnings: string[]
): Promise<void> {
  try {
    // Find student and guardian link
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        guardianLinks: {
          where: { isActive: true },
          include: { guardian: { include: { user: true } } },
        },
      },
    });

    if (!student || student.guardianLinks.length === 0) {
      return;
    }

    // Create notification for each guardian
    for (const link of student.guardianLinks) {
      await prisma.notification.create({
        data: {
          userId: link.guardian.userId,
          type: "SECURITY_ALERT",
          title: "⚠️ Moderacija sadržaja",
          message: `Detektovan je neprikladansan sadržaj od strane učenika ${student.firstName}. Razlozi: ${warnings.join(", ")}`,
          metadata: {
            studentId,
            moderationLogId,
            warnings,
          },
        },
      });
    }

    // Update moderation log
    await prisma.moderationLog.update({
      where: { id: moderationLogId },
      data: {
        parentNotified: true,
        parentNotifiedAt: new Date(),
      },
    });

    log.info("Parent notified about flagged content", {
      studentId,
      moderationLogId,
      guardianCount: student.guardianLinks.length,
    });
  } catch (error) {
    log.error("Failed to notify parent", error, { studentId, moderationLogId });
  }
}

/**
 * Quick check (without database logging) - for real-time validation
 */
export async function quickModerate(text: string): Promise<{
  safe: boolean;
  filtered: string;
  warnings: string[];
}> {
  const warnings: string[] = [];

  // Quick profanity check
  const profanityCheck = ContentFilter.check(text);
  let filtered = profanityCheck.filtered;

  if (!profanityCheck.safe) {
    warnings.push("Profanity detected");
  }

  // Quick PII check
  const piiCheck = PIIDetector.detect(filtered);
  if (piiCheck.detected) {
    filtered = piiCheck.masked;
    warnings.push("Personal information detected");
  }

  return {
    safe: warnings.length === 0,
    filtered,
    warnings,
  };
}

/**
 * Get moderation statistics for a user
 */
export async function getModerationStats(userId: string) {
  const [total, flagged, blocked, pending] = await Promise.all([
    prisma.moderationLog.count({ where: { userId } }),
    prisma.moderationLog.count({ where: { userId, flagged: true } }),
    prisma.moderationLog.count({ where: { userId, status: "REJECTED" } }),
    prisma.moderationLog.count({ where: { userId, status: "PENDING" } }),
  ]);

  const recentLogs = await prisma.moderationLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    total,
    flagged,
    blocked,
    pending,
    approved: total - flagged - blocked - pending,
    flagRate: total > 0 ? (flagged / total) * 100 : 0,
    recentLogs,
  };
}
