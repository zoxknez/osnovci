import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievement-triggers";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user?.student) {
      return NextResponse.json(
        { error: "Only students can check achievements" },
        { status: 403 }
      );
    }

    const studentId = user.student.id;

    // Check and unlock achievements
    const results = await checkAndUnlockAchievements(studentId);

    // Get gamification ID
    const gamification = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamification) {
      return NextResponse.json(
        { error: "Gamification not found" },
        { status: 404 }
      );
    }

    // Get updated achievements list
    const achievements = await prisma.achievement.findMany({
      where: { gamificationId: gamification.id },
      orderBy: { unlockedAt: "desc" },
    });

    return NextResponse.json({
      checked: results.length,
      newUnlocks: results.filter((r) => r.unlocked).length,
      achievements,
      progress: results.filter((r) => !r.unlocked),
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");

    // Get user with student/guardian info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: {
          include: {
            links: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    // Determine student ID
    let studentId: string;

    if (user?.student) {
      studentId = user.student.id;
    } else if (user?.guardian && studentIdParam) {
      const hasAccess = user.guardian.links.some(
        (link: any) => link.studentId === studentIdParam
      );
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      studentId = studentIdParam;
    } else {
      return NextResponse.json(
        { error: "Student ID required" },
        { status: 400 }
      );
    }

    // Get gamification ID
    const gamification = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamification) {
      return NextResponse.json(
        { error: "Gamification not found" },
        { status: 404 }
      );
    }

    // Get achievements
    const achievements = await prisma.achievement.findMany({
      where: { gamificationId: gamification.id },
      orderBy: { unlockedAt: "desc" },
    });

    // Get progress for locked achievements
    const { checkAndUnlockAchievements } = await import(
      "@/lib/gamification/achievement-triggers"
    );
    const progress = await checkAndUnlockAchievements(studentId);

    return NextResponse.json({
      achievements,
      progress: progress.filter((p) => !p.unlocked),
      stats: {
        total: achievements.length,
        totalXP: achievements.reduce((sum: number, a: any) => sum + (a.xpReward || 0), 0),
        level: gamification?.level || 1,
        currentXP: gamification?.xp || 0,
        totalXPEarned: gamification?.totalXPEarned || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
