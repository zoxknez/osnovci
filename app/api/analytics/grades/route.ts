import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
} from "date-fns";

// Types
type Period = "week" | "month" | "semester" | "year" | "custom";

interface GradeTrendData {
  date: string;
  grade: number;
  subject: string;
  category: string;
}

interface MovingAverage {
  date: string;
  ma7: number;
  ma30: number;
}

interface SubjectTrend {
  subjectId: string;
  subjectName: string;
  currentAverage: number;
  previousAverage: number;
  trend: "up" | "down" | "stable";
  percentageChange: number;
  grades: GradeTrendData[];
}

interface CategoryPerformance {
  category: string;
  count: number;
  average: number;
  trend: "up" | "down" | "stable";
}

interface GradeDistribution {
  grade: number;
  count: number;
  percentage: number;
}

interface Alert {
  type: "declining" | "improvement" | "below-threshold" | "high-performer";
  severity: "low" | "medium" | "high";
  message: string;
  subjectId?: string;
  subjectName?: string;
  data?: any;
}

interface Prediction {
  subjectId: string;
  subjectName: string;
  predictedGrade: number;
  confidence: number;
  trend: "up" | "down" | "stable";
}

interface GradeAnalytics {
  period: {
    type: Period;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalGrades: number;
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
  };
  timeline: GradeTrendData[];
  movingAverages: MovingAverage[];
  subjectTrends: SubjectTrend[];
  categoryPerformance: CategoryPerformance[];
  distribution: GradeDistribution[];
  predictions: Prediction[];
  alerts: Alert[];
}

// Helper: Calculate moving average
function calculateMovingAverage(
  data: GradeTrendData[]
): MovingAverage[] {
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const result: MovingAverage[] = [];
  const uniqueDates = [...new Set(sortedData.map((d) => d.date))].sort();

  for (let i = 0; i < uniqueDates.length; i++) {
    const date = uniqueDates[i];
    if (!date) continue;

    // Calculate 7-day MA
    const start7 = Math.max(0, i - 6);
    const window7 = uniqueDates.slice(start7, i + 1);
    const grades7 = sortedData
      .filter((d) => window7.includes(d.date))
      .map((d) => d.grade);
    const ma7 = grades7.length
      ? grades7.reduce((sum, g) => sum + g, 0) / grades7.length
      : 0;

    // Calculate 30-day MA
    const start30 = Math.max(0, i - 29);
    const window30 = uniqueDates.slice(start30, i + 1);
    const grades30 = sortedData
      .filter((d) => window30.includes(d.date))
      .map((d) => d.grade);
    const ma30 = grades30.length
      ? grades30.reduce((sum, g) => sum + g, 0) / grades30.length
      : 0;

    result.push({
      date,
      ma7: parseFloat(ma7.toFixed(2)),
      ma30: parseFloat(ma30.toFixed(2)),
    });
  }

  return result;
}

// Helper: Linear regression for predictions
function linearRegression(data: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  const ssTotal = data.reduce(
    (sum, point) => sum + Math.pow(point.y - meanY, 2),
    0
  );
  const ssResidual = data.reduce(
    (sum, point) => sum + Math.pow(point.y - (slope * point.x + intercept), 2),
    0
  );
  const r2 = 1 - ssResidual / ssTotal;

  return { slope, intercept, r2: Math.max(0, r2) };
}

