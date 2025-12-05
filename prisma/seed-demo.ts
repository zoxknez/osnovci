// Seed script za demo naloge - KOMPLETNI podaci za sve modele
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================
// DEMO ACCOUNTS DATA
// ============================================

const DEMO_STUDENTS = [
  {
    name: "Marko Marković",
    email: "marko@demo.rs",
    password: "marko123",
    phone: "0641234567",
    school: 'OŠ "Vuk Karadžić"',
    grade: 5,
    class: "A",
    birthDate: new Date("2013-03-15"),
    gender: "MALE" as const,
    bio: "Volim matematiku i fudbal! ⚽📐",
    height: 145,
    weight: 38,
    bloodType: "A_POSITIVE" as const,
    allergies: "Polen, kikiriki",
    hasGlasses: false,
    hobbies: "Fudbal, video igrice, čitanje stripova",
    sports: "Fudbal (FK Partizan - pioniri)",
    emergencyContact1: "Jelena Marković (mama)",
    emergencyContact1Phone: "0621234567",
    emergencyContact2: "Dragan Marković (tata)",
    emergencyContact2Phone: "0631234567",
  },
  {
    name: "Ana Petrović",
    email: "ana@demo.rs",
    password: "ana123",
    phone: "0642345678",
    school: 'OŠ "Dositej Obradović"',
    grade: 6,
    class: "B",
    birthDate: new Date("2012-07-22"),
    gender: "FEMALE" as const,
    bio: "Ljubitelj knjiga i umetnosti 📚🎨",
    height: 152,
    weight: 42,
    bloodType: "B_NEGATIVE" as const,
    allergies: null,
    hasGlasses: true,
    hobbies: "Crtanje, čitanje, klavir",
    sports: "Plivanje",
    emergencyContact1: "Milica Petrović (mama)",
    emergencyContact1Phone: "0622345678",
    emergencyContact2: "Petar Petrović (tata)",
    emergencyContact2Phone: "0632345678",
  },
  {
    name: "Stefan Nikolić",
    email: "stefan@demo.rs",
    password: "stefan123",
    phone: "0643456789",
    school: 'OŠ "Jovan Jovanović Zmaj"',
    grade: 7,
    class: "C",
    birthDate: new Date("2011-11-08"),
    gender: "MALE" as const,
    bio: "Sportista i lider u odeljenju 🏀💪",
    height: 165,
    weight: 55,
    bloodType: "O_POSITIVE" as const,
    allergies: "Penicilin",
    hasGlasses: false,
    hobbies: "Košarka, trčanje, planinarenje",
    sports: "Košarka (KK Crvena Zvezda - kadeti)",
    emergencyContact1: "Ivana Nikolić (mama)",
    emergencyContact1Phone: "0623456789",
    emergencyContact2: "Nikola Nikolić (tata)",
    emergencyContact2Phone: "0633456789",
  },
  {
    name: "Milica Stanković",
    email: "milica@demo.rs",
    password: "milica123",
    phone: "0644567890",
    school: 'OŠ "Petar Petrović Njegoš"',
    grade: 4,
    class: "A",
    birthDate: new Date("2014-05-30"),
    gender: "FEMALE" as const,
    bio: "Kreativna duša, volim da pišem priče ✨📝",
    height: 138,
    weight: 32,
    bloodType: "AB_POSITIVE" as const,
    allergies: "Gluten (celijakija)",
    hasGlasses: false,
    hobbies: "Pisanje priča, gluma, ples",
    sports: "Balet",
    emergencyContact1: "Jovana Stanković (mama)",
    emergencyContact1Phone: "0624567890",
    emergencyContact2: "Milan Stanković (tata)",
    emergencyContact2Phone: "0634567890",
  },
  {
    name: "Luka Pavlović",
    email: "luka@demo.rs",
    password: "luka123",
    phone: "0645678901",
    school: 'OŠ "Branko Radičević"',
    grade: 8,
    class: "D",
    birthDate: new Date("2010-09-12"),
    gender: "MALE" as const,
    bio: "Budući programer! 💻🚀 Volim tehnologiju",
    height: 172,
    weight: 62,
    bloodType: "A_NEGATIVE" as const,
    allergies: null,
    hasGlasses: true,
    hobbies: "Programiranje, robotika, video igrice",
    sports: "Stoni tenis",
    emergencyContact1: "Marija Pavlović (mama)",
    emergencyContact1Phone: "0625678901",
    emergencyContact2: "Vladimir Pavlović (tata)",
    emergencyContact2Phone: "0635678901",
  },
];

