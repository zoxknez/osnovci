// Debug endpoint za proveru demo naloga
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    // Get current session
    const session = await auth();
    
    // Check demo user in database
    const demoUser = await prisma.user.findUnique({
      where: { email: "marko@demo.rs" },
      include: {
        student: {
          include: {
            homework: true,
            scheduleEntries: true,
            gamification: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      session: session
        ? {
            user: session.user,
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
                  scheduleCount: demoUser.student.scheduleEntries.length,
                  hasGamification: !!demoUser.student.gamification,
                }
              : null,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error.message || String(error),
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
