/**
 * API Route: AI Homework Helper
 * Pomaže učeniku da SAM reši zadatak kroz step-by-step guidance
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getHomeworkHelp } from "@/lib/ai/homework-helper";
import { log } from "@/lib/logger";
import { z } from "zod";

const requestSchema = z.object({
  photoUrl: z.string().url().optional(),
  text: z.string().min(1).optional(),
  subject: z.string().min(1),
  grade: z.number().int().min(1).max(8),
  homeworkId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Rate limiting - max 10 pomoći dnevno
    // TODO: Implementirati rate limiting

    // Get student grade
    const studentGrade = session.user.student?.grade || validated.grade;

    // Build request object, only including optional props if defined
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

    // Get homework help
    const help = await getHomeworkHelp(helpRequest);

    log.info("Homework help provided", {
      userId: session.user.id,
      subject: validated.subject,
      hasPhoto: !!validated.photoUrl,
    });

    return NextResponse.json({
      success: true,
      data: help,
    });
  } catch (error) {
    log.error("Error in homework help API", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neispravni podaci", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Greška pri obradi zahteva" },
      { status: 500 }
    );
  }
}