// Helper: Detect trend from grades
function detectTrend(
  grades: GradeTrendData[]
): "up" | "down" | "stable" {
  if (grades.length < 2) return "stable";

  const sortedGrades = [...grades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = sortedGrades.map((g, i) => ({
    x: i,
    y: g.grade,
  }));

  const { slope } = linearRegression(data);

  if (slope > 0.1) return "up";
  if (slope < -0.1) return "down";
  return "stable";
}

// Helper: Calculate percentage change
function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Helper: Generate alerts
function generateAlerts(
  subjectTrends: SubjectTrend[],
  overview: GradeAnalytics["overview"]
): Alert[] {
  const alerts: Alert[] = [];

  // Alert: Overall declining performance
  if (overview.trend === "down" && overview.trendPercentage < -10) {
    alerts.push({
      type: "declining",
      severity: "high",
      message: `Prosečna ocena je opala za ${Math.abs(overview.trendPercentage).toFixed(1)}% u poslednjem periodu.`,
    });
  }

  // Alert: Subject-specific declines
  for (const subject of subjectTrends) {
    if (subject.trend === "down" && subject.percentageChange < -15) {
      alerts.push({
        type: "declining",
        severity: "medium",
        message: `Ocena iz predmeta ${subject.subjectName} opada (${Math.abs(subject.percentageChange).toFixed(1)}%).`,
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        data: {
          currentAverage: subject.currentAverage,
          previousAverage: subject.previousAverage,
        },
      });
    }

    // Alert: Below threshold
    if (subject.currentAverage < 3.0) {
      alerts.push({
        type: "below-threshold",
        severity: "high",
        message: `Prosečna ocena iz predmeta ${subject.subjectName} je ispod 3.0 (${subject.currentAverage.toFixed(2)}).`,
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
      });
    }

    // Alert: High performance
    if (subject.currentAverage >= 4.5 && subject.trend === "up") {
      alerts.push({
        type: "high-performer",
        severity: "low",
        message: `Odličan napredak u predmetu ${subject.subjectName} (prosek ${subject.currentAverage.toFixed(2)})!`,
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
      });
    }
  }

  // Alert: Significant improvement
  if (overview.trend === "up" && overview.trendPercentage > 15) {
    alerts.push({
      type: "improvement",
      severity: "low",
      message: `Prosečna ocena se poboljšala za ${overview.trendPercentage.toFixed(1)}%!`,
    });
  }

  return alerts;
}

// Helper: Generate predictions
function generatePredictions(subjectTrends: SubjectTrend[]): Prediction[] {
  const predictions: Prediction[] = [];

  for (const subject of subjectTrends) {
    if (subject.grades.length < 3) continue;

    const sortedGrades = [...subject.grades].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const data = sortedGrades.map((g, i) => ({
      x: i,
      y: g.grade,
    }));

    const { slope, intercept, r2 } = linearRegression(data);

    // Predict next grade
    const nextX = sortedGrades.length;
    const predictedGrade = Math.max(
      1,
      Math.min(5, slope * nextX + intercept)
    );

    predictions.push({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      predictedGrade: parseFloat(predictedGrade.toFixed(2)),
      confidence: parseFloat((r2 * 100).toFixed(1)),
      trend: subject.trend,
    });
  }

  return predictions.sort((a, b) => b.confidence - a.confidence);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");
    const period = (searchParams.get("period") as Period) || "semester";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Validate studentId
    if (!studentIdParam) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this student
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        guardian: {
          include: {
            links: {
              where: {
                studentId: studentIdParam,
                isActive: true,
              },
            },
          },
        },
      },
    });

    const isOwnStudent = user?.student?.id === studentIdParam;
    const isGuardian =
      user?.guardian && user.guardian.links.length > 0;

    if (!isOwnStudent && !isGuardian) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === "custom" && startDateParam && endDateParam) {
      startDate = parseISO(startDateParam);
      endDate = parseISO(endDateParam);
    } else if (period === "week") {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else if (period === "month") {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (period === "year") {
      startDate = subMonths(now, 12);
      endDate = now;
    } else {
      // semester (default)
      startDate = subMonths(now, 6);
      endDate = now;
    }

    // Fetch all grades in period
    const grades = await prisma.grade.findMany({
      where: {
        studentId: studentIdParam,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (grades.length === 0) {
      return NextResponse.json({
        period: {
          type: period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        overview: {
          totalGrades: 0,
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          trend: "stable" as const,
          trendPercentage: 0,
        },
        timeline: [],
        movingAverages: [],
        subjectTrends: [],
        categoryPerformance: [],
        distribution: [],
        predictions: [],
        alerts: [],
      });
    }

    // Convert to timeline data
    const timeline: GradeTrendData[] = grades.map((g) => ({
      date: format(g.createdAt, "yyyy-MM-dd"),
      grade: parseFloat(g.grade) || 0,
      subject: g.subject.name,
      category: g.category,
    }));

    // Calculate overview
    const gradeValues = timeline.map((t) => t.grade);
    const averageGrade =
      gradeValues.reduce((sum, g) => sum + g, 0) / gradeValues.length;
    const highestGrade = Math.max(...gradeValues);
    const lowestGrade = Math.min(...gradeValues);

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(timeline.length / 2);
    const firstHalf = timeline.slice(0, midPoint);
    const secondHalf = timeline.slice(midPoint);

    const firstAvg = firstHalf.length
      ? firstHalf.reduce((sum, t) => sum + t.grade, 0) / firstHalf.length
      : 0;
    const secondAvg = secondHalf.length
      ? secondHalf.reduce((sum, t) => sum + t.grade, 0) / secondHalf.length
      : 0;

    const trendPercentage = calculatePercentageChange(secondAvg, firstAvg);
    const overallTrend = detectTrend(timeline);

    // Calculate moving averages
    const movingAverages = calculateMovingAverage(timeline);

    // Calculate subject trends
    const subjectMap = new Map<
      string,
      {
        subjectId: string;
        subjectName: string;
        grades: GradeTrendData[];
      }
    >();

    for (const grade of grades) {
      if (!subjectMap.has(grade.subjectId)) {
        subjectMap.set(grade.subjectId, {
          subjectId: grade.subjectId,
          subjectName: grade.subject.name,
          grades: [],
        });
      }
      const subj = subjectMap.get(grade.subjectId);
      if (subj) {
        subj.grades.push({
          date: format(grade.createdAt, "yyyy-MM-dd"),
          grade: parseFloat(grade.grade) || 0,
          subject: grade.subject.name,
          category: grade.category,
        });
      }
    }

    const subjectTrends: SubjectTrend[] = Array.from(
      subjectMap.values()
    ).map((subject) => {
      const subjectGradeValues = subject.grades.map((g) => g.grade);
      const currentAverage =
        subjectGradeValues.reduce((sum, g) => sum + g, 0) /
        subjectGradeValues.length;

      // Compare first half vs second half
      const mid = Math.floor(subject.grades.length / 2);
      const first = subject.grades.slice(0, mid);

      const previousAverage = first.length
        ? first.reduce((sum, g) => sum + g.grade, 0) / first.length
        : currentAverage;

      const percentageChange = calculatePercentageChange(
        currentAverage,
        previousAverage
      );
      const trend = detectTrend(subject.grades);

      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        currentAverage: parseFloat(currentAverage.toFixed(2)),
        previousAverage: parseFloat(previousAverage.toFixed(2)),
        trend,
        percentageChange: parseFloat(percentageChange.toFixed(2)),
        grades: subject.grades,
      };
    });

    // Calculate category performance
    const categoryMap = new Map<
      string,
      { grades: number[]; previousGrades: number[] }
    >();

    for (const grade of grades) {
      if (!categoryMap.has(grade.category)) {
        categoryMap.set(grade.category, {
          grades: [],
          previousGrades: [],
        });
      }
      const cat = categoryMap.get(grade.category);
      if (cat) {
        const gradeValue = parseFloat(grade.grade) || 0;
        cat.grades.push(gradeValue);

        // Determine if grade is in first or second half
        const gradeIndex = grades.indexOf(grade);
        if (gradeIndex < midPoint) {
          cat.previousGrades.push(gradeValue);
        }
      }
    }

    const categoryPerformance: CategoryPerformance[] = Array.from(
      categoryMap.entries()
    ).map(([category, data]) => {
      const average =
        data.grades.reduce((sum, g) => sum + g, 0) / data.grades.length;
      const previousAverage = data.previousGrades.length
        ? data.previousGrades.reduce((sum, g) => sum + g, 0) /
          data.previousGrades.length
        : average;

      let trend: "up" | "down" | "stable" = "stable";
      const change = average - previousAverage;
      if (change > 0.2) trend = "up";
      else if (change < -0.2) trend = "down";

      return {
        category,
        count: data.grades.length,
        average: parseFloat(average.toFixed(2)),
        trend,
      };
    });

    // Calculate distribution
    const distributionMap = new Map<number, number>();
    for (const value of gradeValues) {
      const rounded = Math.round(value);
      distributionMap.set(rounded, (distributionMap.get(rounded) || 0) + 1);
    }

    const distribution: GradeDistribution[] = [1, 2, 3, 4, 5].map(
      (grade) => {
        const count = distributionMap.get(grade) || 0;
        return {
          grade,
          count,
          percentage: parseFloat(
            ((count / gradeValues.length) * 100).toFixed(1)
          ),
        };
      }
    );

    // Generate predictions
    const predictions = generatePredictions(subjectTrends);

    // Generate alerts
    const alerts = generateAlerts(subjectTrends, {
      totalGrades: grades.length,
      averageGrade: parseFloat(averageGrade.toFixed(2)),
      highestGrade,
      lowestGrade,
      trend: overallTrend,
      trendPercentage: parseFloat(trendPercentage.toFixed(2)),
    });

    const result: GradeAnalytics = {
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      overview: {
        totalGrades: grades.length,
        averageGrade: parseFloat(averageGrade.toFixed(2)),
        highestGrade,
        lowestGrade,
        trend: overallTrend,
        trendPercentage: parseFloat(trendPercentage.toFixed(2)),
      },
      timeline,
      movingAverages,
      subjectTrends,
      categoryPerformance,
      distribution,
      predictions,
      alerts,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching grade analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
