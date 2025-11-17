// Seed script za demo naloge - 5 različitih profila
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_ACCOUNTS = [
  {
    name: "Marko Marković",
    email: "marko@demo.rs",
    password: "marko123",
    phone: "0641234567",
    role: "STUDENT" as const,
    school: 'OŠ "Vuk Karadžić"',
    grade: 5,
    class: "A",
    description: "Odličan učenik, voli matematiku i fiziku",
  },
  {
    name: "Ana Petrović",
    email: "ana@demo.rs",
    password: "ana123",
    phone: "0642345678",
    role: "STUDENT" as const,
    school: 'OŠ "Dositej Obradović"',
    grade: 6,
    class: "B",
    description: "Talentovana za jezike i umetnost",
  },
  {
    name: "Stefan Nikolić",
    email: "stefan@demo.rs",
    password: "stefan123",
    phone: "0643456789",
    role: "STUDENT" as const,
    school: 'OŠ "Jovan Jovanović Zmaj"',
    grade: 7,
    class: "C",
    description: "Sportista i lider u odeljenju",
  },
  {
    name: "Milica Stanković",
    email: "milica@demo.rs",
    password: "milica123",
    phone: "0644567890",
    role: "STUDENT" as const,
    school: 'OŠ "Petar Petrović Njegoš"',
    grade: 4,
    class: "A",
    description: "Kreativna, voli da crta i piše priče",
  },
  {
    name: "Luka Pavlović",
    email: "luka@demo.rs",
    password: "luka123",
    phone: "0645678901",
    role: "STUDENT" as const,
    school: 'OŠ "Branko Radičević"',
    grade: 8,
    class: "D",
    description: "IT entuzijasta, voli programiranje",
  },
];

