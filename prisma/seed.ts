// prisma/seed.ts
// Seed script za demo nalog (ispravljeno + prošireno)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STUDENT_NAMES = [
  "Marko Marković",
  "Ana Petrović",
  "Stefan Nikolić",
  "Jelena Jovanović",
  "Nikola Đorđević",
  "Milica Stanković",
  "Luka Pavlović",
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
  console.log("🌱 Započinjem seed...");

  // 1) Čišćenje (u transakciji)
  await prisma.$transaction([
    prisma.link.deleteMany({}),
    prisma.homework.deleteMany({}),
    prisma.scheduleEntry.deleteMany({}),
    prisma.studentSubject.deleteMany({}),
    prisma.subject.deleteMany({}),
    prisma.student.deleteMany({}),
    prisma.guardian.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);
  console.log("🗑️ Stari podaci obrisani");

  // 2) Hash lozinke
  const hashedPassword = await bcrypt.hash("demo123", 10);

  // 3) Kreiraj 20 demo učenika
  const students: Array<{
    id: string;
    email: string;
    student: { id: string; name: string } | null;
  }> = [];

  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `demo${i + 1}@osnovci.rs`,
        phone: `064${String(i + 1).padStart(7, "0")}`,
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: {
            name: STUDENT_NAMES[i],
            school: SCHOOLS[i % SCHOOLS.length],
            grade: (Math.floor(i / 4) % 8) + 1, // 1–8
            class: String.fromCharCode(65 + (i % 4)), // A–D
          },
        },
      },
      include: { student: true },
    });

    students.push({ id: user.id, email: user.email, student: user.student });
    console.log(`✅ Demo učenik ${i + 1}/20 kreiran: ${user.student?.name}`);
  }

  // 4) Kreiraj GLAVNI demo par: ucenik + roditelj + link
  const demoStudentUser = await prisma.user.create({
    data: {
      email: "ucenik@demo.rs",
      phone: "0640000000",
      password: hashedPassword,
      role: "STUDENT",
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

  const demoGuardianUser = await prisma.user.create({
    data: {
      email: "roditelj@demo.rs",
      phone: "0650000000",
      password: hashedPassword,
      role: "GUARDIAN",
      guardian: {
        create: {
          name: "Demo Roditelj",
        },
      },
    },
    include: { guardian: true },
  });

  if (!demoStudentUser.student?.id || !demoGuardianUser.guardian?.id) {
    throw new Error("Nisu pravilno kreirani demo student/roditelj zapisi.");
  }

  // Link parent ↔ student
  await prisma.link.create({
    data: {
      studentId: demoStudentUser.student.id,
      guardianId: demoGuardianUser.guardian.id,
      // relation: "PARENT", // ako imate enum/dodatno polje
    },
  });

  console.log("👨‍👧 Povezani demo roditelj i demo učenik");

  // 5) Predmeti (12)
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: "Matematika", color: "#3b82f6", icon: "📐" } }),
    prisma.subject.create({ data: { name: "Srpski jezik", color: "#ef4444", icon: "📖" } }),
    prisma.subject.create({ data: { name: "Engleski jezik", color: "#10b981", icon: "🇬🇧" } }),
    prisma.subject.create({ data: { name: "Fizika", color: "#6366f1", icon: "⚛️" } }),
    prisma.subject.create({ data: { name: "Hemija", color: "#ec4899", icon: "🧪" } }),
    prisma.subject.create({ data: { name: "Biologija", color: "#22c55e", icon: "🔬" } }),
    prisma.subject.create({ data: { name: "Istorija", color: "#8b5cf6", icon: "🏛️" } }),
    prisma.subject.create({ data: { name: "Geografija", color: "#06b6d4", icon: "🌍" } }),
    prisma.subject.create({ data: { name: "Fizičko vaspitanje", color: "#f59e0b", icon: "⚽" } }),
    prisma.subject.create({ data: { name: "Informatika", color: "#14b8a6", icon: "💻" } }),
    prisma.subject.create({ data: { name: "Muzičko vaspitanje", color: "#a855f7", icon: "🎵" } }),
    prisma.subject.create({ data: { name: "Likovno vaspitanje", color: "#f97316", icon: "🎨" } }),
  ]);
  console.log("✅ Svi predmeti kreirani (12)");

  // 6) Poveži SVE predmete sa GLAVNIM demo učenikom
  await prisma.studentSubject.createMany({
    data: subjects.map((s) => ({
      studentId: demoStudentUser.student!.id,
      subjectId: s.id,
    })),
  });
  console.log("✅ Svi predmeti povezani sa demo učenikom");

  // 7) Domaći zadaci (za demo učenika)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in3days = new Date(today);
  in3days.setDate(in3days.getDate() + 3);

  await prisma.homework.createMany({
    data: [
      {
        subjectId: subjects[0].id, // Matematika
        studentId: demoStudentUser.student!.id,
        title: "Zadaci sa strane 45",
        description: "Uradi zadatke 1-10 iz udžbenika",
        dueDate: tomorrow,
        priority: "NORMAL",
        status: "IN_PROGRESS",
      },
      {
        subjectId: subjects[1].id, // Srpski
        studentId: demoStudentUser.student!.id,
        title: "Sastav: Moj omiljeni pisac",
        description: "Napiši sastav od 200 reči o omiljenom piscu",
        dueDate: in3days,
        priority: "IMPORTANT",
        status: "ASSIGNED",
      },
      {
        subjectId: subjects[2].id, // Engleski
        studentId: demoStudentUser.student!.id,
        title: "Unit 3 - vežbe",
        description: "Vocabulary and grammar exercises",
        dueDate: today,
        priority: "URGENT",
        status: "IN_PROGRESS",
      },
      {
        subjectId: subjects[3].id, // Fizika
        studentId: demoStudentUser.student!.id,
        title: "Priprema za kontrolni",
        description: "Ponovi lekcije 5-8 o sili i kretanju",
        dueDate: tomorrow,
        priority: "URGENT",
        status: "ASSIGNED",
      },
      {
        subjectId: subjects[5].id, // Biologija
        studentId: demoStudentUser.student!.id,
        title: "Istraživački rad",
        description: "Napravi herbarium sa 5 različitih lišća",
        dueDate: in3days,
        priority: "NORMAL",
        status: "ASSIGNED",
      },
      {
        subjectId: subjects[6].id, // Istorija
        studentId: demoStudentUser.student!.id,
        title: "Čitanje o srednjem veku",
        description: "Pročitaj poglavlje 4 i odgovori na pitanja",
        dueDate: tomorrow,
        priority: "NORMAL",
        status: "DONE",
      },
    ],
  });
  console.log("✅ Domaći zadaci kreirani (6)");

  // 8) Kompletan nedeljni raspored za demo učenika (25 časova)
  await prisma.scheduleEntry.createMany({
    data: [
      // PONEDELJAK
      { studentId: demoStudentUser.student!.id, subjectId: subjects[0].id, dayOfWeek: "MONDAY",    startTime: "08:00", endTime: "08:45" }, // Matematika
      { studentId: demoStudentUser.student!.id, subjectId: subjects[1].id, dayOfWeek: "MONDAY",    startTime: "08:50", endTime: "09:35" }, // Srpski
      { studentId: demoStudentUser.student!.id, subjectId: subjects[2].id, dayOfWeek: "MONDAY",    startTime: "09:55", endTime: "10:40" }, // Engleski
      { studentId: demoStudentUser.student!.id, subjectId: subjects[8].id, dayOfWeek: "MONDAY",    startTime: "10:45", endTime: "11:30" }, // Fizičko
      { studentId: demoStudentUser.student!.id, subjectId: subjects[6].id, dayOfWeek: "MONDAY",    startTime: "11:35", endTime: "12:20" }, // Istorija

      // UTORAK
      { studentId: demoStudentUser.student!.id, subjectId: subjects[0].id, dayOfWeek: "TUESDAY",   startTime: "08:00", endTime: "08:45" }, // Matematika
      { studentId: demoStudentUser.student!.id, subjectId: subjects[3].id, dayOfWeek: "TUESDAY",   startTime: "08:50", endTime: "09:35" }, // Fizika
      { studentId: demoStudentUser.student!.id, subjectId: subjects[5].id, dayOfWeek: "TUESDAY",   startTime: "09:55", endTime: "10:40" }, // Biologija
      { studentId: demoStudentUser.student!.id, subjectId: subjects[7].id, dayOfWeek: "TUESDAY",   startTime: "10:45", endTime: "11:30" }, // Geografija
      { studentId: demoStudentUser.student!.id, subjectId: subjects[10].id, dayOfWeek: "TUESDAY",  startTime: "11:35", endTime: "12:20" }, // Muzičko

      // SREDA
      { studentId: demoStudentUser.student!.id, subjectId: subjects[1].id, dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "08:45" }, // Srpski
      { studentId: demoStudentUser.student!.id, subjectId: subjects[2].id, dayOfWeek: "WEDNESDAY", startTime: "08:50", endTime: "09:35" }, // Engleski
      { studentId: demoStudentUser.student!.id, subjectId: subjects[4].id, dayOfWeek: "WEDNESDAY", startTime: "09:55", endTime: "10:40" }, // Hemija
      { studentId: demoStudentUser.student!.id, subjectId: subjects[9].id, dayOfWeek: "WEDNESDAY", startTime: "10:45", endTime: "11:30" }, // Informatika
      { studentId: demoStudentUser.student!.id, subjectId: subjects[11].id, dayOfWeek: "WEDNESDAY",startTime: "11:35", endTime: "12:20" }, // Likovno

      // ČETVRTAK
      { studentId: demoStudentUser.student!.id, subjectId: subjects[0].id, dayOfWeek: "THURSDAY",  startTime: "08:00", endTime: "08:45" }, // Matematika
      { studentId: demoStudentUser.student!.id, subjectId: subjects[3].id, dayOfWeek: "THURSDAY",  startTime: "08:50", endTime: "09:35" }, // Fizika
      { studentId: demoStudentUser.student!.id, subjectId: subjects[6].id, dayOfWeek: "THURSDAY",  startTime: "09:55", endTime: "10:40" }, // Istorija
      { studentId: demoStudentUser.student!.id, subjectId: subjects[7].id, dayOfWeek: "THURSDAY",  startTime: "10:45", endTime: "11:30" }, // Geografija
      { studentId: demoStudentUser.student!.id, subjectId: subjects[8].id, dayOfWeek: "THURSDAY",  startTime: "11:35", endTime: "12:20" }, // Fizičko

      // PETAK
      { studentId: demoStudentUser.student!.id, subjectId: subjects[1].id, dayOfWeek: "FRIDAY",    startTime: "08:00", endTime: "08:45" }, // Srpski
      { studentId: demoStudentUser.student!.id, subjectId: subjects[2].id, dayOfWeek: "FRIDAY",    startTime: "08:50", endTime: "09:35" }, // Engleski
      { studentId: demoStudentUser.student!.id, subjectId: subjects[5].id, dayOfWeek: "FRIDAY",    startTime: "09:55", endTime: "10:40" }, // Biologija
      { studentId: demoStudentUser.student!.id, subjectId: subjects[4].id, dayOfWeek: "FRIDAY",    startTime: "10:45", endTime: "11:30" }, // Hemija
      { studentId: demoStudentUser.student!.id, subjectId: subjects[9].id, dayOfWeek: "FRIDAY",    startTime: "11:35", endTime: "12:20" }, // Informatika
    ],
  });
  console.log("✅ Kompletan nedeljni raspored kreiran (25 časova)");

  // 9) Izveštaj
  console.log("\n🎉 Seed završen!\n");
  console.log("📝 Glavni demo nalozi (povezani):");
  console.log("   • Učenik:  ucenik@demo.rs / demo123");
  console.log("   • Roditelj: roditelj@demo.rs / demo123");
  console.log("\n👨‍🎓 Dodatni demo učenici (20 naloga):");
  console.log("   • Emailovi: demo1@osnovci.rs  …  demo20@osnovci.rs");
  console.log("   • Lozinka:  demo123");
  console.log("\n📊 Podaci kreirani za GLAVNI demo nalog:");
  console.log("   • 12 predmeta");
  console.log("   • 6 domaćih zadataka");
  console.log("   • 25 časova nedeljnog rasporeda");
}

main()
  .catch((e) => {
    console.error("❌ Greška:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
