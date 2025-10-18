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

  // Proveri da li već postoje demo korisnici
  const existingDemo = await prisma.user.findFirst({
    where: { email: "demo1@osnovci.rs" },
  });

  if (existingDemo) {
    console.log("✅ Demo korisnici već postoje!");
    return;
  }

  const hashedPassword = await bcrypt.hash("demo123", 10);

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

    console.log(`✅ Created demo${i}@osnovci.rs`);
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

