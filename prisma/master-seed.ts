// Master Seed - Kompletan seed sa svim demo nalozima i podacima
import { PrismaClient, DayOfWeek } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo profili sa imenima
const NAMED_DEMO_ACCOUNTS = [
  {
    name: "Marko Marković",
    email: "marko@demo.rs",
    password: "marko123",
    phone: "0641234567",
    school: 'OŠ "Vuk Karadžić"',
    grade: 5,
    class: "A",
  },
  {
    name: "Ana Petrović",
    email: "ana@demo.rs",
    password: "ana123",
    phone: "0642345678",
    school: 'OŠ "Dositej Obradović"',
    grade: 6,
    class: "B",
  },
  {
    name: "Stefan Nikolić",
    email: "stefan@demo.rs",
    password: "stefan123",
    phone: "0643456789",
    school: 'OŠ "Jovan Jovanović Zmaj"',
    grade: 7,
    class: "C",
  },
  {
    name: "Milica Stanković",
    email: "milica@demo.rs",
    password: "milica123",
    phone: "0644567890",
    school: 'OŠ "Petar Petrović Njegoš"',
    grade: 4,
    class: "A",
  },
  {
    name: "Luka Pavlović",
    email: "luka@demo.rs",
    password: "luka123",
    phone: "0645678901",
    school: 'OŠ "Branko Radičević"',
    grade: 8,
    class: "D",
  },
];

// Generička imena za dodatne naloge
const GENERIC_STUDENT_NAMES = [
  "Jelena Jovanović",
  "Nikola Đorđević",
  "Sara Stojanović",
  "Filip Ilić",
  "Teodora Todorović",
  "Aleksandar Mitić",
  "Jovana Popović",
  "Dušan Kostić",
  "Katarina Simić",
  "Miloš Radović",
  "Emilija Đukić",
  "Vuk Marić",
  "Anastasija Lukić",
  "David Tomić",
  "Sofija Živković",
];

const SCHOOLS = [
  'OŠ "Vuk Karadžić"',
  'OŠ "Dositej Obradović"',
  'OŠ "Jovan Jovanović Zmaj"',
  'OŠ "Petar Petrović Njegoš"',
  'OŠ "Branko Radičević"',
];

