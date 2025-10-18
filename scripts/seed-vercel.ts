#!/usr/bin/env tsx
/**
 * Seed script za Vercel Postgres
 * Kreira demo naloge i osnovne podatke
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Vercel database...");

  const hashedPassword = await bcrypt.hash("demo123", 10);

  // Proveri da li demo korisnici već postoje
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: "demo",
        endsWith: "@osnovci.rs",
      },
    },
    include: {
      student: true,
    },
  });

  if (existingUsers.length > 0) {
    console.log(`📦 Postojeći demo korisnici: ${existingUsers.length}`);
    console.log("➕ Dodajem domaće zadatke...");

    // Dodaj homework postojećim korisnicima
    for (const user of existingUsers) {
      if (!user.student) continue;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const mathSubject = await prisma.subject.findFirst({
        where: { name: "Matematika" },
      });
      const serbianSubject = await prisma.subject.findFirst({
        where: { name: "Srpski jezik" },
      });

      // Proveri da li već ima homework
      const existingHomework = await prisma.homework.findFirst({
        where: { studentId: user.student.id },
      });

      if (!existingHomework) {
        if (mathSubject) {
          await prisma.homework.create({
            data: {
              title: "Domaći iz Matematike - Jednačine",
              description: "Reši zadatke 1-15 iz udžbenika",
              dueDate: tomorrow,
              priority: "IMPORTANT",
              status: "ASSIGNED",
              studentId: user.student.id,
              subjectId: mathSubject.id,
            },
          });
        }

        if (serbianSubject) {
          await prisma.homework.create({
            data: {
              title: "Čitanje lektire - Srpski jezik",
              description: "Pročitaj prvo poglavlje",
              dueDate: nextWeek,
              priority: "NORMAL",
              status: "ASSIGNED",
              studentId: user.student.id,
              subjectId: serbianSubject.id,
            },
          });
        }
        console.log(`✅ Dodati zadaci za ${user.email}`);
      } else {
        console.log(`⏭️  ${user.email} već ima zadatke`);
      }

      // Dodaj raspored (schedule entries)
      const hasSchedule = await prisma.scheduleEntry.findFirst({
        where: { studentId: user.student.id },
      });

      if (!hasSchedule && mathSubject && serbianSubject) {
        const schedule = [
          {
            dayOfWeek: "MONDAY" as const,
            startTime: "08:00",
            endTime: "08:45",
            room: "Učionica 12",
          },
          {
            dayOfWeek: "MONDAY" as const,
            startTime: "09:00",
            endTime: "09:45",
            room: "Učionica 5",
          },
          {
            dayOfWeek: "TUESDAY" as const,
            startTime: "08:00",
            endTime: "08:45",
            room: "Učionica 12",
          },
        ];

        await prisma.scheduleEntry.create({
          data: {
            ...schedule[0],
            studentId: user.student.id,
            subjectId: mathSubject.id,
          },
        });

        await prisma.scheduleEntry.create({
          data: {
            ...schedule[1],
            studentId: user.student.id,
            subjectId: serbianSubject.id,
          },
        });

        await prisma.scheduleEntry.create({
          data: {
            ...schedule[2],
            studentId: user.student.id,
            subjectId: mathSubject.id,
          },
        });
      }

      // Dodaj ocene (grades)
      const hasGrades = await prisma.grade.findFirst({
        where: { studentId: user.student.id },
      });

      if (!hasGrades && mathSubject && serbianSubject) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        await prisma.grade.create({
          data: {
            studentId: user.student.id,
            subjectId: mathSubject.id,
            grade: "5",
            category: "Kontrolni",
            description: "Jednačine i nejednačine",
            date: lastMonth,
            weight: 2,
          },
        });

        await prisma.grade.create({
          data: {
            studentId: user.student.id,
            subjectId: serbianSubject.id,
            grade: "4",
            category: "Usmeno",
            description: "Lektira - analiza",
            date: new Date(),
            weight: 1,
          },
        });
      }
    }

    console.log("\n🎉 Svi podaci dodati!");
    return;
  }

  // Kreiraj 20 demo učenika
  for (let i = 1; i <= 20; i++) {
    console.log(`Creating demo${i}@osnovci.rs...`);

    const user = await prisma.user.create({
      data: {
        email: `demo${i}@osnovci.rs`,
        password: hashedPassword,
        role: "STUDENT",
        emailVerified: new Date(),
        student: {
          create: {
            name: `Demo Učenik ${i}`,
            grade: Math.floor(Math.random() * 4) + 5, // 5-8
            class: ["A", "B", "V"][Math.floor(Math.random() * 3)],
            school: "Demo Osnovna Škola",
          },
        },
      },
      include: {
        student: true,
      },
    });

    // Dodaj par predmeta
    const subjects = [
      { name: "Matematika", color: "#3b82f6" },
      { name: "Srpski jezik", color: "#ef4444" },
      { name: "Engleski jezik", color: "#10b981" },
      { name: "Biologija", color: "#f59e0b" },
      { name: "Istorija", color: "#8b5cf6" },
    ];

    for (const subject of subjects) {
      // Kreiraj Subject ako ne postoji
      const existingSubject = await prisma.subject.findFirst({
        where: { name: subject.name },
      });

      const subjectId =
        existingSubject?.id ||
        (
          await prisma.subject.create({
            data: subject,
          })
        ).id;

      // Poveži sa studentom
      await prisma.studentSubject.create({
        data: {
          studentId: user.student!.id,
          subjectId,
        },
      });
    }

    // Dodaj nekoliko demo domaćih zadataka
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const homework = [
      {
        title: "Domaći iz Matematike - Jednačine",
        description: "Reši zadatke 1-15 iz udžbenika",
        dueDate: tomorrow,
        priority: "IMPORTANT" as const,
        status: "ASSIGNED" as const,
      },
      {
        title: "Čitanje lektire - Srpski jezik",
        description: "Pročitaj prvo poglavlje",
        dueDate: nextWeek,
        priority: "NORMAL" as const,
        status: "ASSIGNED" as const,
      },
    ];

    // Dohvati subject ID za Matematiku i Srpski
    const mathSubject = await prisma.subject.findFirst({
      where: { name: "Matematika" },
    });
    const serbianSubject = await prisma.subject.findFirst({
      where: { name: "Srpski jezik" },
    });

    if (mathSubject) {
      await prisma.homework.create({
        data: {
          ...homework[0],
          studentId: user.student!.id,
          subjectId: mathSubject.id,
        },
      });
    }

    if (serbianSubject) {
      await prisma.homework.create({
        data: {
          ...homework[1],
          studentId: user.student!.id,
          subjectId: serbianSubject.id,
        },
      });
    }

    // Dodaj raspored (schedule)
    if (mathSubject && serbianSubject) {
      await prisma.scheduleEntry.createMany({
        data: [
          {
            studentId: user.student!.id,
            subjectId: mathSubject.id,
            dayOfWeek: "MONDAY" as const,
            startTime: "08:00",
            endTime: "08:45",
            room: "Učionica 12",
          },
          {
            studentId: user.student!.id,
            subjectId: serbianSubject.id,
            dayOfWeek: "MONDAY" as const,
            startTime: "09:00",
            endTime: "09:45",
            room: "Učionica 5",
          },
          {
            studentId: user.student!.id,
            subjectId: mathSubject.id,
            dayOfWeek: "TUESDAY" as const,
            startTime: "08:00",
            endTime: "08:45",
            room: "Učionica 12",
          },
        ],
      });
    }

    // Dodaj ocene (grades)
    if (mathSubject && serbianSubject) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      await prisma.grade.createMany({
        data: [
          {
            studentId: user.student!.id,
            subjectId: mathSubject.id,
            grade: "5",
            category: "Kontrolni",
            description: "Jednačine i nejednačine",
            date: lastMonth,
            weight: 2,
          },
          {
            studentId: user.student!.id,
            subjectId: serbianSubject.id,
            grade: "4",
            category: "Usmeno",
            description: "Lektira - analiza",
            date: new Date(),
            weight: 1,
          },
        ],
      });
    }

    console.log(`✅ Created demo${i}@osnovci.rs with all data`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 Demo nalozi:");
  console.log("   Email: demo1@osnovci.rs do demo20@osnovci.rs");
  console.log("   Password: demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

