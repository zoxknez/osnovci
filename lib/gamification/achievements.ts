/**
 * Achievement System - 15 Achievement Types
 *
 * Enhanced achievement tracking with:
 * - Progress tracking towards achievements
 * - Hidden/secret achievements
 * - Category grouping
 * - Rarity tiers
 * - Dynamic unlocking logic
 */

import type { AchievementRarity, AchievementType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { createNotification } from "@/lib/notifications/create";
import { addXP } from "./xp-system-v2";

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================

interface AchievementMilestone {
  at: number;
  title: string;
  desc: string;
  icon: string;
  xp: number;
  rarity: AchievementRarity;
  category: string;
  isHidden?: boolean;
}

export const ACHIEVEMENTS: Record<AchievementType, AchievementMilestone[]> = {
  HOMEWORK_MILESTONE: [
    {
      at: 10,
      title: "Prvi Koraci",
      desc: "Završio 10 zadataka!",
      icon: "🏃",
      xp: 20,
      rarity: "COMMON",
      category: "Homework",
    },
    {
      at: 50,
      title: "Vredan Učenik",
      desc: "Završio 50 zadataka!",
      icon: "📚",
      xp: 50,
      rarity: "RARE",
      category: "Homework",
    },
    {
      at: 100,
      title: "Majstor Zadataka",
      desc: "Završio 100 zadataka!",
      icon: "🏆",
      xp: 100,
      rarity: "EPIC",
      category: "Homework",
    },
    {
      at: 500,
      title: "Legenda Lekcija",
      desc: "Neverovatnih 500 zadataka!",
      icon: "👑",
      xp: 500,
      rarity: "LEGENDARY",
      category: "Homework",
    },
  ],

  STREAK_MILESTONE: [
    {
      at: 7,
      title: "Sedmodnevni Šampion",
      desc: "7 dana uzastopno!",
      icon: "🔥",
      xp: 30,
      rarity: "COMMON",
      category: "Streak",
    },
    {
      at: 14,
      title: "Dve Nedelje Snage",
      desc: "14 dana bez prekida!",
      icon: "💪",
      xp: 60,
      rarity: "RARE",
      category: "Streak",
    },
    {
      at: 30,
      title: "Mesečna Zvezda",
      desc: "30 dana streak!",
      icon: "⭐",
      xp: 100,
      rarity: "EPIC",
      category: "Streak",
    },
    {
      at: 100,
      title: "Legenda Discipline",
      desc: "100 dana streak - neverovatno!",
      icon: "👑",
      xp: 300,
      rarity: "LEGENDARY",
      category: "Streak",
    },
    {
      at: 365,
      title: "Jednogodišnja Dominacija",
      desc: "CELA GODINA bez prekida!",
      icon: "🌟",
      xp: 1000,
      rarity: "LEGENDARY",
      category: "Streak",
      isHidden: true,
    },
  ],

  LEVEL_MILESTONE: [
    {
      at: 5,
      title: "Rising Star",
      desc: "Dostigao Level 5!",
      icon: "🌟",
      xp: 25,
      rarity: "COMMON",
      category: "Level",
    },
    {
      at: 10,
      title: "Superstar",
      desc: "Dostigao Level 10!",
      icon: "💫",
      xp: 50,
      rarity: "RARE",
      category: "Level",
    },
    {
      at: 20,
      title: "Living Legend",
      desc: "Dostigao Level 20!",
      icon: "🚀",
      xp: 100,
      rarity: "EPIC",
      category: "Level",
    },
    {
      at: 30,
      title: "Grandmaster",
      desc: "Level 30 - Elita!",
      icon: "🎖️",
      xp: 200,
      rarity: "LEGENDARY",
      category: "Level",
    },
    {
      at: 50,
      title: "Maximum Overdrive",
      desc: "MAX LEVEL 50!",
      icon: "👑",
      xp: 500,
      rarity: "LEGENDARY",
      category: "Level",
      isHidden: true,
    },
  ],

  PERFECT_WEEK: [
    {
      at: 1,
      title: "Savršena Nedelja",
      desc: "Sve obaveze završene!",
      icon: "📅",
      xp: 75,
      rarity: "RARE",
      category: "Consistency",
    },
    {
      at: 4,
      title: "Mesečni Šampion",
      desc: "4 savršene nedelje!",
      icon: "🏅",
      xp: 150,
      rarity: "EPIC",
      category: "Consistency",
    },
    {
      at: 12,
      title: "Tromesečni Kralj",
      desc: "3 meseca savršenstva!",
      icon: "👑",
      xp: 500,
      rarity: "LEGENDARY",
      category: "Consistency",
      isHidden: true,
    },
  ],

  EARLY_BIRD: [
    {
      at: 1,
      title: "Ranoranilac",
      desc: "Zadatak završen ranije!",
      icon: "🌅",
      xp: 20,
      rarity: "COMMON",
      category: "Planning",
    },
    {
      at: 10,
      title: "Planer",
      desc: "10 zadataka ranije!",
      icon: "🗓️",
      xp: 60,
      rarity: "RARE",
      category: "Planning",
    },
    {
      at: 50,
      title: "Master Planer",
      desc: "50 zadataka ranije - odličan planning!",
      icon: "📊",
      xp: 200,
      rarity: "EPIC",
      category: "Planning",
    },
  ],

  SUBJECT_MASTER: [
    {
      at: 10,
      title: "Mini Majstor",
      desc: "10 zadataka iz jednog predmeta!",
      icon: "📘",
      xp: 25,
      rarity: "COMMON",
      category: "Subject",
    },
    {
      at: 25,
      title: "Predmet Guru",
      desc: "25 zadataka iz istog predmeta!",
      icon: "🎓",
      xp: 80,
      rarity: "RARE",
      category: "Subject",
    },
    {
      at: 100,
      title: "Akademik",
      desc: "100 zadataka iz jednog predmeta!",
      icon: "🏛️",
      xp: 300,
      rarity: "LEGENDARY",
      category: "Subject",
      isHidden: true,
    },
  ],

  SPEED_DEMON: [
    {
      at: 5,
      title: "Brzi Prsti",
      desc: "5 brzih završetaka!",
      icon: "⚡",
      xp: 30,
      rarity: "COMMON",
      category: "Speed",
    },
    {
      at: 20,
      title: "Speed Demon",
      desc: "20 brzih zadataka!",
      icon: "💨",
      xp: 100,
      rarity: "RARE",
      category: "Speed",
    },
    {
      at: 50,
      title: "Sonic Scholar",
      desc: "50 brzih zadataka - neverovatna brzina!",
      icon: "🏃‍♂️",
      xp: 250,
      rarity: "EPIC",
      category: "Speed",
    },
  ],

  NIGHT_OWL: [
    {
      at: 5,
      title: "Noćna Sova",
      desc: "5 zadataka završeno uveče!",
      icon: "🦉",
      xp: 25,
      rarity: "COMMON",
      category: "Time",
    },
    {
      at: 20,
      title: "Midnight Scholar",
      desc: "20 noćnih sesija!",
      icon: "🌙",
      xp: 80,
      rarity: "RARE",
      category: "Time",
    },
    {
      at: 50,
      title: "Gospodar Noći",
      desc: "50 noćnih zadataka!",
      icon: "🌃",
      xp: 200,
      rarity: "EPIC",
      category: "Time",
      isHidden: true,
    },
  ],

  WEEKEND_WARRIOR: [
    {
      at: 5,
      title: "Vikend Borac",
      desc: "5 zadataka tokom vikenda!",
      icon: "🏖️",
      xp: 30,
      rarity: "COMMON",
      category: "Time",
    },
    {
      at: 20,
      title: "Vikend Šampion",
      desc: "20 vikenada rada!",
      icon: "🏋️",
      xp: 100,
      rarity: "RARE",
      category: "Time",
    },
    {
      at: 52,
      title: "52 Vikenda",
      desc: "Godina vikenada!",
      icon: "🗓️",
      xp: 300,
      rarity: "LEGENDARY",
      category: "Time",
      isHidden: true,
    },
  ],

  COMEBACK_KID: [
    {
      at: 1,
      title: "Povratak",
      desc: "Vratio se posle pauze!",
      icon: "🔄",
      xp: 30,
      rarity: "COMMON",
      category: "Motivation",
    },
    {
      at: 3,
      title: "Upornost",
      desc: "3 povratka - ne odustaješ!",
      icon: "💪",
      xp: 80,
      rarity: "RARE",
      category: "Motivation",
    },
    {
      at: 5,
      title: "Nezaustavljiv",
      desc: "Uvek se vraćaš!",
      icon: "🔥",
      xp: 150,
      rarity: "EPIC",
      category: "Motivation",
    },
  ],

  PERFECTIONIST: [
    {
      at: 5,
      title: "Tražitelj Savršenstva",
      desc: "5 zadataka bez grešaka!",
      icon: "✨",
      xp: 40,
      rarity: "COMMON",
      category: "Quality",
    },
    {
      at: 20,
      title: "Perfekcionista",
      desc: "20 savršenih zadataka!",
      icon: "💎",
      xp: 120,
      rarity: "RARE",
      category: "Quality",
    },
    {
      at: 100,
      title: "Bezgrešan",
      desc: "100 savršenih zadataka!",
      icon: "🏆",
      xp: 500,
      rarity: "LEGENDARY",
      category: "Quality",
      isHidden: true,
    },
  ],

  HELPER: [
    {
      at: 5,
      title: "Dobar Drug",
      desc: "Pomogao 5 učenika!",
      icon: "🤝",
      xp: 50,
      rarity: "COMMON",
      category: "Social",
    },
    {
      at: 20,
      title: "Nastavnik u Povojima",
      desc: "Pomogao 20 učenika!",
      icon: "👨‍🏫",
      xp: 150,
      rarity: "RARE",
      category: "Social",
    },
    {
      at: 50,
      title: "Mentor",
      desc: "Pomogao 50+ učenika!",
      icon: "🎓",
      xp: 400,
      rarity: "LEGENDARY",
      category: "Social",
    },
  ],

  CONSISTENT: [
    {
      at: 7,
      title: "Disciplinovan",
      desc: "7 dana aktivnosti!",
      icon: "📈",
      xp: 35,
      rarity: "COMMON",
      category: "Consistency",
    },
    {
      at: 30,
      title: "Konzistentan",
      desc: "30 dana redovnosti!",
      icon: "📊",
      xp: 100,
      rarity: "RARE",
      category: "Consistency",
    },
    {
      at: 100,
      title: "Mašina za Učenje",
      desc: "100 dana konzistentnosti!",
      icon: "🤖",
      xp: 350,
      rarity: "EPIC",
      category: "Consistency",
    },
  ],

  EXPLORER: [
    {
      at: 3,
      title: "Radoznao Um",
      desc: "Zadaci iz 3 različita predmeta!",
      icon: "🧭",
      xp: 30,
      rarity: "COMMON",
      category: "Exploration",
    },
    {
      at: 5,
      title: "Istraživač",
      desc: "Svi predmeti pokriveni!",
      icon: "🔍",
      xp: 80,
      rarity: "RARE",
      category: "Exploration",
    },
    {
      at: 10,
      title: "Renesansni Učenik",
      desc: "Majstor svih oblasti!",
      icon: "🎨",
      xp: 200,
      rarity: "EPIC",
      category: "Exploration",
      isHidden: true,
    },
  ],

  OVERACHIEVER: [
    {
      at: 5,
      title: "Preko Očekivanja",
      desc: "5 dodatnih zadataka!",
      icon: "🌟",
      xp: 50,
      rarity: "RARE",
      category: "Excellence",
    },
    {
      at: 20,
      title: "Overachiever",
      desc: "20 ekstra zadataka!",
      icon: "💫",
      xp: 150,
      rarity: "EPIC",
      category: "Excellence",
    },
    {
      at: 50,
      title: "Exceeds All Expectations",
      desc: "Prevazišao sve!",
      icon: "🚀",
      xp: 400,
      rarity: "LEGENDARY",
      category: "Excellence",
      isHidden: true,
    },
  ],

  SOCIAL_BUTTERFLY: [
    {
      at: 1,
      title: "Društvena Leptir",
      desc: "Pomogao drugima!",
      icon: "🦋",
      xp: 20,
      rarity: "COMMON",
      category: "Social",
    },
  ],
  COLLECTOR: [
    {
      at: 1,
      title: "Kolekcionar",
      desc: "Sakupio sve bedževe!",
      icon: "🏆",
      xp: 50,
      rarity: "LEGENDARY",
      category: "Collection",
    },
  ],
};

// ============================================
// ACHIEVEMENT FUNCTIONS
// ============================================

/**
 * Check and unlock achievements
 */
export async function checkAchievements(
  gamificationId: string,
  type: AchievementType,
  currentValue: number,
) {
  const milestones = ACHIEVEMENTS[type];
  if (!milestones?.length) return;

  for (const milestone of milestones) {
    if (currentValue >= milestone.at) {
      // Check if already unlocked
      const existing = await prisma.achievement.findFirst({
        where: {
          gamificationId,
          type,
          title: milestone.title,
        },
      });

      if (!existing) {
        // Unlock achievement!
        await prisma.achievement.create({
          data: {
            gamificationId,
            type,
            title: milestone.title,
            description: milestone.desc,
            icon: milestone.icon,
            xpReward: milestone.xp,
            rarity: milestone.rarity,
            category: milestone.category,
            isHidden: milestone.isHidden || false,
            progress: currentValue,
            target: milestone.at,
          },
        });

        log.info("Achievement unlocked", {
          gamificationId,
          type,
          title: milestone.title,
          rarity: milestone.rarity,
        });

        // Get student and notify
        const gamif = await prisma.gamification.findUnique({
          where: { id: gamificationId },
          include: {
            student: {
              include: { user: true },
            },
          },
        });

        if (gamif) {
          // Add XP reward
          await addXP(
            gamif.studentId,
            milestone.xp,
            `Achievement: ${milestone.title}`,
          );

          // Notify user
          await createNotification({
            userId: gamif.student.user.id,
            type: "HOMEWORK_SUBMITTED",
            title: `🎉 Novi Achievement! ${milestone.icon}`,
            message: `Otključao si: ${milestone.title}! +${milestone.xp} XP!`,
            data: {
              achievementTitle: milestone.title,
              achievementRarity: milestone.rarity,
              xpReward: milestone.xp,
            },
          });
        }
      }
    }
  }
}

/**
 * Track homework completion with enhanced achievement checking
 */
export async function trackHomeworkCompletion(
  studentId: string,
  metadata: {
    early?: boolean;
    veryEarly?: boolean;
    fast?: boolean;
    perfect?: boolean;
    hasDetailedNotes?: boolean;
    subject?: string;
    isWeekend?: boolean;
    isNight?: boolean;
    isMorning?: boolean;
  },
) {
  try {
    let gamif = await prisma.gamification.findUnique({
      where: { studentId },
    });

    if (!gamif) {
      gamif = await prisma.gamification.create({
        data: { studentId },
      });
    }

    // Update counters
    const updates: Record<string, number> = {
      totalHomeworkDone: gamif.totalHomeworkDone + 1,
    };

    if (metadata.early || metadata.veryEarly) {
      updates["earlySubmissions"] = gamif.earlySubmissions + 1;
      await checkAchievements(gamif.id, "EARLY_BIRD", updates["earlySubmissions"]);
    }

    if (metadata.isWeekend) {
      updates["weekendTasks"] = gamif.weekendTasks + 1;
      await checkAchievements(
        gamif.id,
        "WEEKEND_WARRIOR",
        updates["weekendTasks"],
      );
    }

    if (metadata.isNight) {
      updates["nightTasks"] = gamif.nightTasks + 1;
      await checkAchievements(gamif.id, "NIGHT_OWL", updates["nightTasks"]);
    }

    if (metadata.fast) {
      updates["fastCompletions"] = gamif.fastCompletions + 1;
      await checkAchievements(gamif.id, "SPEED_DEMON", updates["fastCompletions"]);
    }

    // Apply updates
    gamif = await prisma.gamification.update({
      where: { id: gamif.id },
      data: updates,
    });

    // Add XP with bonuses
    await addXP(studentId, 10, "Homework completed", {
      ...(metadata.isWeekend !== undefined && { isWeekend: metadata.isWeekend }),
      ...(metadata.isNight !== undefined && { isNight: metadata.isNight }),
      ...(metadata.isMorning !== undefined && { isMorning: metadata.isMorning }),
      ...(metadata.fast !== undefined && { isFast: metadata.fast }),
      ...(metadata.perfect !== undefined && { isPerfect: metadata.perfect }),
      ...(metadata.hasDetailedNotes !== undefined && { hasDetailedNotes: metadata.hasDetailedNotes }),
      applyStreakMultiplier: true,
    });

    // Check milestone achievements
    await checkAchievements(
      gamif.id,
      "HOMEWORK_MILESTONE",
      gamif.totalHomeworkDone,
    );

    if (metadata.perfect) {
      // Track perfect completions (would need new field in schema)
      await checkAchievements(gamif.id, "PERFECTIONIST", 1);
    }

    log.info("Homework completion tracked", {
      studentId,
      totalHomeworkDone: gamif.totalHomeworkDone,
      metadata,
    });

    return gamif;
  } catch (error) {
    log.error("Failed to track homework completion", { error, studentId });
    throw error;
  }
}

/**
 * Get achievement progress for a student
 */
export async function getAchievementProgress(studentId: string) {
  const gamif = await prisma.gamification.findUnique({
    where: { studentId },
    include: {
      achievements: {
        orderBy: [{ rarity: "desc" }, { unlockedAt: "desc" }],
      },
    },
  });

  if (!gamif) return null;

  // Calculate progress towards locked achievements
  const allPossibleAchievements: Record<string, any> = {};

  Object.entries(ACHIEVEMENTS).forEach(([type, milestones]) => {
    milestones.forEach((milestone) => {
      const isUnlocked = gamif.achievements.some(
        (a) => a.title === milestone.title,
      );

      if (!milestone.isHidden || isUnlocked) {
        allPossibleAchievements[milestone.title] = {
          ...milestone,
          type,
          isUnlocked,
          progress: isUnlocked
            ? milestone.at
            : getCurrentProgress(gamif, type as AchievementType),
          target: milestone.at,
        };
      }
    });
  });

  return {
    gamification: gamif,
    allAchievements: Object.values(allPossibleAchievements),
    unlockedCount: gamif.achievements.length,
    totalCount: Object.keys(allPossibleAchievements).length,
  };
}

/**
 * Helper to get current progress for achievement type
 */
function getCurrentProgress(gamif: any, type: AchievementType): number {
  switch (type) {
    case "HOMEWORK_MILESTONE":
      return gamif.totalHomeworkDone;
    case "STREAK_MILESTONE":
      return gamif.streak;
    case "LEVEL_MILESTONE":
      return gamif.level;
    case "PERFECT_WEEK":
      return gamif.perfectWeeks;
    case "EARLY_BIRD":
      return gamif.earlySubmissions;
    case "SPEED_DEMON":
      return gamif.fastCompletions;
    case "NIGHT_OWL":
      return gamif.nightTasks;
    case "WEEKEND_WARRIOR":
      return gamif.weekendTasks;
    default:
      return 0;
  }
}
