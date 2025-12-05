/**
 * API Route: Subjects
 * Vraća listu svih predmeta
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "subjects",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        { error: "Previše zahteva", requestId },
        { status: 429, headers },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niste prijavljeni", requestId },
        { status: 401 },
      );
    }

    // Dohvati sve predmete
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Ako nema predmeta, vrati default listu
    if (subjects.length === 0) {
      const defaultSubjects = [
        { id: "default-1", name: "Matematika", color: "#3b82f6", icon: "📐" },
        { id: "default-2", name: "Srpski jezik", color: "#ef4444", icon: "📚" },
        {
          id: "default-3",
          name: "Engleski jezik",
          color: "#8b5cf6",
          icon: "🇬🇧",
        },
        {
          id: "default-4",
          name: "Priroda i društvo",
          color: "#22c55e",
          icon: "🌿",
        },
        { id: "default-5", name: "Likovno", color: "#f97316", icon: "🎨" },
        { id: "default-6", name: "Muzičko", color: "#ec4899", icon: "🎵" },
        { id: "default-7", name: "Fizičko", color: "#06b6d4", icon: "⚽" },
        { id: "default-8", name: "Informatika", color: "#6366f1", icon: "💻" },
        { id: "default-9", name: "Istorija", color: "#a855f7", icon: "🏛️" },
        { id: "default-10", name: "Geografija", color: "#14b8a6", icon: "🌍" },
        { id: "default-11", name: "Biologija", color: "#84cc16", icon: "🧬" },
        { id: "default-12", name: "Fizika", color: "#0ea5e9", icon: "⚡" },
        { id: "default-13", name: "Hemija", color: "#f43f5e", icon: "🧪" },
      ];

      return NextResponse.json({
        success: true,
        requestId,
        subjects: defaultSubjects,
      });
    }

    return NextResponse.json({
      success: true,
      requestId,
      subjects,
    });
  } catch (error) {
    log.error("Error fetching subjects", { error, requestId });
    return NextResponse.json(
      { error: "Greška pri učitavanju predmeta", requestId },
      { status: 500 },
    );
  }
}
