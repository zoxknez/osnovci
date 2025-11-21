"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import {
  getDayView,
  getWeekView,
  getMonthView,
  getAgendaView,
  rescheduleHomework,
  createCustomEvent,
  updateEventTime,
  deleteCustomEvent,
  checkConflicts,
  getFreeTimeSlots,
  exportToICalendar,
} from "@/lib/calendar/calendar-manager";

// Schemas
const getCalendarSchema = z.object({
  studentId: z.string().cuid(),
  view: z.enum(["day", "week", "month", "agenda"]).default("week"),
  date: z.string().optional(),
  agendaDays: z.number().optional().default(7),
});

const createCustomEventSchema = z.object({
  studentId: z.string().cuid(),
  title: z.string().min(1).max(100),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  notes: z.string().optional(),
  specificDate: z.string().optional(),
});

const rescheduleHomeworkSchema = z.object({
  homeworkId: z.string().cuid(),
  newDueDate: z.string(),
});

const updateEventTimeSchema = z.object({
  eventId: z.string().cuid(),
  eventType: z.enum(["homework", "schedule"]),
  newStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  newEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  newDate: z.string().optional(),
});

const deleteCustomEventSchema = z.object({
  eventId: z.string().cuid(),
});

const checkConflictsSchema = z.object({
  studentId: z.string().cuid(),
  startTime: z.string(),
  endTime: z.string(),
});

const getFreeTimeSlotsSchema = z.object({
  studentId: z.string().cuid(),
  date: z.string(),
  minDuration: z.number().min(15).max(240).optional(),
});

const exportCalendarSchema = z.object({
  studentId: z.string().cuid(),
  startDate: z.string(),
  endDate: z.string(),
});

// Actions

export async function getCalendarViewAction(params: z.infer<typeof getCalendarSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = getCalendarSchema.safeParse(params);
    if (!validated.success) return { success: false, error: "Validation error" };

    const { studentId, view, date: dateStr, agendaDays } = validated.data;
    const date = dateStr ? new Date(dateStr) : new Date();

    let data;
    switch (view) {
      case "day":
        data = await getDayView(studentId, date);
        break;
      case "week":
        data = await getWeekView(studentId, date);
        break;
      case "month":
        data = await getMonthView(studentId, date);
        break;
      case "agenda":
        data = await getAgendaView(studentId, agendaDays);
        break;
    }

    return { success: true, data };
  } catch (error) {
    log.error("getCalendarViewAction error", error);
    return { success: false, error: "Failed to fetch calendar view" };
  }
}

export async function createCustomEventAction(data: z.infer<typeof createCustomEventSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = createCustomEventSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const { studentId, title, notes, color, specificDate, startTime: startTimeStr, endTime: endTimeStr } = validated.data;

    const baseDate = specificDate ? new Date(specificDate) : new Date();
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);
    
    const startTime = new Date(baseDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(baseDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    const event = await createCustomEvent(studentId, {
      title,
      ...(notes && { description: notes }),
      startTime,
      endTime,
      ...(color && { color }),
    });

    revalidatePath("/calendar");
    return { success: true, event };
  } catch (error) {
    log.error("createCustomEventAction error", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function rescheduleHomeworkAction(data: z.infer<typeof rescheduleHomeworkSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = rescheduleHomeworkSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const homework = await rescheduleHomework(
      validated.data.homeworkId,
      new Date(validated.data.newDueDate)
    );

    revalidatePath("/calendar");
    revalidatePath("/dashboard/domaci");
    return { success: true, homework };
  } catch (error) {
    log.error("rescheduleHomeworkAction error", error);
    return { success: false, error: "Failed to reschedule homework" };
  }
}

export async function updateEventTimeAction(data: z.infer<typeof updateEventTimeSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = updateEventTimeSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const { eventId, eventType, newDate, newStartTime, newEndTime } = validated.data;

    const baseDate = newDate ? new Date(newDate) : new Date();
    const [startHour, startMinute] = newStartTime.split(':').map(Number);
    const [endHour, endMinute] = newEndTime.split(':').map(Number);
    
    const startTime = new Date(baseDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(baseDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    const event = await updateEventTime(eventId, eventType, startTime, endTime);

    revalidatePath("/calendar");
    return { success: true, event };
  } catch (error) {
    log.error("updateEventTimeAction error", error);
    return { success: false, error: "Failed to update event time" };
  }
}

export async function deleteCustomEventAction(data: z.infer<typeof deleteCustomEventSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = deleteCustomEventSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    await deleteCustomEvent(validated.data.eventId);

    revalidatePath("/calendar");
    return { success: true };
  } catch (error) {
    log.error("deleteCustomEventAction error", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function checkConflictsAction(data: z.infer<typeof checkConflictsSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = checkConflictsSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const result = await checkConflicts(
      validated.data.studentId,
      new Date(validated.data.startTime),
      new Date(validated.data.endTime)
    );

    return { success: true, ...result };
  } catch (error) {
    log.error("checkConflictsAction error", error);
    return { success: false, error: "Failed to check conflicts" };
  }
}

export async function getFreeTimeSlotsAction(data: z.infer<typeof getFreeTimeSlotsSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = getFreeTimeSlotsSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const slots = await getFreeTimeSlots(
      validated.data.studentId,
      new Date(validated.data.date),
      validated.data.minDuration
    );

    return { success: true, freeSlots: slots };
  } catch (error) {
    log.error("getFreeTimeSlotsAction error", error);
    return { success: false, error: "Failed to get free time slots" };
  }
}

export async function exportCalendarAction(data: z.infer<typeof exportCalendarSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validated = exportCalendarSchema.safeParse(data);
    if (!validated.success) return { success: false, error: "Validation error" };

    const icalData = await exportToICalendar(
      validated.data.studentId,
      new Date(validated.data.startDate),
      new Date(validated.data.endDate)
    );

    return { success: true, icalData };
  } catch (error) {
    log.error("exportCalendarAction error", error);
    return { success: false, error: "Failed to export calendar" };
  }
}