async function main() {
  console.log("🌱 Započinjem seed za demo naloge...\n");

  // Prvo obriši sve postojeće podatke
  await prisma.link.deleteMany({});
  await prisma.homework.deleteMany({});
  await prisma.scheduleEntry.deleteMany({});
  await prisma.studentSubject.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("🗑️ Stari podaci obrisani\n");

  // Kreiraj demo naloge
  console.log("👨‍🎓 Kreiram demo naloge:\n");

  for (const account of DEMO_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(account.password, 10);

    // Use fixed ID for first account (Marko) for demo mode
    const userId =
      account.email === "marko@demo.rs" ? "demo-student-id" : undefined;

    const created = await prisma.user.create({
      data: {
        ...(userId && { id: userId }),
        email: account.email,
        phone: account.phone,
        password: hashedPassword,
        role: account.role,
        student: {
          create: {
            name: account.name,
            school: account.school,
            grade: account.grade,
            class: account.class,
          },
        },
      },
      select: {
        student: {
          select: { id: true },
        },
      },
    });

    if (created.student) {
      await prisma.gamification.create({
        data: {
          studentId: created.student.id,
        },
      });
    }

    console.log(`✅ ${account.name}`);
    console.log(`   📧 Email: ${account.email}`);
    console.log(`   🔑 Lozinka: ${account.password}`);
    console.log(`   🏫 ${account.school} - ${account.grade}/${account.class}`);
    console.log(`   💡 ${account.description}\n`);
  }

  // Kreiraj predmete za sve učenike
  console.log("📚 Kreiram predmete...\n");

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
    prisma.subject.create({
      data: { name: "Istorija", color: "#f59e0b", icon: "🏛️" },
    }),
    prisma.subject.create({
      data: { name: "Geografija", color: "#14b8a6", icon: "🌍" },
    }),
    prisma.subject.create({
      data: { name: "Biologija", color: "#22c55e", icon: "🧬" },
    }),
    prisma.subject.create({
      data: { name: "Hemija", color: "#8b5cf6", icon: "⚗️" },
    }),
    prisma.subject.create({
      data: { name: "Fizika", color: "#6366f1", icon: "⚛️" },
    }),
    prisma.subject.create({
      data: { name: "Likovno", color: "#ec4899", icon: "🎨" },
    }),
    prisma.subject.create({
      data: { name: "Muzičko", color: "#f97316", icon: "🎵" },
    }),
    prisma.subject.create({
      data: { name: "Fizičko", color: "#06b6d4", icon: "⚽" },
    }),
    prisma.subject.create({
      data: { name: "Informatika", color: "#0ea5e9", icon: "💻" },
    }),
  ]);

  console.log(`✅ Kreirano ${subjects.length} predmeta\n`);

  const getSubject = (name: string) => {
    const subject = subjects.find((s) => s.name === name);
    if (!subject) {
      throw new Error(`Subject "${name}" nije pronađen tokom seed-a.`);
    }
    return subject;
  };

  // Dodaj po nekoliko domaćih zadataka za prvog učenika (Marko)
  const marko = await prisma.user.findUnique({
    where: { email: "marko@demo.rs" },
    include: { student: true },
  });

  if (marko?.student) {
    console.log("📝 Dodajem domaće zadatke za Marka...\n");

    const matematika = getSubject("Matematika");
    const srpski = getSubject("Srpski jezik");
    const engleski = getSubject("Engleski jezik");

    await prisma.homework.create({
      data: {
        title: "Kvadratne jednačine - vežbe",
        description: "Rešiti zadatke 1-10 iz udžbenika strana 45",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Za 2 dana
        priority: "IMPORTANT",
        status: "ASSIGNED",
        studentId: marko.student.id,
        subjectId: matematika.id,
      },
    });

    await prisma.homework.create({
      data: {
        title: "Esej o proleću",
        description: "Napisati esej od 200 reči o proleću i prirodi",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Za 5 dana
        priority: "NORMAL",
        status: "IN_PROGRESS",
        studentId: marko.student.id,
        subjectId: srpski.id,
      },
    });

    await prisma.homework.create({
      data: {
        title: "Past Simple Tense",
        description: "Vežbati prošlo vreme - workbook str. 23-25",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Sutra
        priority: "URGENT",
        status: "ASSIGNED",
        studentId: marko.student.id,
        subjectId: engleski.id,
      },
    });

    console.log("✅ Dodato 3 domaća zadatka\n");
  }

  // Dodaj raspored za Marka
  if (marko?.student) {
    console.log("📅 Kreiram raspored časova za Marka...\n");

    const matematika = getSubject("Matematika");
    const srpski = getSubject("Srpski jezik");
    const engleski = getSubject("Engleski jezik");
    const fizika = getSubject("Fizika");
    const istorija = getSubject("Istorija");
    const fizicko = getSubject("Fizičko");

    await Promise.all([
      // Ponedeljak
      prisma.scheduleEntry.create({
        data: {
          studentId: marko.student.id,
          subjectId: matematika.id,
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
          studentId: marko.student.id,
          subjectId: srpski.id,
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "09:45",
          room: "205",
          isAWeek: true,
          isBWeek: true,
        },
      }),

      // Utorak
      prisma.scheduleEntry.create({
        data: {
          studentId: marko.student.id,
          subjectId: engleski.id,
          dayOfWeek: "TUESDAY",
          startTime: "08:00",
          endTime: "08:45",
          room: "302",
          isAWeek: true,
          isBWeek: true,
        },
      }),
      fizika &&
        prisma.scheduleEntry.create({
          data: {
            studentId: marko.student.id,
            subjectId: fizika.id,
            dayOfWeek: "TUESDAY",
            startTime: "09:00",
            endTime: "09:45",
            room: "Lab 1",
            isAWeek: true,
            isBWeek: true,
          },
        }),

      // Sreda
      istorija &&
        prisma.scheduleEntry.create({
          data: {
            studentId: marko.student.id,
            subjectId: istorija.id,
            dayOfWeek: "WEDNESDAY",
            startTime: "08:00",
            endTime: "08:45",
            room: "203",
            isAWeek: true,
            isBWeek: true,
          },
        }),
      prisma.scheduleEntry.create({
        data: {
          studentId: marko.student.id,
          subjectId: matematika.id,
          dayOfWeek: "WEDNESDAY",
          startTime: "09:00",
          endTime: "09:45",
          room: "101",
          isAWeek: true,
          isBWeek: true,
        },
      }),

      // Četvrtak
      fizicko &&
        prisma.scheduleEntry.create({
          data: {
            studentId: marko.student.id,
            subjectId: fizicko.id,
            dayOfWeek: "THURSDAY",
            startTime: "08:00",
            endTime: "08:45",
            room: "Sala",
            isAWeek: true,
            isBWeek: true,
          },
        }),
      prisma.scheduleEntry.create({
        data: {
          studentId: marko.student.id,
          subjectId: srpski.id,
          dayOfWeek: "THURSDAY",
          startTime: "09:00",
          endTime: "09:45",
          room: "205",
          isAWeek: true,
          isBWeek: true,
        },
      }),

      // Petak
      prisma.scheduleEntry.create({
        data: {
          studentId: marko.student.id,
          subjectId: engleski.id,
          dayOfWeek: "FRIDAY",
          startTime: "08:00",
          endTime: "08:45",
          room: "302",
          isAWeek: true,
          isBWeek: true,
        },
      }),
      prisma.scheduleEntry.create({
        data: {
          studentId: marko.student.id,
          subjectId: matematika.id,
          dayOfWeek: "FRIDAY",
          startTime: "09:00",
          endTime: "09:45",
          room: "101",
          isAWeek: true,
          isBWeek: true,
        },
      }),
    ]);

    console.log("✅ Raspored kreiran\n");
  }

  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║                                                           ║");
  console.log("║           🎉 SEED ZAVRŠEN - 5 DEMO NALOGA! 🎉            ║");
  console.log("║                                                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("📧 Demo nalozi:");
  console.log("");
  console.log("1️⃣  Marko Marković");
  console.log("   Email: marko@demo.rs | Lozinka: marko123");
  console.log("   5/A - OŠ Vuk Karadžić");
  console.log("");
  console.log("2️⃣  Ana Petrović");
  console.log("   Email: ana@demo.rs | Lozinka: ana123");
  console.log("   6/B - OŠ Dositej Obradović");
  console.log("");
  console.log("3️⃣  Stefan Nikolić");
  console.log("   Email: stefan@demo.rs | Lozinka: stefan123");
  console.log("   7/C - OŠ Jovan Jovanović Zmaj");
  console.log("");
  console.log("4️⃣  Milica Stanković");
  console.log("   Email: milica@demo.rs | Lozinka: milica123");
  console.log("   4/A - OŠ Petar Petrović Njegoš");
  console.log("");
  console.log("5️⃣  Luka Pavlović");
  console.log("   Email: luka@demo.rs | Lozinka: luka123");
  console.log("   8/D - OŠ Branko Radičević");
  console.log("");
  console.log("🎯 Marko ima 3 domaća zadatka i kompletan raspored!");
  console.log("🌐 Login: http://localhost:3000/prijava");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Greška:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
