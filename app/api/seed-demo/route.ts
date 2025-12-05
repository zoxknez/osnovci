/**
 * API endpoint za kreiranje demo naloga u produkciji
 * Zaštićen ADMIN_SECRET-om
 */

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Zaštita: samo sa ADMIN_SECRET
    const adminSecret = request.headers.get("x-admin-secret");
    const envSecret = process.env["ADMIN_SECRET"];

    if (!envSecret || adminSecret !== envSecret) {
      log.warn("Unauthorized seed-demo access attempt", { requestId });
      return NextResponse.json(
        { error: "Nemate pristup", requestId },
        { status: 403 },
      );
    }

    // Check if demo user already exists
    const existing = await prisma.user.findUnique({
      where: { email: "marko@demo.rs" },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        requestId,
        message: "Demo nalog već postoji",
        email: "marko@demo.rs",
      });
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash("marko123", 10);

    const user = await prisma.user.create({
      data: {
        id: "demo-student-id",
        email: "marko@demo.rs",
        phone: "0641234567",
        password: hashedPassword,
        role: "STUDENT",
        emailVerified: new Date(),
        student: {
          create: {
            name: "Marko Marković",
            school: 'OŠ "Vuk Karadžić"',
            grade: 5,
            class: "A",
            parentalConsentGiven: true,
            accountActive: true,
          },
        },
      },
      include: {
        student: true,
      },
    });

    // Create gamification record
    if (user.student) {
      await prisma.gamification.create({
        data: {
          studentId: user.student.id,
        },
      });

      // Create some subjects
      const subjects = await Promise.all([
        prisma.subject.create({
          data: { name: "Matematika", color: "#3b82f6", icon: "📐" },
        }),
        prisma.subject.create({
          data: { name: "Srpski jezik", color: "#ef4444", icon: "📖" },
        }),
        prisma.subject.create({
          data: { name: "Engleski jezik", color: "#10b981", icon: "🇬🇧" },
        }),
      ]);

      // Create some homework
      await prisma.homework.create({
        data: {
          title: "Kvadratne jednačine - vežbe",
          description: "Rešiti zadatke 1-10 iz udžbenika strana 45",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          priority: "IMPORTANT",
          status: "ASSIGNED",
          studentId: user.student.id,
          subjectId: subjects[0].id,
        },
      });

      await prisma.homework.create({
        data: {
          title: "Esej o proleću",
          description: "Napisati esej od 200 reči o proleću i prirodi",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          priority: "NORMAL",
          status: "IN_PROGRESS",
          studentId: user.student.id,
          subjectId: subjects[1].id,
        },
      });

      // Create schedule
      await Promise.all([
        prisma.scheduleEntry.create({
          data: {
            studentId: user.student.id,
            subjectId: subjects[0].id,
            dayOfWeek: "MONDAY",
            startTime: "08:00",
            endTime: "08:45",
            room: "101",
            isAWeek: true,
            isBWeek: true,
          },
        }),
        prisma.scheduleEntry.create({
          data: {
            studentId: user.student.id,
            subjectId: subjects[1].id,
            dayOfWeek: "MONDAY",
            startTime: "09:00",
            endTime: "09:45",
            room: "205",
            isAWeek: true,
            isBWeek: true,
          },
        }),
      ]);
    }

    log.info("Demo account created successfully", {
      email: "marko@demo.rs",
      userId: user.id,
      requestId,
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: "Demo nalog uspešno kreiran",
      email: "marko@demo.rs",
      password: "marko123",
    });
  } catch (error) {
    log.error("Failed to create demo account", { error, requestId });
    return NextResponse.json(
      {
        error: "Greška pri kreiranju demo naloga",
        details: error instanceof Error ? error.message : "Nepoznata greška",
        requestId,
      },
      { status: 500 },
    );
  }
}
