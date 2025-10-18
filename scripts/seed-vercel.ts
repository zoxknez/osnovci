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
    }

    console.log("\n🎉 Homework dodat!");
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
        priority: "IMPORTANT",
        status: "ASSIGNED",
      },
      {
        title: "Čitanje lektire - Srpski jezik",
        description: "Pročitaj prvo poglavlje",
        dueDate: nextWeek,
        priority: "NORMAL",
        status: "ASSIGNED",
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

    console.log(`✅ Created demo${i}@osnovci.rs with homework`);
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

