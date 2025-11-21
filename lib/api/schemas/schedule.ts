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

// Time format HH:MM
const timeFormat = z
  .string()
  .regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Vreme mora biti u formatu HH:MM",
  );

// Create schedule entry schema - with sanitization
export const CreateScheduleSchema = z.object({
  subjectId: z.string().cuid().optional(),
  dayOfWeek: DayOfWeek,
  startTime: timeFormat,
  endTime: timeFormat,
  room: z
    .string()
    .max(100, "Učionica može biti najviše 100 karaktera")
    .transform(sanitizePlainText)
    .optional(),
  notes: z
    .string()
    .max(1000, "Napomene mogu biti najviše 1000 karaktera")
    .transform(sanitizeRichText)
    .optional(),
  isAWeek: z.boolean().default(true),
  isBWeek: z.boolean().default(true),
  isCustomEvent: z.boolean().default(false),
  customTitle: z.string().max(255).optional(),
  customColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  customDate: z.string().datetime().optional().or(z.date().optional()),
}).refine((data) => {
  if (data.isCustomEvent) {
    return !!data.customTitle;
  }
  return !!data.subjectId;
}, {
  message: "Morate izabrati predmet ili uneti naziv događaja",
  path: ["subjectId"],
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
  sortBy: z.enum(["dayOfWeek", "startTime", "subject"]).default("dayOfWeek"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryScheduleInput = z.infer<typeof QueryScheduleSchema>;

// Response schema
export const ScheduleResponseSchema = z.object({
  id: z.string().cuid(),
  subject: z.object({
    id: z.string().cuid(),
    name: z.string(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }).optional().nullable(),
  dayOfWeek: DayOfWeek,
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().nullable(),
  notes: z.string().nullable(),
  isAWeek: z.boolean(),
  isBWeek: z.boolean(),
  isCustomEvent: z.boolean(),
  customTitle: z.string().nullable(),
  customColor: z.string().nullable(),
  customDate: z.date().nullable(),
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
