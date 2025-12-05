/**
 * Grades Calculation Utilities
 * Helper functions for calculating grade statistics and insights
 */

// Input type for grade data
interface GradeInput {
  grade: string | number;
  subject?: {
    name: string;
    color?: string;
  };
}

export interface GradeBySubject {
  subject: string;
  color: string;
  grades: number[];
  icon: string;
  average?: number;
  trend?: "up" | "down" | "stable";
  lastGrade?: number;
  totalGrades?: number;
}

export interface Insight {
  subject: string;
  currentAvg: number;
  suggestion: string;
}

/**
 * Organize grades by subject
 */
export function organizeGradesBySubject(
  grades: GradeInput[],
): Record<string, GradeBySubject> {
  return grades.reduce<Record<string, GradeBySubject>>((acc, grade) => {
    const subjectName = grade.subject?.name || "Nepoznat predmet";
    if (!acc[subjectName]) {
      acc[subjectName] = {
        subject: subjectName,
        color: grade.subject?.color || "#3b82f6",
        grades: [],
        icon: "📚",
      };
    }
    acc[subjectName].grades.push(parseInt(String(grade.grade), 10));
    return acc;
  }, {});
}

/**
 * Calculate averages and trends for subject grades
 */
export function calculateSubjectStats(
  subjectGrades: Record<string, GradeBySubject>,
): GradeBySubject[] {
  return Object.values(subjectGrades).map((sg) => {
    const avg = sg.grades.reduce((a, b) => a + b, 0) / sg.grades.length;
    const firstGrade = sg.grades[0];
    const lastGrade = sg.grades[sg.grades.length - 1];
    const trend: "up" | "down" | "stable" =
      sg.grades.length > 1 &&
      firstGrade !== undefined &&
      lastGrade !== undefined
        ? firstGrade > lastGrade
          ? "up"
          : firstGrade < lastGrade
            ? "down"
            : "stable"
        : "stable";

    const result: GradeBySubject = {
      ...sg,
      average: Math.round(avg * 100) / 100,
      trend,
      totalGrades: sg.grades.length,
    };

    if (firstGrade !== undefined) {
      result.lastGrade = firstGrade;
    }

    return result;
  });
}

/**
 * Calculate insights for improving grades
 */
export function calculateInsights(subjectGrades: GradeBySubject[]): Insight[] {
  return subjectGrades
    .map((sg) => {
      const currentAvg = sg.average || 0;
      if (currentAvg >= 5 || currentAvg === 0) return null;

      const nextWhole = Math.floor(currentAvg) + 1;
      const targetAvg = nextWhole - 0.5;

      if (currentAvg >= targetAvg) return null;

      const sum = sg.grades.reduce((a, b) => a + b, 0);
      const count = sg.grades.length;

      const needed = Math.ceil((targetAvg * count - sum) / (5 - targetAvg));

      if (needed <= 0 || needed > 20) return null;

      return {
        subject: sg.subject,
        currentAvg,
        suggestion: `Treba ti još ${needed} petic${needed === 1 ? "a" : "e"} za ${nextWhole}!`,
      };
    })
    .filter((insight): insight is Insight => insight !== null)
    .slice(0, 3);
}

/**
 * Get best subject from subject grades
 */
export function getBestSubject(subjectGrades: GradeBySubject[]): string {
  if (subjectGrades.length === 0) return "N/A";

  const first = subjectGrades[0];
  if (!first) return "N/A";

  return subjectGrades.reduce(
    (max, s) => ((s.average ?? 0) > (max.average ?? 0) ? s : max),
    first,
  ).subject;
}
