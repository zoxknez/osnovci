import { z } from "zod";
import { sanitizePlainText, sanitizeRichText } from "@/lib/security/sanitize";

// Days of week enum
export const DayOfWeek = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
export type DayOfWeek = z.infer<typeof DayOfWeek>;

// Schedule entry status
export const ScheduleStatus = z.enum(["SCHEDULED", "CANCELLED", "RESCHEDULED"]);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

// Time format HH:MM
const timeFormat = z
  .string()
  .regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Vrijeme mora biti u formatu HH:MM",
  );

// Create schedule entry schema - with sanitization
export const CreateScheduleSchema = z.object({
  subjectId: z.string().uuid("Predmet je obavezan"),
  dayOfWeek: DayOfWeek,
  startTime: timeFormat,
  endTime: timeFormat,
  classroom: z
    .string()
    .min(1, "Učionica je obavezna")
    .max(100, "Učionica može biti najviše 100 karaktera")
    .transform(sanitizePlainText), // Sanitize classroom name
  teacher: z
    .string()
    .min(1, "Nastavnik je obavezan")
    .max(255, "Nastavnik može biti najviše 255 karaktera")
    .transform(sanitizePlainText) // Sanitize teacher name
    .optional(),
  notes: z
    .string()
    .max(1000, "Napomene mogu biti najviše 1000 karaktera")
    .transform(sanitizeRichText) // Sanitize notes (allow safe HTML)
    .optional(),
  status: ScheduleStatus.default("SCHEDULED"),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

// Update schedule schema
export const UpdateScheduleSchema = CreateScheduleSchema.partial();
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

// Query schedule schema
export const QueryScheduleSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dayOfWeek: DayOfWeek.optional(),
  status: ScheduleStatus.optional(),
  sortBy: z.enum(["dayOfWeek", "startTime", "subject"]).default("dayOfWeek"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryScheduleInput = z.infer<typeof QueryScheduleSchema>;

// Get schedule by date schema
export const GetScheduleByDateSchema = z.object({
  date: z.string().datetime("Datum mora biti validan"),
  includeNotes: z.boolean().default(false),
});

export type GetScheduleByDateInput = z.infer<typeof GetScheduleByDateSchema>;

// Response schema
export const ScheduleResponseSchema = z.object({
  id: z.string().uuid(),
  subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }),
  dayOfWeek: DayOfWeek,
  startTime: z.string(),
  endTime: z.string(),
  classroom: z.string(),
  teacher: z.string().optional(),
  notes: z.string().optional(),
  status: ScheduleStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;

// Paginated response
export const PaginatedScheduleSchema = z.object({
  data: z.array(ScheduleResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
});

export type PaginatedSchedule = z.infer<typeof PaginatedScheduleSchema>;
