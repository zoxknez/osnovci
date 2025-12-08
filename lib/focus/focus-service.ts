/**
 * Focus Mode Service
 * Handles starting, stopping, and tracking focus sessions
 */

import { FocusStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { addXP } from "@/lib/gamification/xp-system";
import { log } from "@/lib/logger";

// XP Rewards for Focus
const XP_PER_MINUTE = 1; // 1 XP per minute of focus
const MIN_DURATION_FOR_XP = 10; // Minimum 10 minutes to get XP
const BONUS_XP_COMPLETION = 10; // Bonus for completing the set duration

export interface StartFocusParams {
  studentId: string;
  subjectId?: string | undefined;
  duration?: number | undefined; // Planned duration in minutes
}

/**
 * Start a new focus session
 */
export async function startFocusSession({
  studentId,
  subjectId,
  duration,
}: StartFocusParams) {
  try {
    // Check if there is already an active session
    const activeSession = await prisma.focusSession.findFirst({
      where: {
        studentId,
        status: FocusStatus.ACTIVE,
      },
    });

    if (activeSession) {
      // Auto-abort previous session if user starts a new one without finishing
      await prisma.focusSession.update({
        where: { id: activeSession.id },
        data: {
          status: FocusStatus.ABORTED,
          endTime: new Date(),
        },
      });
    }

    const session = await prisma.focusSession.create({
      data: {
        studentId,
        subjectId: subjectId ?? null,
        duration: duration ?? null, // Planned duration
        status: FocusStatus.ACTIVE,
        startTime: new Date(),
      },
    });

    log.info("Focus session started", { studentId, sessionId: session.id });

    return { success: true, session };
  } catch (error) {
    log.error("Failed to start focus session", { error, studentId });
    return { success: false, error: "Failed to start session" };
  }
}

/**
 * End a focus session (Complete or Abort)
 */
export async function endFocusSession(
  sessionId: string,
  studentId: string,
  status: FocusStatus = FocusStatus.COMPLETED,
) {
  try {
    const session = await prisma.focusSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.studentId !== studentId) {
      return { success: false, error: "Session not found" };
    }

    if (session.status !== FocusStatus.ACTIVE) {
      return { success: false, error: "Session already finished" };
    }

    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const actualDurationMinutes = Math.floor(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60),
    );

    let xpEarned = 0;

    // Calculate XP only if completed successfully
    if (status === FocusStatus.COMPLETED) {
      if (actualDurationMinutes >= MIN_DURATION_FOR_XP) {
        xpEarned = actualDurationMinutes * XP_PER_MINUTE;

        // Bonus if they met their target duration (if set)
        if (session.duration && actualDurationMinutes >= session.duration) {
          xpEarned += BONUS_XP_COMPLETION;
        }
      }

      // Award XP
      if (xpEarned > 0) {
        await addXP(studentId, xpEarned, "Focus Session", {
          isFast: false, // Not applicable
          isPerfect: true, // Completed session
        });
      }
    }

    const updatedSession = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status,
        endTime,
        xpEarned,
      },
    });

    log.info("Focus session ended", {
      studentId,
      sessionId,
      status,
      duration: actualDurationMinutes,
      xpEarned,
    });

    return { success: true, session: updatedSession, xpEarned };
  } catch (error) {
    log.error("Failed to end focus session", { error, sessionId });
    return { success: false, error: "Failed to end session" };
  }
}

/**
 * Get active focus session for student
 */
export async function getActiveFocusSession(studentId: string) {
  try {
    const session = await prisma.focusSession.findFirst({
      where: {
        studentId,
        status: FocusStatus.ACTIVE,
      },
      include: {
        subject: true,
      },
    });

    return session;
  } catch (error) {
    log.error("Failed to get active focus session", { error, studentId });
    return null;
  }
}

/**
 * Get focus stats for student
 */
export async function getFocusStats(studentId: string) {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: {
        studentId,
        status: FocusStatus.COMPLETED,
      },
      orderBy: { startTime: "desc" },
      take: 100, // Last 100 sessions
    });

    const totalMinutes = sessions.reduce((acc, s) => {
      if (!s.endTime) return acc;
      const duration = Math.floor(
        (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
          (1000 * 60),
      );
      return acc + duration;
    }, 0);

    const totalSessions = sessions.length;
    const totalXP = sessions.reduce((acc, s) => acc + s.xpEarned, 0);

    return {
      totalMinutes,
      totalSessions,
      totalXP,
      recentSessions: sessions.slice(0, 5),
    };
  } catch (error) {
    log.error("Failed to get focus stats", { error, studentId });
    return {
      totalMinutes: 0,
      totalSessions: 0,
      totalXP: 0,
      recentSessions: [],
    };
  }
}
