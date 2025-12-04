/**
 * Adaptive Learning Paths
 * AI-driven personalizacija učenja za svakog učenika
 */

import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

interface LearningProfile {
  strengths: string[]; // Predmeti gde učenik briljira
  weaknesses: string[]; // Predmeti gde treba pomoć
  learningStyle: "visual" | "auditory" | "kinesthetic" | "reading";
  optimalStudyTime: string; // Kada učenik najbolje uči (npr. "09:00-11:00")
  attentionSpan: number; // Minuti fokusa
  preferredDifficulty: "easy" | "medium" | "hard";
}

interface LearningRecommendation {
  type: "homework" | "study_material" | "practice" | "break";
  priority: "high" | "medium" | "low";
  subject: string;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  reason: string; // Zašto je ovo preporučeno
}

/**
 * Analizira performanse učenika i generiše learning profile
 */
export async function analyzeLearningProfile(
  studentId: string
): Promise<LearningProfile> {
  try {
    // Get grades by subject
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: { subject: true },
    });

    // Get homework completion data
    const homework = await prisma.homework.findMany({
      where: { studentId },
      include: { subject: true },
    });

    // Analyze strengths and weaknesses
    const subjectStats: Record<
      string,
      { average: number; count: number; completionRate: number }
    > = {};

    grades.forEach((grade) => {
      const subjectName = grade.subject.name;
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = {
          average: 0,
          count: 0,
          completionRate: 0,
        };
      }
      subjectStats[subjectName].average += parseFloat(grade.grade);
      subjectStats[subjectName].count += 1;
    });

    homework.forEach((hw) => {
      const subjectName = hw.subject.name;
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = {
          average: 0,
          count: 0,
          completionRate: 0,
        };
      }
      if (hw.status === "DONE" || hw.status === "SUBMITTED") {
        subjectStats[subjectName].completionRate += 1;
      }
    });

    // Calculate averages
    Object.keys(subjectStats).forEach((subject) => {
      const stats = subjectStats[subject];
      if (!stats) return;
      if (stats.count > 0) {
        stats.average = stats.average / stats.count;
      }
      const totalHomework = homework.filter(
        (hw) => hw.subject.name === subject
      ).length;
      if (totalHomework > 0) {
        stats.completionRate = stats.completionRate / totalHomework;
      }
    });

    // Identify strengths (average > 4.0) and weaknesses (average < 3.5)
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(subjectStats).forEach(([subject, stats]) => {
      if (stats.average >= 4.0 && stats.count >= 3) {
        strengths.push(subject);
      } else if (stats.average < 3.5 && stats.count >= 2) {
        weaknesses.push(subject);
      }
    });

    // Analyze learning style based on activity patterns
    // TODO: Implement more sophisticated analysis
    const learningStyle: LearningProfile["learningStyle"] = "visual"; // Default

    // Analyze optimal study time (when most homework is completed)
    // TODO: Implement time-based analysis
    const optimalStudyTime = "09:00-11:00"; // Default

    // Estimate attention span based on average homework completion time
    // TODO: Track actual study sessions
    const attentionSpan = 30; // Default 30 minutes

    // Determine preferred difficulty
    const preferredDifficulty: LearningProfile["preferredDifficulty"] =
      strengths.length > weaknesses.length ? "medium" : "easy";

    return {
      strengths,
      weaknesses,
      learningStyle,
      optimalStudyTime,
      attentionSpan,
      preferredDifficulty,
    };
  } catch (error) {
    log.error("Error analyzing learning profile", error);
    // Return default profile
    return {
      strengths: [],
      weaknesses: [],
      learningStyle: "visual",
      optimalStudyTime: "09:00-11:00",
      attentionSpan: 30,
      preferredDifficulty: "medium",
    };
  }
}

/**
 * Generiše personalizovane preporuke za učenje
 */
export async function generateLearningRecommendations(
  studentId: string
): Promise<LearningRecommendation[]> {
  const profile = await analyzeLearningProfile(studentId);
  const recommendations: LearningRecommendation[] = [];

  // Get pending homework
  const pendingHomework = await prisma.homework.findMany({
    where: {
      studentId,
      status: { notIn: ["DONE", "SUBMITTED"] },
    },
    include: { subject: true },
    orderBy: { dueDate: "asc" },
  });

  // Prioritize homework from weak subjects
  pendingHomework.forEach((hw) => {
    const isWeakSubject = profile.weaknesses.includes(hw.subject.name);
    const isUrgent = hw.dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000);

    recommendations.push({
      type: "homework",
      priority: isUrgent ? "high" : isWeakSubject ? "medium" : "low",
      subject: hw.subject.name,
      title: hw.title,
      description: hw.description || "",
      estimatedTime: hw.estimatedMinutes || 30,
      reason: isWeakSubject
        ? `Ovo je predmet gde trebaš više vežbe.`
        : isUrgent
          ? `Rok je sutra!`
          : `Redovan zadatak.`,
    });
  });

  // Add study material recommendations for weak subjects
  profile.weaknesses.forEach((subject) => {
    recommendations.push({
      type: "study_material",
      priority: "medium",
      subject,
      title: `Dodatni materijali za ${subject}`,
      description: `Preporučujem da pogledaš dodatne materijale za ${subject} da bi poboljšao/la razumevanje.`,
      estimatedTime: 20,
      reason: `${subject} je predmet gde trebaš više vežbe.`,
    });
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return recommendations.slice(0, 10); // Return top 10
}

/**
 * Preporučuje optimalan raspored učenja za danas
 */
export async function getOptimalStudySchedule(
  studentId: string
): Promise<{
  recommendedOrder: LearningRecommendation[];
  totalEstimatedTime: number;
  breaks: Array<{ after: number; duration: number }>; // minutes
}> {
  const recommendations = await generateLearningRecommendations(studentId);
  const profile = await analyzeLearningProfile(studentId);

  // Add breaks based on attention span
  const breaks: Array<{ after: number; duration: number }> = [];
  let cumulativeTime = 0;

  recommendations.forEach((rec, idx) => {
    cumulativeTime += rec.estimatedTime;
    
    // Break after every attention span period
    if (cumulativeTime >= profile.attentionSpan && idx < recommendations.length - 1) {
      breaks.push({
        after: cumulativeTime,
        duration: 5, // 5 minute break
      });
      cumulativeTime = 0; // Reset counter
    }
  });

  return {
    recommendedOrder: recommendations,
    totalEstimatedTime: recommendations.reduce(
      (sum, r) => sum + r.estimatedTime,
      0
    ),
    breaks,
  };
}

