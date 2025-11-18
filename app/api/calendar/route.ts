import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { log } from "@/lib/logger";
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

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

// GET query parameters schema
const getCalendarSchema = z.object({
  studentId: z.string().cuid(),
  view: z.enum(["day", "week", "month", "agenda"]).default("week"),
  date: z.string().optional(), // ISO date string
  agendaDays: z.string().optional().transform(val => val ? parseInt(val, 10) : 7),
});

// POST action schemas (discriminated union)
const createCustomEventSchema = z.object({
  action: z.literal("create_custom_event"),
  studentId: z.string().cuid(),
  title: z.string().min(1).max(100),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // "08:00"
  endTime: z.string().regex(/^\d{2}:\d{2}$/), // "08:45"
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), // "#3B82F6"
  notes: z.string().optional(),
  specificDate: z.string().optional(), // ISO date for one-time events
});

const rescheduleHomeworkSchema = z.object({
  action: z.literal("reschedule_homework"),
  homeworkId: z.string().cuid(),
  newDueDate: z.string(), // ISO date
});

const updateEventTimeSchema = z.object({
  action: z.literal("update_event_time"),
  eventId: z.string().cuid(),
  eventType: z.enum(["homework", "schedule"]),
  newStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  newEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  newDate: z.string().optional(), // ISO date for moving to different day
});

const deleteCustomEventSchema = z.object({
  action: z.literal("delete_custom_event"),
  eventId: z.string().cuid(),
});

const checkConflictsSchema = z.object({
  action: z.literal("check_conflicts"),
  studentId: z.string().cuid(),
  startTime: z.string(), // ISO datetime
  endTime: z.string(), // ISO datetime
});

const getFreeTimeSlotsSchema = z.object({
  action: z.literal("get_free_time_slots"),
  studentId: z.string().cuid(),
  date: z.string(), // ISO date
  minDuration: z.number().min(15).max(240).optional(), // minutes
});

const exportCalendarSchema = z.object({
  action: z.literal("export_calendar"),
  studentId: z.string().cuid(),
  startDate: z.string(), // ISO date
  endDate: z.string(), // ISO date
});

const calendarActionSchema = z.discriminatedUnion("action", [
  createCustomEventSchema,
  rescheduleHomeworkSchema,
  updateEventTimeSchema,
  deleteCustomEventSchema,
  checkConflictsSchema,
  getFreeTimeSlotsSchema,
  exportCalendarSchema,
]);

// ===========================================
// GET ENDPOINT - Retrieve calendar data
// ===========================================

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = getCalendarSchema.parse({
      studentId: searchParams.get("studentId"),
      view: searchParams.get("view"),
      date: searchParams.get("date") || undefined,
      agendaDays: searchParams.get("agendaDays") || undefined,
    });

    const date = params.date ? new Date(params.date) : new Date();

    log.info("Calendar view requested", {
      userId: session.user.id,
      studentId: params.studentId,
      view: params.view,
      date: date.toISOString(),
    });

    // Return appropriate view
    switch (params.view) {
      case "day":
        const dayView = await getDayView(params.studentId, date);
        return NextResponse.json(dayView);

      case "week":
        const weekView = await getWeekView(params.studentId, date);
        return NextResponse.json(weekView);

      case "month":
        const monthView = await getMonthView(params.studentId, date);
        return NextResponse.json(monthView);

      case "agenda":
        const agendaView = await getAgendaView(
          params.studentId,
          params.agendaDays
        );
        return NextResponse.json(agendaView);

      default:
        return NextResponse.json(
          { error: "Invalid view type" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn("Calendar GET validation error", { issues: error.issues });
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }

    log.error("Calendar GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ===========================================
// POST ENDPOINT - Calendar actions
// ===========================================

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = calendarActionSchema.parse(body);

    log.info("Calendar action requested", {
      userId: session.user.id,
      action: data.action,
    });

    // Handle different actions
    switch (data.action) {
      case "create_custom_event": {
        // Parse time strings into full Date objects
        const baseDate = data.specificDate ? new Date(data.specificDate) : new Date();
        const [startHour, startMinute] = data.startTime.split(':').map(Number);
        const [endHour, endMinute] = data.endTime.split(':').map(Number);
        
        if (startHour === undefined || startMinute === undefined || endHour === undefined || endMinute === undefined) {
          return NextResponse.json({ error: "Invalid time format" }, { status: 400 });
        }
        
        const startTime = new Date(baseDate);
        startTime.setHours(startHour, startMinute, 0, 0);
        
        const endTime = new Date(baseDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        const event = await createCustomEvent(data.studentId, {
          title: data.title,
          ...(data.notes && { description: data.notes }),
          startTime,
          endTime,
          ...(data.color && { color: data.color }),
        });

        log.info("Custom event created", {
          userId: session.user.id,
          eventId: event.id,
          title: data.title,
        });

        return NextResponse.json({ success: true, event });
      }

      case "reschedule_homework": {
        const homework = await rescheduleHomework(
          data.homeworkId,
          new Date(data.newDueDate)
        );

        log.info("Homework rescheduled", {
          userId: session.user.id,
          homeworkId: data.homeworkId,
          newDueDate: data.newDueDate,
        });

        return NextResponse.json({ success: true, homework });
      }

      case "update_event_time": {
        // Parse time strings into full Date objects
        const baseDate = data.newDate ? new Date(data.newDate) : new Date();
        const [startHour, startMinute] = data.newStartTime.split(':').map(Number);
        const [endHour, endMinute] = data.newEndTime.split(':').map(Number);
        
        if (startHour === undefined || startMinute === undefined || endHour === undefined || endMinute === undefined) {
          return NextResponse.json({ error: "Invalid time format" }, { status: 400 });
        }
        
        const startTime = new Date(baseDate);
        startTime.setHours(startHour, startMinute, 0, 0);
        
        const endTime = new Date(baseDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        const event = await updateEventTime(
          data.eventId,
          data.eventType,
          startTime,
          endTime
        );

        log.info("Event time updated", {
          userId: session.user.id,
          eventId: data.eventId,
          eventType: data.eventType,
        });

        return NextResponse.json({ success: true, event });
      }

      case "delete_custom_event": {
        await deleteCustomEvent(data.eventId);

        log.info("Custom event deleted", {
          userId: session.user.id,
          eventId: data.eventId,
        });

        return NextResponse.json({ success: true });
      }

      case "check_conflicts": {
        const result = await checkConflicts(
          data.studentId,
          new Date(data.startTime),
          new Date(data.endTime)
        );

        return NextResponse.json(result);
      }

      case "get_free_time_slots": {
        const slots = await getFreeTimeSlots(
          data.studentId,
          new Date(data.date),
          data.minDuration
        );

        return NextResponse.json({ freeSlots: slots });
      }

      case "export_calendar": {
        const icalData = await exportToICalendar(
          data.studentId,
          new Date(data.startDate),
          new Date(data.endDate)
        );

        log.info("Calendar exported", {
          userId: session.user.id,
          studentId: data.studentId,
          startDate: data.startDate,
          endDate: data.endDate,
        });

        // Return as downloadable file
        return new Response(icalData, {
          headers: {
            "Content-Type": "text/calendar",
            "Content-Disposition": 'attachment; filename="calendar.ics"',
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn("Calendar POST validation error", { issues: error.issues });
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }

    log.error("Calendar POST error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