async function main() {
  console.log("🌱 Započinjem MASTER SEED...\n");

  // 1) Čišćenje
  await prisma.$transaction([
    prisma.link.deleteMany({}),
    prisma.homework.deleteMany({}),
    prisma.scheduleEntry.deleteMany({}),
    prisma.studentSubject.deleteMany({}),
    prisma.grade.deleteMany({}),
    prisma.subject.deleteMany({}),
    prisma.student.deleteMany({}),
    prisma.guardian.deleteMany({}),
    prisma.gamification.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);
  console.log("🗑️ Stari podaci obrisani\n");

  // 2) Kreiraj predmete (12)
  console.log("📚 Kreiram predmete...");
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
      data: { name: "Fizika", color: "#6366f1", icon: "⚛️" },
    }),
    prisma.subject.create({ data: { name: "Hemija", color: "#ec4899", icon: "🧪" } }),
    prisma.subject.create({
      data: { name: "Biologija", color: "#22c55e", icon: "🔬" },
    }),
    prisma.subject.create({
      data: { name: "Istorija", color: "#8b5cf6", icon: "🏛️" },
    }),
    prisma.subject.create({
      data: { name: "Geografija", color: "#06b6d4", icon: "🌍" },
    }),
    prisma.subject.create({
      data: { name: "Fizičko vaspitanje", color: "#f59e0b", icon: "⚽" },
    }),
    prisma.subject.create({
      data: { name: "Informatika", color: "#14b8a6", icon: "💻" },
    }),
    prisma.subject.create({
      data: { name: "Muzičko vaspitanje", color: "#a855f7", icon: "🎵" },
    }),
    prisma.subject.create({
      data: { name: "Likovno vaspitanje", color: "#f97316", icon: "🎨" },
    }),
  ]);
  console.log(`✅ Kreirano ${subjects.length} predmeta\n`);

  // 3) Kreiraj imenovane demo naloge
  console.log("👨‍🎓 Kreiram imenovane demo naloge...");
  const namedStudents = [];
  for (const account of NAMED_DEMO_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    const user = await prisma.user.create({
      data: {
        email: account.email,
        phone: account.phone,
        password: hashedPassword,
        role: "STUDENT",
        emailVerified: new Date(),
        student: {
          create: {
            name: account.name,
            school: account.school,
            grade: account.grade,
            class: account.class,
          },
        },
      },
      include: { student: true },
    });

    if (user.student) {
      await prisma.gamification.create({
        data: { studentId: user.student.id },
      });
      namedStudents.push(user.student);
    }

    console.log(`  ✅ ${account.name} (${account.email})`);
  }
  console.log();

  // 4) Kreiraj generičke demo naloge (15)
  console.log("👨‍🎓 Kreiram generičke demo naloge...");
  const genericStudents = [];
  const hashedDemoPassword = await bcrypt.hash("demo123", 10);

  for (let i = 0; i < 15; i++) {
    const user = await prisma.user.create({
      data: {
        email: `demo${i + 1}@osnovci.rs`,
        phone: `064${String(i + 1).padStart(7, "0")}`,
        password: hashedDemoPassword,
        role: "STUDENT",
        emailVerified: new Date(),
        student: {
          create: {
            name: GENERIC_STUDENT_NAMES[i],
            school: SCHOOLS[i % SCHOOLS.length],
            grade: (i % 8) + 1,
            class: String.fromCharCode(65 + (i % 4)),
          },
        },
      },
      include: { student: true },
    });

    if (user.student) {
      await prisma.gamification.create({
        data: { studentId: user.student.id },
      });
      genericStudents.push(user.student);
    }

    console.log(`  ✅ ${GENERIC_STUDENT_NAMES[i]} (demo${i + 1}@osnovci.rs)`);
  }
  console.log();

  // 5) Kreiraj glavni par ucenik@demo.rs + roditelj@demo.rs
  console.log("👨‍👧 Kreiram glavni demo par...");
  const demoStudentUser = await prisma.user.create({
    data: {
      email: "ucenik@demo.rs",
      phone: "0640000000",
      password: hashedDemoPassword,
      role: "STUDENT",
      emailVerified: new Date(),
      student: {
        create: {
          name: "Demo Učenik",
          school: SCHOOLS[0],
          grade: 5,
          class: "A",
        },
      },
    },
    include: { student: true },
  });

  if (demoStudentUser.student) {
    await prisma.gamification.create({
      data: { studentId: demoStudentUser.student.id },
    });
  }

  const demoGuardianUser = await prisma.user.create({
    data: {
      email: "roditelj@demo.rs",
      phone: "0650000000",
      password: hashedDemoPassword,
      role: "GUARDIAN",
      emailVerified: new Date(),
      guardian: {
        create: {
          name: "Demo Roditelj",
        },
      },
    },
    include: { guardian: true },
  });

  // Povezivanje
  if (demoStudentUser.student && demoGuardianUser.guardian) {
    await prisma.link.create({
      data: {
        studentId: demoStudentUser.student.id,
        guardianId: demoGuardianUser.guardian.id,
        linkCode: "DEMO2024",
        isActive: true,
      },
    });
    console.log("  ✅ Povezani ucenik@demo.rs i roditelj@demo.rs");
  }
  console.log();

  // 6) Dodaj kompletne podatke za SVE studente
  const allStudents = [
    ...namedStudents,
    ...genericStudents,
    ...(demoStudentUser.student ? [demoStudentUser.student] : []),
  ];

  console.log(`📝 Dodajem podatke za ${allStudents.length} učenika...\n`);

  for (const student of allStudents) {
    // 6a) Poveži sve predmete
    await prisma.studentSubject.createMany({
      data: subjects.map((s) => ({
        studentId: student.id,
        subjectId: s.id,
      })),
    });

    // 6b) Dodaj domaće zadatke (3-5 random)
    const numHomework = 3 + Math.floor(Math.random() * 3);
    const selectedSubjects = subjects
      .sort(() => Math.random() - 0.5)
      .slice(0, numHomework);

    for (let i = 0; i < numHomework; i++) {
      const daysUntil = Math.floor(Math.random() * 5);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysUntil);

      await prisma.homework.create({
        data: {
          studentId: student.id,
          subjectId: selectedSubjects[i].id,
          title: `Zadatak ${i + 1} - ${selectedSubjects[i].name}`,
          description: `Uradi vežbe i pripremi se za kontrolni`,
          dueDate,
          priority: daysUntil === 0 ? "URGENT" : daysUntil === 1 ? "IMPORTANT" : "NORMAL",
          status: Math.random() > 0.7 ? "DONE" : Math.random() > 0.5 ? "IN_PROGRESS" : "ASSIGNED",
        },
      });
    }

    // 6c) Dodaj raspored (random 15-25 časova nedeljno)
    const daysOfWeek: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    const times = [
      { start: "08:00", end: "08:45" },
      { start: "08:50", end: "09:35" },
      { start: "09:55", end: "10:40" },
      { start: "10:45", end: "11:30" },
      { start: "11:35", end: "12:20" },
    ];

    let scheduleCount = 0;
    for (const day of daysOfWeek) {
      const numClasses = 3 + Math.floor(Math.random() * 3); // 3-5 časova dnevno
      for (let i = 0; i < numClasses && i < times.length; i++) {
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        await prisma.scheduleEntry.create({
          data: {
            studentId: student.id,
            subjectId: randomSubject.id,
            dayOfWeek: day,
            startTime: times[i].start,
            endTime: times[i].end,
            room: `Učionica ${Math.floor(Math.random() * 20) + 1}`,
          },
        });
        scheduleCount++;
      }
    }

    // 6d) Dodaj ocene (5-15 random)
    const numGrades = 5 + Math.floor(Math.random() * 11);
    for (let i = 0; i < numGrades; i++) {
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      const gradeDate = new Date();
      gradeDate.setDate(gradeDate.getDate() - Math.floor(Math.random() * 90));

      await prisma.grade.create({
        data: {
          studentId: student.id,
          subjectId: randomSubject.id,
          grade: String(2 + Math.floor(Math.random() * 4)), // 2-5
          category: ["Kontrolni", "Usmeno", "Domaći", "Pismeni"][Math.floor(Math.random() * 4)],
          description: `Ocena iz ${randomSubject.name}`,
          date: gradeDate,
          weight: 1,
        },
      });
    }

    console.log(
      `  ✅ ${student.name}: ${numHomework} domaćih, ${scheduleCount} časova, ${numGrades} ocena`,
    );
  }

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║                                                           ║");
  console.log("║         🎉 MASTER SEED ZAVRŠEN - SVE KREIRANO! 🎉        ║");
  console.log("║                                                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("📧 IMENOVANI DEMO NALOZI:");
  console.log("");
  NAMED_DEMO_ACCOUNTS.forEach((acc, i) => {
    console.log(`${i + 1}. ${acc.name}`);
    console.log(`   📧 ${acc.email} | 🔑 ${acc.password}`);
    console.log(`   🏫 ${acc.school} - ${acc.grade}/${acc.class}`);
    console.log("");
  });
  console.log("📧 GENERIČKI DEMO NALOZI:");
  console.log("   demo1@osnovci.rs ... demo15@osnovci.rs");
  console.log("   🔑 Lozinka: demo123");
  console.log("");
  console.log("📧 GLAVNI PAR:");
  console.log("   👨‍🎓 Učenik:  ucenik@demo.rs / demo123");
  console.log("   👨‍👩‍👧 Roditelj: roditelj@demo.rs / demo123");
  console.log("");
  console.log(`📊 UKUPNO: ${allStudents.length} učenika sa kompletnim podacima`);
  console.log(`   • ${subjects.length} predmeta`);
  console.log("   • Domaći zadaci za sve");
  console.log("   • Nedeljni raspored za sve");
  console.log("   • Ocene za sve");
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

