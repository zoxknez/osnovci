/**
 * CALENDAR FEATURES - MULTI-VIEW & DRAG-DROP
 * Advanced calendar with day/week/month/agenda views and drag-drop scheduling
 */

import { prisma } from "@/lib/db/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format, isSameDay } from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: "CLASS" | "HOMEWORK" | "TEST" | "EXTRACURRICULAR" | "CUSTOM";
  color?: string;
  isAllDay: boolean;
  subjectId?: string;
  subjectName?: string;
  homeworkId?: string;
  room?: string;
  notes?: string;
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

// ============================================
// EVENT AGGREGATION
// ============================================

/**
 * Get all events for a student in date range
 */
export async function getCalendarEvents(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // Get schedule entries (classes)
  const scheduleEntries = await prisma.scheduleEntry.findMany({
    where: { studentId },
    include: { subject: true },
  });

  // Get homework
  const homework = await prisma.homework.findMany({
    where: {
      studentId,
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: "SUBMITTED" },
    },
    include: { subject: true },
  });

  // Get tests
  const tests = await prisma.grade.findMany({
    where: {
      studentId,
      category: "Kontrolni", // Test category
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { subject: true },
  });

  // Convert schedule entries to events
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = format(currentDate, "EEEE").toUpperCase();
    
    const dayEntries = scheduleEntries.filter(
      (entry) => entry.dayOfWeek === dayOfWeek
    );

    for (const entry of dayEntries) {
      // Skip entries without subject (custom events)
      if (!entry.subject) continue;

      const [startHour = 0, startMinute = 0] = entry.startTime.split(":").map(Number);
      const [endHour = 0, endMinute = 0] = entry.endTime.split(":").map(Number);

      const startTime = new Date(currentDate);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(endHour, endMinute, 0, 0);

      events.push({
        id: `schedule-${entry.id}-${format(currentDate, "yyyy-MM-dd")}`,
        title: entry.subject.name,
        startTime,
        endTime,
        type: "CLASS",
        color: getSubjectColor(entry.subject.name),
        isAllDay: false,
        ...(entry.subjectId && { subjectId: entry.subjectId }),
        subjectName: entry.subject.name,
        ...(entry.room && { room: entry.room }),
        ...(entry.notes && { notes: entry.notes }),
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  // Convert homework to events
  for (const hw of homework) {
    const dueTime = new Date(hw.dueDate);
    dueTime.setHours(23, 59, 0, 0);

    events.push({
      id: `homework-${hw.id}`,
      title: `📝 ${hw.title}`,
      ...(hw.description && { description: hw.description }),
      startTime: new Date(hw.dueDate),
      endTime: dueTime,
      type: "HOMEWORK",
      color: getPriorityColor(hw.priority),
      isAllDay: true,
      subjectId: hw.subjectId,
      subjectName: hw.subject.name,
      homeworkId: hw.id,
    });
  }

  // Convert tests to events
  for (const test of tests) {
    events.push({
      id: `test-${test.id}`,
      title: `📊 ${test.subject.name} - ${test.category}`,
      startTime: test.createdAt,
      endTime: test.createdAt,
      type: "TEST",
      color: "#EF4444",
      isAllDay: true,
      subjectId: test.subjectId,
      subjectName: test.subject.name,
    });
  }

  return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

// ============================================
// VIEW GENERATORS
// ============================================

/**
 * Generate day view data
 */
export async function getDayView(
  studentId: string,
  date: Date
): Promise<{
  date: Date;
  events: CalendarEvent[];
  timeSlots: Array<{
    hour: number;
    events: CalendarEvent[];
  }>;
}> {
  const events = await getCalendarEvents(
    studentId,
    startOfDay(date),
    endOfDay(date)
  );

  // Group events by hour
  const timeSlots: Array<{ hour: number; events: CalendarEvent[] }> = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const hourEvents = events.filter((event) => {
      if (event.isAllDay) return hour === 8; // Show all-day events at 8 AM
      const eventHour = event.startTime.getHours();
      return eventHour === hour;
    });

    timeSlots.push({ hour, events: hourEvents });
  }

  return { date, events, timeSlots };
}

/**
 * Generate week view data
 */
export async function getWeekView(
  studentId: string,
  date: Date
): Promise<{
  weekStart: Date;
  weekEnd: Date;
  days: Array<{
    date: Date;
    events: CalendarEvent[];
  }>;
}> {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  const events = await getCalendarEvents(studentId, weekStart, weekEnd);

  const days: Array<{ date: Date; events: CalendarEvent[] }> = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(weekStart, i);
    const dayEvents = events.filter((event) =>
      isSameDay(event.startTime, dayDate)
    );

    days.push({ date: dayDate, events: dayEvents });
  }

  return { weekStart, weekEnd, days };
}

/**
 * Generate month view data
 */
export async function getMonthView(
  studentId: string,
  date: Date
): Promise<{
  monthStart: Date;
  monthEnd: Date;
  weeks: Array<CalendarDay[]>;
}> {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // Get first day of calendar (might be from previous month)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Get last day of calendar (might be from next month)
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const events = await getCalendarEvents(studentId, calendarStart, calendarEnd);

  const weeks: Array<CalendarDay[]> = [];
  let currentWeek: CalendarDay[] = [];

  let currentDate = new Date(calendarStart);
  while (currentDate <= calendarEnd) {
    const dayEvents = events.filter((event) =>
      isSameDay(event.startTime, currentDate)
    );

    currentWeek.push({
      date: new Date(currentDate),
      isToday: isSameDay(currentDate, new Date()),
      isCurrentMonth:
        currentDate.getMonth() === date.getMonth() &&
        currentDate.getFullYear() === date.getFullYear(),
      events: dayEvents,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate = addDays(currentDate, 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return { monthStart, monthEnd, weeks };
}

/**
 * Generate agenda view (list of upcoming events)
 */
export async function getAgendaView(
  studentId: string,
  days: number = 7
): Promise<
  Array<{
    date: Date;
    events: CalendarEvent[];
  }>
> {
  const startDate = startOfDay(new Date());
  const endDate = addDays(startDate, days);

  const events = await getCalendarEvents(studentId, startDate, endDate);

  const agenda: Array<{ date: Date; events: CalendarEvent[] }> = [];

  for (let i = 0; i < days; i++) {
    const dayDate = addDays(startDate, i);
    const dayEvents = events.filter((event) =>
      isSameDay(event.startTime, dayDate)
    );

    agenda.push({ date: dayDate, events: dayEvents });
  }

  return agenda;
}

// ============================================
// DRAG & DROP OPERATIONS
// ============================================

/**
 * Reschedule homework via drag-drop
 */
export async function rescheduleHomework(
  homeworkId: string,
  newDueDate: Date
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.homework.update({
      where: { id: homeworkId },
      data: { dueDate: newDueDate },
    });

    return { success: true, message: "Zadatak pomeren" };
  } catch (error) {
    return { success: false, message: "Greška pri pomeranju zadatka" };
  }
}

/**
 * Create custom calendar event
 */
export async function createCustomEvent(
  studentId: string,
  data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    isAllDay?: boolean;
    color?: string;
  }
): Promise<{ id: string; title: string }> {
  // Store custom events in ScheduleEntry table with a special marker
  const event = await prisma.scheduleEntry.create({
    data: {
      studentId,
      customTitle: data.title,
      dayOfWeek: "MONDAY", // Will use customDate instead
      startTime: data.startTime.toTimeString().slice(0, 5), // "HH:mm"
      endTime: data.endTime.toTimeString().slice(0, 5),
      isCustomEvent: true,
      customDate: data.startTime,
      ...(data.color && { customColor: data.color }),
      ...(data.description && { notes: data.description }),
    },
  });

  return { id: event.id, title: event.customTitle || "" };
}

/**
 * Update event via drag-drop
 */
export async function updateEventTime(
  eventId: string,
  eventType: string,
  newStartTime: Date,
  newEndTime: Date
): Promise<{ success: boolean; message: string }> {
  try {
    if (eventType === "homework") {
      await prisma.homework.update({
        where: { id: eventId.replace("homework-", "") },
        data: { dueDate: newStartTime },
      });
    } else if (eventType === "schedule") {
      const scheduleId = eventId.replace("schedule-", "").split("-")[0] as string;
      await prisma.scheduleEntry.update({
        where: { id: scheduleId },
        data: {
          customDate: newStartTime,
          startTime: newStartTime.toTimeString().slice(0, 5),
          endTime: newEndTime.toTimeString().slice(0, 5),
        },
      });
    }

    return { success: true, message: "Događaj ažuriran" };
  } catch (error) {
    return { success: false, message: "Greška pri ažuriranju događaja" };
  }
}

/**
 * Delete custom event
 */
export async function deleteCustomEvent(
  eventId: string
): Promise<{ success: boolean }> {
  try {
    await prisma.scheduleEntry.delete({
      where: { id: eventId, isCustomEvent: true },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ============================================
// CONFLICT DETECTION
// ============================================

/**
 * Check for scheduling conflicts
 */
export async function checkConflicts(
  studentId: string,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): Promise<{
  hasConflict: boolean;
  conflicts: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
  }>;
}> {
  const events = await getCalendarEvents(
    studentId,
    startOfDay(startTime),
    endOfDay(startTime)
  );

  const conflicts = events.filter((event) => {
    if (excludeEventId && event.id === excludeEventId) return false;
    if (event.isAllDay) return false;

    const eventStart = event.startTime.getTime();
    const eventEnd = event.endTime.getTime();
    const newStart = startTime.getTime();
    const newEnd = endTime.getTime();

    // Check overlap
    return (
      (newStart >= eventStart && newStart < eventEnd) ||
      (newEnd > eventStart && newEnd <= eventEnd) ||
      (newStart <= eventStart && newEnd >= eventEnd)
    );
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts.map((c) => ({
      id: c.id,
      title: c.title,
      startTime: c.startTime,
      endTime: c.endTime,
    })),
  };
}

/**
 * Get free time slots for a day
 */
export async function getFreeTimeSlots(
  studentId: string,
  date: Date,
  slotDuration: number = 60 // minutes
): Promise<
  Array<{
    startTime: Date;
    endTime: Date;
    duration: number;
  }>
> {
  const dayEvents = await getCalendarEvents(
    studentId,
    startOfDay(date),
    endOfDay(date)
  );

  // Define working hours (7 AM - 10 PM)
  const workingStart = new Date(date);
  workingStart.setHours(7, 0, 0, 0);

  const workingEnd = new Date(date);
  workingEnd.setHours(22, 0, 0, 0);

  const busySlots = dayEvents
    .filter((e) => !e.isAllDay)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const freeSlots: Array<{
    startTime: Date;
    endTime: Date;
    duration: number;
  }> = [];

  let currentTime = new Date(workingStart);

  for (const event of busySlots) {
    if (currentTime < event.startTime) {
      const duration = (event.startTime.getTime() - currentTime.getTime()) / (1000 * 60);
      
      if (duration >= slotDuration) {
        freeSlots.push({
          startTime: new Date(currentTime),
          endTime: new Date(event.startTime),
          duration: Math.floor(duration),
        });
      }
    }

    if (event.endTime > currentTime) {
      currentTime = new Date(event.endTime);
    }
  }

  // Check for free time after last event
  if (currentTime < workingEnd) {
    const duration = (workingEnd.getTime() - currentTime.getTime()) / (1000 * 60);
    
    if (duration >= slotDuration) {
      freeSlots.push({
        startTime: new Date(currentTime),
        endTime: new Date(workingEnd),
        duration: Math.floor(duration),
      });
    }
  }

  return freeSlots;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSubjectColor(subjectName: string): string {
  const colors: Record<string, string> = {
    matematika: "#3B82F6",
    srpski: "#EF4444",
    engleski: "#10B981",
    fizika: "#8B5CF6",
    hemija: "#F59E0B",
    biologija: "#06B6D4",
    istorija: "#EC4899",
    geografija: "#84CC16",
    fizičko: "#F97316",
    muzičko: "#A855F7",
    likovno: "#14B8A6",
  };

  const normalized = subjectName.toLowerCase();
  for (const [key, color] of Object.entries(colors)) {
    if (normalized.includes(key)) return color;
  }

  return "#6B7280"; // Default gray
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "#EF4444";
    case "NORMAL":
      return "#3B82F6";
    case "LOW":
      return "#10B981";
    default:
      return "#6B7280";
  }
}

/**
 * Export calendar to iCal format
 */
export async function exportToICalendar(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const events = await getCalendarEvents(studentId, startDate, endDate);

  let ical = "BEGIN:VCALENDAR\r\n";
  ical += "VERSION:2.0\r\n";
  ical += "PRODID:-//Osnovci//Calendar//EN\r\n";
  ical += "CALSCALE:GREGORIAN\r\n";

  for (const event of events) {
    ical += "BEGIN:VEVENT\r\n";
    ical += `UID:${event.id}@osnovci.app\r\n`;
    ical += `DTSTAMP:${formatICalDate(new Date())}\r\n`;
    ical += `DTSTART:${formatICalDate(event.startTime)}\r\n`;
    ical += `DTEND:${formatICalDate(event.endTime)}\r\n`;
    ical += `SUMMARY:${event.title}\r\n`;
    
    if (event.description) {
      ical += `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}\r\n`;
    }
    
    if (event.room) {
      ical += `LOCATION:${event.room}\r\n`;
    }

    ical += "END:VEVENT\r\n";
  }

  ical += "END:VCALENDAR\r\n";

  return ical;
}

function formatICalDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+/, "");
}
