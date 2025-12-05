/**
 * Debug endpoint za proveru demo naloga
 * Zaštićen: samo za ADMIN korisnike ili sa ADMIN_SECRET
 */

import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Provera pristupa: ADMIN korisnik ili ADMIN_SECRET header
    const session = await auth();
    const adminSecret = request.headers.get("x-admin-secret");
    const envSecret = process.env["ADMIN_SECRET"];

    const isAdmin = session?.user?.role === "ADMIN";
    const hasValidSecret = envSecret && adminSecret === envSecret;

    if (!isAdmin && !hasValidSecret) {
      log.warn("Unauthorized debug-demo access attempt", { requestId });
      return NextResponse.json(
        { error: "Nemate pristup", requestId },
        { status: 403 },
      );
    }

    // Check demo user in database
    const demoUser = await prisma.user.findUnique({
      where: { email: "marko@demo.rs" },
      include: {
        student: {
          include: {
            homework: true,
            schedule: true,
            gamification: true,
          },
        },
      },
    });

    log.info("Debug-demo check performed", {
      requestId,
      userId: session?.user?.id,
    });

    return NextResponse.json({
      success: true,
      requestId,
      session: session
        ? {
            user: {
              id: session.user.id,
              role: session.user.role,
            },
            expires: session.expires,
          }
        : null,
      demoUser: demoUser
        ? {
            id: demoUser.id,
            email: demoUser.email,
            role: demoUser.role,
            emailVerified: demoUser.emailVerified,
            student: demoUser.student
              ? {
                  id: demoUser.student.id,
                  name: demoUser.student.name,
                  parentalConsentGiven: demoUser.student.parentalConsentGiven,
                  accountActive: demoUser.student.accountActive,
                  homeworkCount: demoUser.student.homework.length,
                  scheduleCount: demoUser.student.schedule.length,
                  hasGamification: !!demoUser.student.gamification,
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    log.error("Debug-demo failed", { error, requestId });
    return NextResponse.json(
      {
        error: "Greška pri proveri",
        details: error instanceof Error ? error.message : "Nepoznata greška",
        requestId,
      },
      { status: 500 },
    );
  }
}
