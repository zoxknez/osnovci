// Seed script za demo nalog
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

  // Prvo obriši sve postojeće podatke
  await prisma.link.deleteMany({});
  await prisma.homework.deleteMany({});
  await prisma.scheduleEntry.deleteMany({});
  await prisma.studentSubject.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("🗑️ Stari podaci obrisani");

  // Hashiraj lozinku
  const hashedPassword = await bcrypt.hash("demo123", 10);

  // Kreiraj 20 demo učenika
  const students = [];

  for (let i = 0; i < 20; i++) {
    const student = await prisma.user.create({
      data: {
        email: `demo${i + 1}@osnovci.rs`,
        phone: `064${String(i + 1).padStart(7, "0")}`,
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: {
            name: STUDENT_NAMES[i],
            school: SCHOOLS[i % SCHOOLS.length],
            grade: (Math.floor(i / 4) % 8) + 1, // Razredi 1-8
            class: String.fromCharCode(65 + (i % 4)), // Odeljenja A, B, C, D
          },
        },
      },
      include: {
        student: true,
      },
    });

    students.push(student);
    console.log(`✅ Demo učenik ${i + 1}/20 kreiran: ${student.student?.name}`);
  }

  // Uzmi prvog studenta za detaljne podatke
  const student = students[0];

  console.log("\n📊 Kreirano 20 demo naloga:");
  console.log("Email format: demo1@osnovci.rs - demo20@osnovci.rs");
  console.log("Lozinka: demo123\n");

  // Kreiraj sve predmete za osnovnu školu (5. razred)
  const subjects = await Promise.all([
    // Osnovni predmeti
    prisma.subject.create({
      data: { name: "Matematika", color: "#3b82f6", icon: "📐" },
    }),
    prisma.subject.create({
      data: { name: "Srpski jezik", color: "#ef4444", icon: "📖" },
    }),
    prisma.subject.create({
      data: { name: "Engleski jezik", color: "#10b981", icon: "🇬🇧" },
    }),

    // Prirodne nauke
    prisma.subject.create({
      data: { name: "Fizika", color: "#6366f1", icon: "⚛️" },
    }),
    prisma.subject.create({
      data: { name: "Hemija", color: "#ec4899", icon: "🧪" },
    }),
    prisma.subject.create({
      data: { name: "Biologija", color: "#22c55e", icon: "🔬" },
    }),

    // Društvene nauke
    prisma.subject.create({
      data: { name: "Istorija", color: "#8b5cf6", icon: "🏛️" },
    }),
    prisma.subject.create({
      data: { name: "Geografija", color: "#06b6d4", icon: "🌍" },
    }),

    // Ostali predmeti
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

  console.log("✅ Svi predmeti kreirani (12 predmeta)");

  // Poveži sve predmete sa učenikom
  if (student.student?.id) {
    await prisma.studentSubject.createMany({
      data: subjects.map((subject) => ({
        studentId: student.student!.id,
        subjectId: subject.id,
      })),
    });
  }

  console.log("✅ Svi predmeti povezani sa učenikom");

  // Danas
  const today = new Date();
  // Sutra
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Za 3 dana
  const in3days = new Date(today);
  in3days.setDate(in3days.getDate() + 3);

  // Kreiraj domaće zadatke za različite predmete
  await prisma.homework.createMany({
    data: [
      // Matematika
      {
        subjectId: subjects[0].id,
        studentId: student.student!.id,
        title: "Zadaci sa strane 45",
        description: "Uradi zadatke 1-10 iz udžbenika",
        dueDate: tomorrow,
        priority: "NORMAL",
        status: "IN_PROGRESS",
      },
      // Srpski
      {
        subjectId: subjects[1].id,
        studentId: student.student!.id,
        title: "Sastav: Moj omiljeni pisac",
        description: "Napiši sastav od 200 reči o omiljenom piscu",
        dueDate: in3days,
        priority: "IMPORTANT",
        status: "ASSIGNED",
      },
      // Engleski
      {
        subjectId: subjects[2].id,
        studentId: student.student!.id,
        title: "Unit 3 - vežbe",
        description: "Vocabulary and grammar exercises",
        dueDate: today,
        priority: "URGENT",
        status: "IN_PROGRESS",
      },
      // Fizika
      {
        subjectId: subjects[3].id,
        studentId: student.student!.id,
        title: "Priprema za kontrolni",
        description: "Ponovi lekcije 5-8 o sili i kretanju",
        dueDate: tomorrow,
        priority: "URGENT",
        status: "ASSIGNED",
      },
      // Biologija
      {
        subjectId: subjects[5].id,
        studentId: student.student!.id,
        title: "Istraživački rad",
        description: "Napravi herbarium sa 5 različitih lišća",
        dueDate: in3days,
        priority: "NORMAL",
        status: "ASSIGNED",
      },
      // Istorija
      {
        subjectId: subjects[6].id,
        studentId: student.student!.id,
        title: "Čitanje o srednjem veku",
        description: "Pročitaj poglavlje 4 i odgovori na pitanja",
        dueDate: tomorrow,
        priority: "NORMAL",
        status: "DONE",
      },
    ],
  });

  console.log("✅ Domaći zadaci kreirani");

  // Kreiraj kompletan nedeljni raspored časova
  await prisma.scheduleEntry.createMany({
    data: [
      // PONEDELJAK
      {
        studentId: student.student!.id,
        subjectId: subjects[0].id,
        dayOfWeek: "MONDAY",
        startTime: "08:00",
        endTime: "08:45",
      }, // Matematika
      {
        studentId: student.student!.id,
        subjectId: subjects[1].id,
        dayOfWeek: "MONDAY",
        startTime: "08:50",
        endTime: "09:35",
      }, // Srpski
      {
        studentId: student.student!.id,
        subjectId: subjects[2].id,
        dayOfWeek: "MONDAY",
        startTime: "09:55",
        endTime: "10:40",
      }, // Engleski
      {
        studentId: student.student!.id,
        subjectId: subjects[8].id,
        dayOfWeek: "MONDAY",
        startTime: "10:45",
        endTime: "11:30",
      }, // Fizičko
      {
        studentId: student.student!.id,
        subjectId: subjects[6].id,
        dayOfWeek: "MONDAY",
        startTime: "11:35",
        endTime: "12:20",
      }, // Istorija

      // UTORAK
      {
        studentId: student.student!.id,
        subjectId: subjects[0].id,
        dayOfWeek: "TUESDAY",
        startTime: "08:00",
        endTime: "08:45",
      }, // Matematika
      {
        studentId: student.student!.id,
        subjectId: subjects[3].id,
        dayOfWeek: "TUESDAY",
        startTime: "08:50",
        endTime: "09:35",
      }, // Fizika
      {
        studentId: student.student!.id,
        subjectId: subjects[5].id,
        dayOfWeek: "TUESDAY",
        startTime: "09:55",
        endTime: "10:40",
      }, // Biologija
      {
        studentId: student.student!.id,
        subjectId: subjects[7].id,
        dayOfWeek: "TUESDAY",
        startTime: "10:45",
        endTime: "11:30",
      }, // Geografija
      {
        studentId: student.student!.id,
        subjectId: subjects[10].id,
        dayOfWeek: "TUESDAY",
        startTime: "11:35",
        endTime: "12:20",
      }, // Muzičko

      // SREDA
      {
        studentId: student.student!.id,
        subjectId: subjects[1].id,
        dayOfWeek: "WEDNESDAY",
        startTime: "08:00",
        endTime: "08:45",
      }, // Srpski
      {
        studentId: student.student!.id,
        subjectId: subjects[2].id,
        dayOfWeek: "WEDNESDAY",
        startTime: "08:50",
        endTime: "09:35",
      }, // Engleski
      {
        studentId: student.student!.id,
        subjectId: subjects[4].id,
        dayOfWeek: "WEDNESDAY",
        startTime: "09:55",
        endTime: "10:40",
      }, // Hemija
      {
        studentId: student.student!.id,
        subjectId: subjects[9].id,
        dayOfWeek: "WEDNESDAY",
        startTime: "10:45",
        endTime: "11:30",
      }, // Informatika
      {
        studentId: student.student!.id,
        subjectId: subjects[11].id,
        dayOfWeek: "WEDNESDAY",
        startTime: "11:35",
        endTime: "12:20",
      }, // Likovno

      // ČETVRTAK
      {
        studentId: student.student!.id,
        subjectId: subjects[0].id,
        dayOfWeek: "THURSDAY",
        startTime: "08:00",
        endTime: "08:45",
      }, // Matematika
      {
        studentId: student.student!.id,
        subjectId: subjects[3].id,
        dayOfWeek: "THURSDAY",
        startTime: "08:50",
        endTime: "09:35",
      }, // Fizika
      {
        studentId: student.student!.id,
        subjectId: subjects[6].id,
        dayOfWeek: "THURSDAY",
        startTime: "09:55",
        endTime: "10:40",
      }, // Istorija
      {
        studentId: student.student!.id,
        subjectId: subjects[7].id,
        dayOfWeek: "THURSDAY",
        startTime: "10:45",
        endTime: "11:30",
      }, // Geografija
      {
        studentId: student.student!.id,
        subjectId: subjects[8].id,
        dayOfWeek: "THURSDAY",
        startTime: "11:35",
        endTime: "12:20",
      }, // Fizičko

      // PETAK
      {
        studentId: student.student!.id,
        subjectId: subjects[1].id,
        dayOfWeek: "FRIDAY",
        startTime: "08:00",
        endTime: "08:45",
      }, // Srpski
      {
        studentId: student.student!.id,
        subjectId: subjects[2].id,
        dayOfWeek: "FRIDAY",
        startTime: "08:50",
        endTime: "09:35",
      }, // Engleski
      {
        studentId: student.student!.id,
        subjectId: subjects[5].id,
        dayOfWeek: "FRIDAY",
        startTime: "09:55",
        endTime: "10:40",
      }, // Biologija
      {
        studentId: student.student!.id,
        subjectId: subjects[4].id,
        dayOfWeek: "FRIDAY",
        startTime: "10:45",
        endTime: "11:30",
      }, // Hemija
      {
        studentId: student.student!.id,
        subjectId: subjects[9].id,
        dayOfWeek: "FRIDAY",
        startTime: "11:35",
        endTime: "12:20",
      }, // Informatika
    ],
  });

  console.log("✅ Kompletan nedeljni raspored kreiran (25 časova)");

  console.log("\n🎉 Seed završen!\n");
  console.log("📝 Demo nalozi:");
  console.log("   Učenik: ucenik@demo.rs / demo123");
  console.log("   Roditelj: roditelj@demo.rs / demo123");
  console.log("\n📊 Podaci kreirani:");
  console.log("   • 12 predmeta (svi za osnovnu školu)");
  console.log("   • 6 domaćih zadataka");
  console.log("   • 25 časova nedeljnog rasporeda");
  console.log("   • 2 naloga (učenik + roditelj povezani)");
}

main()
  .catch((e) => {
    console.error("❌ Greška:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
