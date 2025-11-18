/**
 * ADVANCED SCHEDULER - AI-POWERED TIME MANAGEMENT
 * Auto-schedule study sessions, conflict resolution, time blocking
 */

import { prisma } from "@/lib/db/prisma";
import { addMinutes, isWithinInterval, startOfDay, endOfDay, format, isSameDay } from "date-fns";

interface StudySession {
  homeworkId: string;
  title: string;
  subject: string;
  estimatedMinutes: number;
  priority: number;
  dueDate: Date;
}

interface ScheduleSlot {
  start: Date;
  end: Date;
  available: boolean;
  reason?: string;
}

interface ConflictResolution {
  type: "overlap" | "insufficient_time" | "too_close";
  description: string;
  suggestions: string[];
}

/**
 * Auto-schedule study sessions based on homework deadlines and free time
 */
export async function autoScheduleStudySessions(
  studentId: string,
  targetDate: Date
): Promise<{
  scheduled: Array<{
    homeworkId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    duration: number;
  }>;
  conflicts: ConflictResolution[];
  unscheduled: StudySession[];
}> {
  // Get all pending homework
  const homework = await prisma.homework.findMany({
    where: {
      studentId,
      status: { not: "SUBMITTED" },
      dueDate: { gte: targetDate },
    },
    include: {
      subject: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Convert to study sessions with estimated time
  const sessions: StudySession[] = homework.map((hw) => ({
    homeworkId: hw.id,
    title: hw.title,
    subject: hw.subject.name,
    estimatedMinutes: estimateHomeworkDuration(hw.title, hw.description || ""),
    priority: calculatePriority(hw.dueDate, hw.subject.name),
    dueDate: hw.dueDate,
  }));

  // Get existing schedule for the day
  const existingSchedule = await prisma.schedule.findMany({
    where: {
      studentId,
      date: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Generate free time slots
  const freeSlots = generateFreeTimeSlots(existingSchedule, targetDate);

  // Schedule sessions into free slots
  const scheduled: Array<{
    homeworkId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    duration: number;
  }> = [];
  const unscheduled: StudySession[] = [];
  const conflicts: ConflictResolution[] = [];

  for (const session of sessions.sort((a, b) => b.priority - a.priority)) {
    const slot = findBestSlot(freeSlots, session.estimatedMinutes);

    if (slot) {
      scheduled.push({
        homeworkId: session.homeworkId,
        title: session.title,
        startTime: slot.start,
        endTime: addMinutes(slot.start, session.estimatedMinutes),
        duration: session.estimatedMinutes,
      });

      // Remove used time from free slots
      updateFreeSlots(freeSlots, slot.start, session.estimatedMinutes);
    } else {
      unscheduled.push(session);
      conflicts.push({
        type: "insufficient_time",
        description: `Nedovoljno vremena za: ${session.title}`,
        suggestions: [
          "Razmotriti pomeranje na drugi dan",
          "Skratiti vreme drugih aktivnosti",
          "Raditi u kraćim sesijama",
        ],
      });
    }
  }

  return { scheduled, conflicts, unscheduled };
}

/**
 * Estimate homework duration based on title and description
 * Uses simple heuristics (can be replaced with ML model)
 */
function estimateHomeworkDuration(title: string, description: string): number {
  const text = (title + " " + description).toLowerCase();

  // Keywords that indicate longer tasks
  const longTaskKeywords = ["esej", "projekat", "istraživanje", "prezentacija", "analiza"];
  const mediumTaskKeywords = ["zadaci", "vežbe", "čitanje", "pisanje"];
  const shortTaskKeywords = ["ponovi", "nauči", "prepiši", "reši"];

  if (longTaskKeywords.some(k => text.includes(k))) {
    return 90; // 1.5 hours
  } else if (mediumTaskKeywords.some(k => text.includes(k))) {
    return 45; // 45 minutes
  } else if (shortTaskKeywords.some(k => text.includes(k))) {
    return 20; // 20 minutes
  }

  // Default: 30 minutes
  return 30;
}

/**
 * Calculate task priority (0-100)
 * Factors: due date proximity, subject importance
 */
function calculatePriority(dueDate: Date, subjectName: string): number {
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Urgency score (50 points max)
  let urgencyScore = 50;
  if (daysUntilDue <= 1) urgencyScore = 50;
  else if (daysUntilDue <= 2) urgencyScore = 40;
  else if (daysUntilDue <= 3) urgencyScore = 30;
  else if (daysUntilDue <= 7) urgencyScore = 20;
  else urgencyScore = 10;

  // Subject importance (50 points max) - core subjects get higher priority
  const coreSubjects = ["matematika", "srpski", "engleski", "fizika", "hemija"];
  const importanceScore = coreSubjects.some(s => 
    subjectName.toLowerCase().includes(s)
  ) ? 50 : 30;

  return urgencyScore + importanceScore;
}

/**
 * Generate free time slots based on existing schedule
 */
function generateFreeTimeSlots(
  existingSchedule: Array<{ startTime: Date; endTime: Date }>,
  targetDate: Date
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  
  // Study hours: 15:00 - 21:00 (after school)
  const dayStart = new Date(targetDate);
  dayStart.setHours(15, 0, 0, 0);
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(21, 0, 0, 0);

  // Sort existing schedule by start time
  const sorted = existingSchedule.sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  );

  let currentTime = dayStart;

  for (const item of sorted) {
    // Add free slot before this item
    if (item.startTime > currentTime) {
      slots.push({
        start: currentTime,
        end: item.startTime,
        available: true,
      });
    }

    currentTime = item.endTime > currentTime ? item.endTime : currentTime;
  }

  // Add final slot if there's time left
  if (currentTime < dayEnd) {
    slots.push({
      start: currentTime,
      end: dayEnd,
      available: true,
    });
  }

  return slots;
}

/**
 * Find best available slot for a session
 */
function findBestSlot(slots: ScheduleSlot[], durationMinutes: number): ScheduleSlot | null {
  for (const slot of slots) {
    if (!slot.available) continue;

    const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
    
    // Slot must have at least the required duration
    if (slotDuration >= durationMinutes) {
      return slot;
    }
  }

  return null;
}

/**
 * Update free slots after scheduling a session
 */
function updateFreeSlots(slots: ScheduleSlot[], startTime: Date, durationMinutes: number): void {
  const endTime = addMinutes(startTime, durationMinutes);

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    // Check if session overlaps with this slot
    if (
      isWithinInterval(startTime, { start: slot.start, end: slot.end }) ||
      isWithinInterval(endTime, { start: slot.start, end: slot.end })
    ) {
      // Split or mark as unavailable
      if (slot.start < startTime && slot.end > endTime) {
        // Split into two slots
        const newSlot: ScheduleSlot = {
          start: endTime,
          end: slot.end,
          available: true,
        };
        slot.end = startTime;
        slots.splice(i + 1, 0, newSlot);
      } else if (slot.start < startTime) {
        // Trim end
        slot.end = startTime;
      } else if (slot.end > endTime) {
        // Trim start
        slot.start = endTime;
      } else {
        // Completely overlaps
        slot.available = false;
      }
    }
  }
}

/**
 * Detect scheduling conflicts
 */
export async function detectScheduleConflicts(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{
  date: Date;
  conflicts: Array<{
    time: string;
    items: string[];
    resolution: string;
  }>;
}>> {
  const schedule = await prisma.schedule.findMany({
    where: {
      studentId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const conflictsByDay = new Map<string, Array<{
    time: string;
    items: string[];
    resolution: string;
  }>>();

  // Group by day
  const byDay = new Map<string, typeof schedule>();
  schedule.forEach(item => {
    const dayKey = format(item.date, "yyyy-MM-dd");
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, []);
    }
    byDay.get(dayKey)!.push(item);
  });

  // Check for overlaps within each day
  byDay.forEach((items, dayKey) => {
    const sorted = items.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // Check for overlap
      if (current.endTime > next.startTime) {
        if (!conflictsByDay.has(dayKey)) {
          conflictsByDay.set(dayKey, []);
        }

        conflictsByDay.get(dayKey)!.push({
          time: format(current.startTime, "HH:mm"),
          items: [current.title, next.title],
          resolution: "Pomerite jedan od termina za 15-30 minuta kasnije",
        });
      }
    }
  });

  return Array.from(conflictsByDay.entries()).map(([dateStr, conflicts]) => ({
    date: new Date(dateStr),
    conflicts,
  }));
}

/**
 * Generate optimized weekly study plan
 */
export async function generateWeeklyStudyPlan(
  studentId: string,
  weekStart: Date
): Promise<{
  dailyPlans: Array<{
    date: Date;
    totalStudyMinutes: number;
    sessions: Array<{
      time: string;
      duration: number;
      subject: string;
      task: string;
      priority: "high" | "medium" | "low";
    }>;
    workload: "light" | "moderate" | "heavy";
  }>;
  recommendations: string[];
}> {
  const homework = await prisma.homework.findMany({
    where: {
      studentId,
      status: { not: "SUBMITTED" },
      dueDate: { gte: weekStart },
    },
    include: {
      subject: true,
    },
  });

  const dailyPlans: Array<{
    date: Date;
    totalStudyMinutes: number;
    sessions: Array<{
      time: string;
      duration: number;
      subject: string;
      task: string;
      priority: "high" | "medium" | "low";
    }>;
    workload: "light" | "moderate" | "heavy";
  }> = [];

  const recommendations: string[] = [];

  // Distribute homework across the week
  const totalMinutes = homework.reduce((sum, hw) => 
    sum + estimateHomeworkDuration(hw.title, hw.description || ""), 
    0
  );

  const avgDailyMinutes = totalMinutes / 7;

  if (avgDailyMinutes > 120) {
    recommendations.push("⚠️ Opterećenje je veliko ove nedelje. Razmotrite prioritizaciju zadataka.");
  }

  if (avgDailyMinutes < 30) {
    recommendations.push("✅ Lagana nedelja! Dobra prilika za ponavljanje gradiva.");
  }

  // Create daily plans
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + day);

    const dueSoon = homework.filter(hw => 
      isSameDay(hw.dueDate, currentDate) || hw.dueDate < currentDate
    );

    const sessions = dueSoon.map(hw => ({
      time: "15:00",
      duration: estimateHomeworkDuration(hw.title, hw.description || ""),
      subject: hw.subject.name,
      task: hw.title,
      priority: calculatePriority(hw.dueDate, hw.subject.name) > 70 ? "high" : 
                calculatePriority(hw.dueDate, hw.subject.name) > 40 ? "medium" : "low" as "high" | "medium" | "low",
    }));

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    dailyPlans.push({
      date: currentDate,
      totalStudyMinutes: totalMinutes,
      sessions,
      workload: totalMinutes > 90 ? "heavy" : totalMinutes > 45 ? "moderate" : "light",
    });
  }

  return { dailyPlans, recommendations };
}

/**
 * Pomodoro timer recommendations
 */
export function generatePomodoroSchedule(totalMinutes: number): Array<{
  type: "work" | "short_break" | "long_break";
  duration: number;
  startMinute: number;
}> {
  const schedule: Array<{
    type: "work" | "short_break" | "long_break";
    duration: number;
    startMinute: number;
  }> = [];

  let currentMinute = 0;
  let pomodoroCount = 0;

  while (currentMinute < totalMinutes) {
    // Work session (25 minutes)
    schedule.push({
      type: "work",
      duration: 25,
      startMinute: currentMinute,
    });
    currentMinute += 25;
    pomodoroCount++;

    if (currentMinute >= totalMinutes) break;

    // Break (5 min short, 15 min long every 4 pomodoros)
    if (pomodoroCount % 4 === 0) {
      schedule.push({
        type: "long_break",
        duration: 15,
        startMinute: currentMinute,
      });
      currentMinute += 15;
    } else {
      schedule.push({
        type: "short_break",
        duration: 5,
        startMinute: currentMinute,
      });
      currentMinute += 5;
    }
  }

  return schedule;
}