const DEMO_GUARDIANS = [
  {
    name: "Jelena Marković",
    email: "jelena.roditelj@demo.rs",
    password: "jelena123",
    phone: "0651234567",
    childEmail: "marko@demo.rs",
  },
  {
    name: "Petar Petrović",
    email: "petar.roditelj@demo.rs",
    password: "petar123",
    phone: "0652345678",
    childEmail: "ana@demo.rs",
  },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log("🌱 Započinjem KOMPLETAN seed za demo naloge...\n");

  // ==========================================
  // CLEAN ALL DATA
  // ==========================================
  console.log("🗑️ Brišem sve postojeće podatke...");
  
  await prisma.stickerLog.deleteMany({});
  await prisma.sticker.deleteMany({});
  await prisma.flashcard.deleteMany({});
  await prisma.flashcardDeck.deleteMany({});
  await prisma.userInventory.deleteMany({});
  await prisma.shopItem.deleteMany({});
  await prisma.knowledgeResource.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.gamification.deleteMany({});
  await prisma.focusSession.deleteMany({});
  await prisma.aiTutorSession.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.homework.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.scheduleEntry.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.weeklyReport.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.link.deleteMany({});
  await prisma.studentSubject.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log("✅ Stari podaci obrisani\n");

  // ==========================================
  // CREATE SUBJECTS
  // ==========================================
  console.log("📚 Kreiram predmete...");
  
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: "Matematika", color: "#3b82f6", icon: "📐" } }),
    prisma.subject.create({ data: { name: "Srpski jezik", color: "#ef4444", icon: "📖" } }),
    prisma.subject.create({ data: { name: "Engleski jezik", color: "#10b981", icon: "🇬🇧" } }),
    prisma.subject.create({ data: { name: "Istorija", color: "#f59e0b", icon: "🏛️" } }),
    prisma.subject.create({ data: { name: "Geografija", color: "#14b8a6", icon: "🌍" } }),
    prisma.subject.create({ data: { name: "Biologija", color: "#22c55e", icon: "🧬" } }),
    prisma.subject.create({ data: { name: "Hemija", color: "#8b5cf6", icon: "⚗️" } }),
    prisma.subject.create({ data: { name: "Fizika", color: "#6366f1", icon: "⚛️" } }),
    prisma.subject.create({ data: { name: "Likovno", color: "#ec4899", icon: "🎨" } }),
    prisma.subject.create({ data: { name: "Muzičko", color: "#f97316", icon: "🎵" } }),
    prisma.subject.create({ data: { name: "Fizičko", color: "#06b6d4", icon: "⚽" } }),
    prisma.subject.create({ data: { name: "Informatika", color: "#0ea5e9", icon: "💻" } }),
    prisma.subject.create({ data: { name: "Tehničko", color: "#78716c", icon: "🔧" } }),
    prisma.subject.create({ data: { name: "Građansko vaspitanje", color: "#a855f7", icon: "🤝" } }),
  ]);
  
  const getSubject = (name: string) => subjects.find(s => s.name === name)!;
  console.log(`✅ Kreirano ${subjects.length} predmeta\n`);

  // ==========================================
  // CREATE STICKERS
  // ==========================================
  console.log("🎨 Kreiram stikere...");
  
  const stickers = await Promise.all([
    prisma.sticker.create({ data: { code: "THUMBS_UP", name: "Bravo!", icon: "👍", cost: 10, minLevel: 1 } }),
    prisma.sticker.create({ data: { code: "STAR", name: "Zvezda", icon: "⭐", cost: 20, minLevel: 2 } }),
    prisma.sticker.create({ data: { code: "ROCKET", name: "Raketa", icon: "🚀", cost: 50, minLevel: 5 } }),
    prisma.sticker.create({ data: { code: "TROPHY", name: "Pehar", icon: "🏆", cost: 100, minLevel: 10 } }),
    prisma.sticker.create({ data: { code: "HEART", name: "Srce", icon: "❤️", cost: 15, minLevel: 1 } }),
    prisma.sticker.create({ data: { code: "FIRE", name: "Vatra", icon: "🔥", cost: 30, minLevel: 3 } }),
    prisma.sticker.create({ data: { code: "CLAP", name: "Aplauz", icon: "👏", cost: 25, minLevel: 2 } }),
    prisma.sticker.create({ data: { code: "MUSCLE", name: "Snaga", icon: "💪", cost: 35, minLevel: 4 } }),
    prisma.sticker.create({ data: { code: "BRAIN", name: "Pametnica", icon: "🧠", cost: 45, minLevel: 6 } }),
    prisma.sticker.create({ data: { code: "CROWN", name: "Kruna", icon: "👑", cost: 150, minLevel: 15 } }),
    prisma.sticker.create({ data: { code: "DIAMOND", name: "Dijamant", icon: "💎", cost: 200, minLevel: 20 } }),
    prisma.sticker.create({ data: { code: "RAINBOW", name: "Duga", icon: "🌈", cost: 40, minLevel: 5 } }),
  ]);
  console.log(`✅ Kreirano ${stickers.length} stikera\n`);

  // ==========================================
  // CREATE SHOP ITEMS
  // ==========================================
  console.log("🛒 Kreiram shop artikle...");
  
  const shopItems = await Promise.all([
    // Avatar accessories
    prisma.shopItem.create({ data: { name: "Piratska kapa", description: "Arr! 🏴‍☠️", cost: 100, type: "AVATAR_ACCESSORY", assetUrl: "/avatars/pirate-hat.png", minLevel: 5 } }),
    prisma.shopItem.create({ data: { name: "Naočare za sunce", description: "Cool 😎", cost: 50, type: "AVATAR_ACCESSORY", assetUrl: "/avatars/sunglasses.png", minLevel: 2 } }),
    prisma.shopItem.create({ data: { name: "Kruna", description: "Za pravog šampiona", cost: 200, type: "AVATAR_ACCESSORY", assetUrl: "/avatars/crown.png", minLevel: 10 } }),
    prisma.shopItem.create({ data: { name: "Maska superheroja", description: "Spasi svet! 🦸", cost: 150, type: "AVATAR_ACCESSORY", assetUrl: "/avatars/hero-mask.png", minLevel: 8 } }),
    // Themes
    prisma.shopItem.create({ data: { name: "Noćna tema", description: "Tamna strana 🌙", cost: 75, type: "THEME", assetUrl: "/themes/dark.json", minLevel: 3 } }),
    prisma.shopItem.create({ data: { name: "Šarena tema", description: "Svi boje sveta! 🌈", cost: 100, type: "THEME", assetUrl: "/themes/rainbow.json", minLevel: 5 } }),
    prisma.shopItem.create({ data: { name: "Kosmička tema", description: "Putovanje kroz svemir 🚀", cost: 150, type: "THEME", assetUrl: "/themes/space.json", minLevel: 10 } }),
    // Badges
    prisma.shopItem.create({ data: { name: "Matematičar", description: "Za ljubitelje brojeva", cost: 50, type: "BADGE", assetUrl: "/badges/math.png", minLevel: 1 } }),
    prisma.shopItem.create({ data: { name: "Čitalac", description: "Knjigoljubac", cost: 50, type: "BADGE", assetUrl: "/badges/reader.png", minLevel: 1 } }),
    prisma.shopItem.create({ data: { name: "Sportista", description: "Brži, viši, jači!", cost: 50, type: "BADGE", assetUrl: "/badges/sports.png", minLevel: 1 } }),
    // Frames
    prisma.shopItem.create({ data: { name: "Zlatni okvir", description: "Premium look ✨", cost: 300, type: "FRAME", assetUrl: "/frames/gold.png", minLevel: 15, isPremium: true } }),
    prisma.shopItem.create({ data: { name: "Drveni okvir", description: "Klasika", cost: 80, type: "FRAME", assetUrl: "/frames/wood.png", minLevel: 4 } }),
  ]);
  console.log(`✅ Kreirano ${shopItems.length} shop artikala\n`);

  // ==========================================
  // CREATE STUDENTS
  // ==========================================
  console.log("👨‍🎓 Kreiram demo učenike...\n");

  const createdStudents: { id: string; name: string; odeljenje: string; userId: string }[] = [];

  for (const student of DEMO_STUDENTS) {
    const hashedPassword = await bcrypt.hash(student.password, 10);
    const userId = student.email === "marko@demo.rs" ? "demo-student-id" : undefined;

    const user = await prisma.user.create({
      data: {
        ...(userId && { id: userId }),
        email: student.email,
        phone: student.phone,
        password: hashedPassword,
        role: "STUDENT",
        emailVerified: new Date(),
        dateOfBirth: student.birthDate,
        student: {
          create: {
            name: student.name,
            school: student.school,
            grade: student.grade,
            class: student.class,
            birthDate: student.birthDate,
            gender: student.gender,
            bio: student.bio,
            height: student.height,
            weight: student.weight,
            bloodType: student.bloodType,
            allergies: student.allergies,
            hasGlasses: student.hasGlasses,
            hobbies: student.hobbies,
            sports: student.sports,
            emergencyContact1: student.emergencyContact1,
            emergencyContact1Phone: student.emergencyContact1Phone,
            emergencyContact2: student.emergencyContact2,
            emergencyContact2Phone: student.emergencyContact2Phone,
            parentalConsentGiven: true,
            parentalConsentDate: new Date(),
            accountActive: true,
          },
        },
      },
      include: { student: true },
    });

    createdStudents.push({
      id: user.student!.id,
      name: student.name,
      odeljenje: `${student.grade}/${student.class}`,
      userId: user.id,
    });

    console.log(`✅ ${student.name} (${student.email})`);
  }
  console.log("");

  // ==========================================
  // CREATE GUARDIANS
  // ==========================================
  console.log("👨‍👩‍👧 Kreiram demo roditelje...\n");

  for (const guardian of DEMO_GUARDIANS) {
    const hashedPassword = await bcrypt.hash(guardian.password, 10);
    const childStudent = createdStudents.find(s => 
      DEMO_STUDENTS.find(ds => ds.email === guardian.childEmail)?.name === s.name
    );

    const user = await prisma.user.create({
      data: {
        email: guardian.email,
        phone: guardian.phone,
        password: hashedPassword,
        role: "GUARDIAN",
        emailVerified: new Date(),
        guardian: {
          create: {
            name: guardian.name,
          },
        },
      },
      include: { guardian: true },
    });

    // Create link to child
    if (childStudent && user.guardian) {
      await prisma.link.create({
        data: {
          guardianId: user.guardian.id,
          studentId: childStudent.id,
          linkCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          isActive: true,
        },
      });
    }

    console.log(`✅ ${guardian.name} (${guardian.email}) → povezan sa detetom`);
  }
  console.log("");

  // ==========================================
  // CREATE GAMIFICATION & ACHIEVEMENTS FOR EACH STUDENT
  // ==========================================
  console.log("🎮 Kreiram gamification podatke...");

  const gamificationData = [
    { level: 12, xp: 2450, streak: 15, longestStreak: 21, totalHomeworkDone: 87, weeklyXP: 320, monthlyXP: 1200 },
    { level: 8, xp: 1680, streak: 7, longestStreak: 14, totalHomeworkDone: 52, weeklyXP: 180, monthlyXP: 720 },
    { level: 15, xp: 3200, streak: 28, longestStreak: 28, totalHomeworkDone: 124, weeklyXP: 450, monthlyXP: 1800 },
    { level: 5, xp: 890, streak: 3, longestStreak: 8, totalHomeworkDone: 31, weeklyXP: 95, monthlyXP: 380 },
    { level: 18, xp: 4100, streak: 45, longestStreak: 52, totalHomeworkDone: 178, weeklyXP: 520, monthlyXP: 2100 },
  ];

  const achievementTypes = [
    { type: "FIRST_HOMEWORK", title: "Prvi korak", description: "Završio prvi domaći zadatak!", icon: "🎯", xpReward: 50, rarity: "COMMON" as const },
    { type: "HOMEWORK_10", title: "Marljivi đak", description: "10 završenih domaćih!", icon: "📚", xpReward: 100, rarity: "COMMON" as const },
    { type: "STREAK_7", title: "Nedelja discipline", description: "7 dana zaredom aktivnosti!", icon: "🔥", xpReward: 150, rarity: "RARE" as const },
    { type: "STREAK_14", title: "Dvonedeljna pobeda", description: "14 dana streak!", icon: "⚡", xpReward: 250, rarity: "RARE" as const },
    { type: "LEVEL_5", title: "Napredni učenik", description: "Dostigao nivo 5!", icon: "⭐", xpReward: 200, rarity: "COMMON" as const },
    { type: "LEVEL_10", title: "Znalac", description: "Dostigao nivo 10!", icon: "🌟", xpReward: 400, rarity: "RARE" as const },
    { type: "EARLY_BIRD", title: "Rana ptica", description: "Učenje pre 7 ujutru!", icon: "🌅", xpReward: 75, rarity: "COMMON" as const },
    { type: "FIRST_GRADE_5", title: "Prva petica", description: "Dobio prvu peticu!", icon: "🏆", xpReward: 100, rarity: "COMMON" as const },
  ];

  for (let i = 0; i < createdStudents.length; i++) {
    const student = createdStudents[i];
    const gData = gamificationData[i];

    if (!student || !gData) continue;

    const gamification = await prisma.gamification.create({
      data: {
        studentId: student.id,
        level: gData.level,
        xp: gData.xp,
        totalXPEarned: gData.xp + 500,
        streak: gData.streak,
        longestStreak: gData.longestStreak,
        totalHomeworkDone: gData.totalHomeworkDone,
        weeklyXP: gData.weeklyXP,
        monthlyXP: gData.monthlyXP,
        lastActivityDate: new Date(),
        showOnLeaderboard: true,
      },
    });

    // Add achievements based on level/progress
    const numAchievements = Math.min(gData.level, achievementTypes.length);
    for (let j = 0; j < numAchievements; j++) {
      const ach = achievementTypes[j];
      if (!ach) continue;
      
      await prisma.achievement.create({
        data: {
          gamificationId: gamification.id,
          type: ach.type as any,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          xpReward: ach.xpReward,
          rarity: ach.rarity,
          unlockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log("✅ Gamification i achievements kreirani\n");

  // ==========================================
  // CREATE GRADES FOR EACH STUDENT
  // ==========================================
  console.log("📝 Kreiram ocene...");

  const gradeCategories = ["Kontrolni", "Usmeno", "Domaći", "Pismeni", "Aktivnost"];
  
  for (const student of createdStudents) {
    const studentSubjects = subjects.slice(0, 8 + Math.floor(Math.random() * 4));
    
    for (const subject of studentSubjects) {
      // Add student-subject relation
      await prisma.studentSubject.create({
        data: {
          studentId: student.id,
          subjectId: subject.id,
        },
      });

      // Create 3-8 grades per subject
      const numGrades = 3 + Math.floor(Math.random() * 6);
      for (let i = 0; i < numGrades; i++) {
        const grade = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5 mostly
        const categoryIdx = Math.floor(Math.random() * gradeCategories.length);
        const category = gradeCategories[categoryIdx] ?? "Kontrolni";
        
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: subject.id,
            grade: grade.toString(),
            category,
            description: grade === 5 ? "Odličan rad!" : grade === 4 ? "Vrlo dobar rad" : "Solidan rad",
            date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            weight: Math.floor(Math.random() * 2) + 1,
          },
        });
      }
    }
  }
  console.log("✅ Ocene kreirane\n");

  // ==========================================
  // CREATE HOMEWORK FOR MARKO (main demo account)
  // ==========================================
  console.log("📚 Kreiram domaće zadatke za Marka...");

  const marko = createdStudents[0];
  if (!marko) {
    throw new Error("Marko (prvi student) nije kreiran!");
  }
  
  const matematika = getSubject("Matematika");
  const srpski = getSubject("Srpski jezik");
  const engleski = getSubject("Engleski jezik");
  const fizika = getSubject("Fizika");
  const istorija = getSubject("Istorija");
  const geografija = getSubject("Geografija");
  const biologija = getSubject("Biologija");
  const informatika = getSubject("Informatika");

  const homeworkItems = [
    {
      title: "Kvadratne jednačine - vežbe",
      description: "Rešiti zadatke 1-10 iz udžbenika strana 45. Posebno obratiti pažnju na diskriminantu!",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: "IMPORTANT" as const,
      status: "ASSIGNED" as const,
      subjectId: matematika.id,
      estimatedMinutes: 45,
      tags: JSON.stringify(["algebra", "jednačine"]),
    },
    {
      title: "Esej o proleću",
      description: "Napisati esej od 200-300 reči o proleću i buđenju prirode. Koristiti bar 5 epiteta i 3 poređenja.",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: "NORMAL" as const,
      status: "IN_PROGRESS" as const,
      subjectId: srpski.id,
      estimatedMinutes: 60,
      tags: JSON.stringify(["pisanje", "esej"]),
    },
    {
      title: "Past Simple Tense - vežbe",
      description: "Workbook stranice 23-25. Svi zadaci! Naučiti nepravilne glagole sa strane 26.",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      priority: "URGENT" as const,
      status: "ASSIGNED" as const,
      subjectId: engleski.id,
      estimatedMinutes: 40,
      tags: JSON.stringify(["gramatika", "glagoli"]),
    },
    {
      title: "Njutnovi zakoni - pitanja",
      description: "Odgovoriti na pitanja 1-8 na kraju poglavlja. Objasniti prvi i drugi Njutnov zakon.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: "IMPORTANT" as const,
      status: "ASSIGNED" as const,
      subjectId: fizika.id,
      estimatedMinutes: 35,
      tags: JSON.stringify(["mehanika", "zakoni"]),
    },
    {
      title: "Srednji vek - vremenska linija",
      description: "Nacrtati vremensku liniju od 500. do 1500. godine sa najvažnijim događajima.",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      priority: "NORMAL" as const,
      status: "DONE" as const,
      subjectId: istorija.id,
      estimatedMinutes: 50,
      tags: JSON.stringify(["srednji vek", "linija"]),
    },
    {
      title: "Reke Srbije - mapa",
      description: "Na slepoj mapi Srbije označiti sve glavne reke i njihove pritoke.",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      priority: "NORMAL" as const,
      status: "SUBMITTED" as const,
      subjectId: geografija.id,
      estimatedMinutes: 30,
      tags: JSON.stringify(["mapa", "reke", "srbija"]),
    },
    {
      title: "Ćelija - crteži i oznake",
      description: "Nacrtati biljnu i životinjsku ćeliju. Označiti sve organele sa imenima.",
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      priority: "NORMAL" as const,
      status: "ASSIGNED" as const,
      subjectId: biologija.id,
      estimatedMinutes: 45,
      tags: JSON.stringify(["ćelija", "crtež"]),
    },
    {
      title: "HTML stranica - portfolio",
      description: "Napraviti jednostavnu HTML stranicu sa tvojim podacima, slikama i linkovima.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: "IMPORTANT" as const,
      status: "IN_PROGRESS" as const,
      subjectId: informatika.id,
      estimatedMinutes: 90,
      tags: JSON.stringify(["html", "web", "projekat"]),
    },
    {
      title: "Razlomci - sabiranje i oduzimanje",
      description: "Vežbanka strana 12, zadaci 1-15. Proširiti na zajednički imenilac!",
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      priority: "NORMAL" as const,
      status: "REVIEWED" as const,
      subjectId: matematika.id,
      estimatedMinutes: 40,
      reviewNote: "Odličan rad! Samo pazi na znakove kod oduzimanja. ⭐",
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tags: JSON.stringify(["razlomci", "računanje"]),
    },
    {
      title: "Lektira - Hajduci",
      description: "Pročitati prvih 5 poglavlja i napisati kratak rezime svakog.",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: "NORMAL" as const,
      status: "ASSIGNED" as const,
      subjectId: srpski.id,
      estimatedMinutes: 120,
      tags: JSON.stringify(["lektira", "čitanje"]),
    },
  ];

  for (const hw of homeworkItems) {
    await prisma.homework.create({
      data: {
        ...hw,
        studentId: marko.id,
      },
    });
  }
  console.log(`✅ Kreirano ${homeworkItems.length} domaćih zadataka\n`);

  // ==========================================
  // CREATE SCHEDULE FOR MARKO
  // ==========================================
  console.log("📅 Kreiram raspored za Marka...");

  const scheduleItems = [
    // Ponedeljak
    { day: "MONDAY", start: "08:00", end: "08:45", subject: "Matematika", room: "101" },
    { day: "MONDAY", start: "08:50", end: "09:35", subject: "Srpski jezik", room: "205" },
    { day: "MONDAY", start: "09:50", end: "10:35", subject: "Engleski jezik", room: "302" },
    { day: "MONDAY", start: "10:40", end: "11:25", subject: "Istorija", room: "203" },
    { day: "MONDAY", start: "11:35", end: "12:20", subject: "Fizičko", room: "Sala" },
    // Utorak
    { day: "TUESDAY", start: "08:00", end: "08:45", subject: "Fizika", room: "Lab 1" },
    { day: "TUESDAY", start: "08:50", end: "09:35", subject: "Matematika", room: "101" },
    { day: "TUESDAY", start: "09:50", end: "10:35", subject: "Biologija", room: "Lab 2" },
    { day: "TUESDAY", start: "10:40", end: "11:25", subject: "Srpski jezik", room: "205" },
    { day: "TUESDAY", start: "11:35", end: "12:20", subject: "Likovno", room: "Atelje" },
    // Sreda
    { day: "WEDNESDAY", start: "08:00", end: "08:45", subject: "Geografija", room: "204" },
    { day: "WEDNESDAY", start: "08:50", end: "09:35", subject: "Engleski jezik", room: "302" },
    { day: "WEDNESDAY", start: "09:50", end: "10:35", subject: "Matematika", room: "101" },
    { day: "WEDNESDAY", start: "10:40", end: "11:25", subject: "Hemija", room: "Lab 3" },
    { day: "WEDNESDAY", start: "11:35", end: "12:20", subject: "Muzičko", room: "Muzička" },
    // Četvrtak
    { day: "THURSDAY", start: "08:00", end: "08:45", subject: "Srpski jezik", room: "205" },
    { day: "THURSDAY", start: "08:50", end: "09:35", subject: "Fizika", room: "Lab 1" },
    { day: "THURSDAY", start: "09:50", end: "10:35", subject: "Istorija", room: "203" },
    { day: "THURSDAY", start: "10:40", end: "11:25", subject: "Informatika", room: "Kabinet" },
    { day: "THURSDAY", start: "11:35", end: "12:20", subject: "Fizičko", room: "Sala" },
    // Petak
    { day: "FRIDAY", start: "08:00", end: "08:45", subject: "Matematika", room: "101" },
    { day: "FRIDAY", start: "08:50", end: "09:35", subject: "Engleski jezik", room: "302" },
    { day: "FRIDAY", start: "09:50", end: "10:35", subject: "Biologija", room: "Lab 2" },
    { day: "FRIDAY", start: "10:40", end: "11:25", subject: "Geografija", room: "204" },
    { day: "FRIDAY", start: "11:35", end: "12:20", subject: "Građansko vaspitanje", room: "108" },
  ];

  for (const item of scheduleItems) {
    const subject = getSubject(item.subject);
    await prisma.scheduleEntry.create({
      data: {
        studentId: marko.id,
        subjectId: subject.id,
        dayOfWeek: item.day as any,
        startTime: item.start,
        endTime: item.end,
        room: item.room,
        isAWeek: true,
        isBWeek: true,
      },
    });
  }
  console.log(`✅ Kreirano ${scheduleItems.length} časova u rasporedu\n`);

  // ==========================================
  // CREATE EVENTS FOR MARKO
  // ==========================================
  console.log("📅 Kreiram događaje...");

  const events = [
    { type: "EXAM", title: "Kontrolni iz matematike", description: "Kvadratne jednačine i sistemi", dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), location: "Učionica 101" },
    { type: "EXAM", title: "Pismeni iz srpskog", description: "Esej na zadatu temu", dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), location: "Učionica 205" },
    { type: "MEETING", title: "Roditeljski sastanak", description: "Kraj prvog polugodišta", dateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), location: "Učionica 5/A" },
    { type: "TRIP", title: "Ekskurzija - Beograd", description: "Poseta muzeju i zoo vrtu", dateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), location: "Polazak ispred škole u 7:00" },
    { type: "COMPETITION", title: "Školsko takmičenje iz matematike", description: "Prijava do petka!", dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), location: "Svečana sala" },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: {
        studentId: marko.id,
        type: event.type as any,
        title: event.title,
        description: event.description,
        dateTime: event.dateTime,
        location: event.location,
      },
    });
  }
  console.log(`✅ Kreirano ${events.length} događaja\n`);

  // ==========================================
  // CREATE FLASHCARD DECKS FOR MARKO
  // ==========================================
  console.log("🎴 Kreiram flashcard setove...");

  const mathDeck = await prisma.flashcardDeck.create({
    data: {
      studentId: marko.id,
      subjectId: matematika.id,
      title: "Formule za geometriju",
      color: "#3b82f6",
    },
  });

  const mathCards = [
    { front: "Površina kvadrata", back: "P = a²" },
    { front: "Površina pravougaonika", back: "P = a × b" },
    { front: "Površina trougla", back: "P = (a × h) / 2" },
    { front: "Obim kruga", back: "O = 2πr" },
    { front: "Površina kruga", back: "P = πr²" },
    { front: "Zapremina kocke", back: "V = a³" },
    { front: "Pitagorina teorema", back: "a² + b² = c²" },
  ];

  for (const card of mathCards) {
    await prisma.flashcard.create({
      data: { deckId: mathDeck.id, front: card.front, back: card.back },
    });
  }

  const engDeck = await prisma.flashcardDeck.create({
    data: {
      studentId: marko.id,
      subjectId: engleski.id,
      title: "Irregular Verbs",
      color: "#10b981",
    },
  });

  const engCards = [
    { front: "go", back: "went - gone" },
    { front: "be", back: "was/were - been" },
    { front: "have", back: "had - had" },
    { front: "do", back: "did - done" },
    { front: "say", back: "said - said" },
    { front: "make", back: "made - made" },
    { front: "take", back: "took - taken" },
    { front: "come", back: "came - come" },
    { front: "see", back: "saw - seen" },
    { front: "get", back: "got - got/gotten" },
  ];

  for (const card of engCards) {
    await prisma.flashcard.create({
      data: { deckId: engDeck.id, front: card.front, back: card.back },
    });
  }

  console.log("✅ Kreirano 2 seta flashcard-ova\n");

  // ==========================================
  // CREATE KNOWLEDGE RESOURCES FOR MARKO
  // ==========================================
  console.log("📖 Kreiram bazu znanja...");

  const knowledgeItems = [
    { subjectId: matematika.id, title: "Kvadratna jednačina - formula", type: "NOTE" as const, content: "x = (-b ± √(b² - 4ac)) / 2a\n\nDiskriminanta D = b² - 4ac\n- D > 0: dva rešenja\n- D = 0: jedno rešenje\n- D < 0: nema realnih rešenja", isPinned: true, tags: JSON.stringify(["formula", "jednačine"]) },
    { subjectId: fizika.id, title: "Njutnovi zakoni", type: "NOTE" as const, content: "1. Zakon inercije: Telo miruje ili se kreće ravnomerno pravolinijski dok ga sila ne primora da promeni to stanje.\n\n2. F = m × a (Sila = masa × ubrzanje)\n\n3. Akcija = Reakcija", isPinned: true, tags: JSON.stringify(["njutn", "zakoni", "mehanika"]) },
    { subjectId: engleski.id, title: "Koristan link - Irregular Verbs", type: "LINK" as const, content: "https://www.englishpage.com/irregularverbs/irregularverbs.html", isPinned: false, tags: JSON.stringify(["glagoli", "gramatika"]) },
    { subjectId: istorija.id, title: "Srednji vek - beleške", type: "NOTE" as const, content: "Srednji vek (5-15. vek)\n\n✓ Pad Rimskog carstva 476.\n✓ Krunisanje Karla Velikog 800.\n✓ Veliki raskol 1054.\n✓ Pad Carigrada 1453.\n\nFeudalizam: kralj → plemstvo → vitezovi → seljaci", isPinned: false, tags: JSON.stringify(["srednji vek", "beleške"]) },
    { subjectId: biologija.id, title: "Delovi ćelije", type: "NOTE" as const, content: "🔬 ŽIVOTINJSKA ĆELIJA:\n- Jedro (nukleus)\n- Citoplazma\n- Ćelijska membrana\n- Mitohondrije\n- Ribozomi\n- Endoplazmatični retikulum\n\n🌱 BILJNA ĆELIJA (dodatno ima):\n- Ćelijski zid\n- Hloroplasti\n- Vakuola", isPinned: true, tags: JSON.stringify(["ćelija", "biologija"]) },
  ];

  for (const item of knowledgeItems) {
    await prisma.knowledgeResource.create({
      data: {
        studentId: marko.id,
        ...item,
      },
    });
  }
  console.log(`✅ Kreirano ${knowledgeItems.length} resursa u bazi znanja\n`);

  // ==========================================
  // CREATE FOCUS SESSIONS FOR MARKO
  // ==========================================
  console.log("⏱️ Kreiram focus sesije...");

  const focusSessions = [
    { subjectId: matematika.id, duration: 45, xpEarned: 90, daysAgo: 1 },
    { subjectId: engleski.id, duration: 30, xpEarned: 60, daysAgo: 1 },
    { subjectId: srpski.id, duration: 25, xpEarned: 50, daysAgo: 2 },
    { subjectId: fizika.id, duration: 40, xpEarned: 80, daysAgo: 3 },
    { subjectId: matematika.id, duration: 60, xpEarned: 120, daysAgo: 4 },
    { subjectId: istorija.id, duration: 35, xpEarned: 70, daysAgo: 5 },
  ];

  for (const session of focusSessions) {
    const startTime = new Date(Date.now() - session.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.focusSession.create({
      data: {
        studentId: marko.id,
        subjectId: session.subjectId,
        startTime,
        endTime: new Date(startTime.getTime() + session.duration * 60 * 1000),
        duration: session.duration,
        status: "COMPLETED",
        xpEarned: session.xpEarned,
      },
    });
  }
  console.log(`✅ Kreirano ${focusSessions.length} focus sesija\n`);

  // ==========================================
  // CREATE NOTIFICATIONS FOR MARKO
  // ==========================================
  console.log("🔔 Kreiram notifikacije...");

  const notifications = [
    { type: "HOMEWORK_DUE", title: "Domaći ističe sutra!", message: "Past Simple Tense - vežbe iz Engleskog jezika ističe sutra.", read: false },
    { type: "ACHIEVEMENT_UNLOCKED", title: "Nova značka!", message: "Osvojio si značku 'Nedelja discipline' za 7 dana zaredom! 🔥", read: false },
    { type: "HOMEWORK_REVIEWED", title: "Domaći pregledan", message: "Mama je pregledala tvoj domaći iz matematike: Odličan rad! ⭐", read: true },
    { type: "EVENT_REMINDER", title: "Podsetnik", message: "Kontrolni iz matematike za 7 dana!", read: true },
    { type: "LEVEL_UP", title: "Novi nivo!", message: "Čestitamo! Dostigao si nivo 12! 🎉", read: true },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: {
        userId: marko.userId,
        type: notif.type as any,
        title: notif.title,
        message: notif.message,
        read: notif.read,
      },
    });
  }
  console.log(`✅ Kreirano ${notifications.length} notifikacija\n`);

  // ==========================================
  // CREATE WEEKLY REPORT FOR MARKO
  // ==========================================
  console.log("📊 Kreiram sedmični izveštaj...");

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  await prisma.weeklyReport.create({
    data: {
      studentId: marko.id,
      weekStart,
      weekEnd,
      totalHomework: 8,
      completedHomework: 6,
      lateHomework: 1,
      subjectBreakdown: {
        Matematika: { total: 2, completed: 2 },
        "Srpski jezik": { total: 2, completed: 1 },
        "Engleski jezik": { total: 2, completed: 2 },
        Fizika: { total: 1, completed: 1 },
        Istorija: { total: 1, completed: 0 },
      },
    },
  });
  console.log("✅ Sedmični izveštaj kreiran\n");

  // ==========================================
  // CREATE ACTIVITY LOGS FOR MARKO
  // ==========================================
  console.log("📋 Kreiram activity log...");

  const activityLogs = [
    { type: "LOGIN", description: "Prijava na sistem" },
    { type: "HOMEWORK_CREATED", description: "Kreiran domaći: Kvadratne jednačine" },
    { type: "HOMEWORK_UPDATED", description: "Ažuriran status domaćeg: Razlomci" },
    { type: "PROFILE_UPDATED", description: "Ažuriran profil - dodata biografija" },
    { type: "PARENT_LINKED", description: "Povezan sa roditeljom: Jelena Marković" },
  ];

  for (const log of activityLogs) {
    await prisma.activityLog.create({
      data: {
        studentId: marko.id,
        type: log.type as any,
        description: log.description,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ Kreirano ${activityLogs.length} activity log zapisa\n`);

  // ==========================================
  // FINAL OUTPUT
  // ==========================================
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                    ║");
  console.log("║          🎉 KOMPLETAN SEED ZAVRŠEN - DEMO SPREMNI! 🎉             ║");
  console.log("║                                                                    ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("📧 DEMO UČENICI:");
  console.log("────────────────────────────────────────────────────────────────────");
  for (const student of DEMO_STUDENTS) {
    console.log(`   ${student.name}`);
    console.log(`   📧 ${student.email} | 🔑 ${student.password}`);
    console.log(`   🏫 ${student.school} - ${student.grade}/${student.class}`);
    console.log("");
  }
  console.log("👨‍👩‍👧 DEMO RODITELJI:");
  console.log("────────────────────────────────────────────────────────────────────");
  for (const guardian of DEMO_GUARDIANS) {
    console.log(`   ${guardian.name}`);
    console.log(`   📧 ${guardian.email} | 🔑 ${guardian.password}`);
    console.log("");
  }
  console.log("────────────────────────────────────────────────────────────────────");
  console.log("🎯 MARKO IMA SVE PODATKE:");
  console.log("   ✓ 10 domaćih zadataka (različiti statusi)");
  console.log("   ✓ Kompletan raspored (5 dana, 25 časova)");
  console.log("   ✓ 5 događaja (kontrolni, izleti, sastanci)");
  console.log("   ✓ Ocene iz 8+ predmeta");
  console.log("   ✓ Gamification nivo 12, 2450 XP, 15 dana streak");
  console.log("   ✓ 8 otključanih achievements");
  console.log("   ✓ 2 flashcard seta (17 kartica)");
  console.log("   ✓ 5 resursa u bazi znanja");
  console.log("   ✓ 6 focus sesija");
  console.log("   ✓ 5 notifikacija");
  console.log("   ✓ Sedmični izveštaj");
  console.log("   ✓ 5 activity log zapisa");
  console.log("   ✓ Povezan sa roditeljom (Jelena)");
  console.log("   ✓ Kompletan profil (zdravlje, kontakti, hobiji)");
  console.log("");
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
