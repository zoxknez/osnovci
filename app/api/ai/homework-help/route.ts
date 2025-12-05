/**
 * API Route: AI Homework Helper
 * Pomaže učeniku da SAM reši zadatak kroz step-by-step guidance
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getHomeworkHelp } from "@/lib/ai/homework-helper";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import { addRateLimitHeaders, rateLimit } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/tracking/activity-logger";

const requestSchema = z.object({
  photoUrl: z.string().url().optional(),
  text: z.string().min(1).optional(),
  subject: z.string().min(1),
  grade: z.number().int().min(1).max(8),
  homeworkId: z.string().optional(),
});

// Timeout za AI pozive (30 sekundi)
const AI_TIMEOUT_MS = 30000;

export async function POST(request: NextRequest) {
  const requestId = nanoid(10);

  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Niste prijavljeni kao učenik", requestId },
        { status: 401 },
      );
    }

    // Rate limiting - max 10 AI pomoći dnevno po korisniku
    const rateLimitResult = await rateLimit(request, {
      limit: 10,
      window: 24 * 60 * 60, // 24 sata u sekundama
      prefix: "ai-help",
    });

    if (!rateLimitResult.success) {
      log.warn("AI help rate limit exceeded", {
        userId: session.user.id,
        requestId,
      });

      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          error: "Dostigao si dnevni limit za AI pomoć. Pokušaj ponovo sutra!",
          requestId,
        },
        { status: 429, headers },
      );
    }

    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Get student info
    const studentId = session.user.student?.id;
    const studentGrade = session.user.student?.grade || validated.grade;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student profil nije pronađen", requestId },
        { status: 400 },
      );
    }

    // Build request object
    const helpRequest: {
      subject: string;
      grade: number;
      photoUrl?: string;
      text?: string;
      homeworkId?: string;
    } = {
      subject: validated.subject,
      grade: studentGrade,
    };

    if (validated.photoUrl) helpRequest.photoUrl = validated.photoUrl;
    if (validated.text) helpRequest.text = validated.text;
    if (validated.homeworkId) helpRequest.homeworkId = validated.homeworkId;

    // Get homework help with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let help: Awaited<ReturnType<typeof getHomeworkHelp>> | undefined;
    try {
      help = await Promise.race([
        getHomeworkHelp(helpRequest),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("AI request timeout"));
          });
        }),
      ]);
    } finally {
      clearTimeout(timeoutId);
    }

    // COPPA Activity Logging - log AI usage for parental oversight
    await logActivity({
      studentId,
      type: "HOMEWORK_UPDATED", // Using existing type, could add AI_HELP_USED
      description: `Korišćena AI pomoć za predmet: ${validated.subject}`,
      metadata: {
        subject: validated.subject,
        hasPhoto: !!validated.photoUrl,
        homeworkId: validated.homeworkId,
        requestId,
      },
      request,
    });

    log.info("Homework help provided", {
      userId: session.user.id,
      studentId,
      subject: validated.subject,
      hasPhoto: !!validated.photoUrl,
      requestId,
    });

    return NextResponse.json({
      success: true,
      data: help,
      requestId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "AI request timeout") {
      log.error("AI homework help timeout", { requestId });
      return NextResponse.json(
        { error: "Zahtev je trajao predugo. Pokušaj ponovo.", requestId },
        { status: 504 },
      );
    }

    log.error("Error in homework help API", { error, requestId });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neispravni podaci", issues: error.issues, requestId },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Greška pri obradi zahteva", requestId },
      { status: 500 },
    );
  }
}
