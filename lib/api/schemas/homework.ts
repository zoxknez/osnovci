import { z } from "zod";

// Homework status enum
export const HomeworkStatus = z.enum([
  "ASSIGNED",
  "IN_PROGRESS",
  "DONE",
  "SUBMITTED",
]);
export type HomeworkStatus = z.infer<typeof HomeworkStatus>;

// Homework priority enum
export const HomeworkPriority = z.enum(["NORMAL", "IMPORTANT", "URGENT"]);
export type HomeworkPriority = z.infer<typeof HomeworkPriority>;

// Create homework schema
export const CreateHomeworkSchema = z.object({
  title: z
    .string()
    .min(3, "Naslov mora biti najmanje 3 karaktera")
    .max(255, "Naslov može biti najviše 255 karaktera"),
  description: z
    .string()
    .max(2000, "Opis može biti najviše 2000 karaktera")
    .optional(),
  subjectId: z.string().min(1, "Predmet je obavezan"),
  dueDate: z
    .string()
    .datetime("Rok mora biti validan datum i vrijeme")
    .or(z.date()),
  priority: HomeworkPriority.default("NORMAL"),
  status: HomeworkStatus.default("ASSIGNED"),
});

export type CreateHomeworkInput = z.infer<typeof CreateHomeworkSchema>;

// Update homework schema
export const UpdateHomeworkSchema = CreateHomeworkSchema.partial();
export type UpdateHomeworkInput = z.infer<typeof UpdateHomeworkSchema>;

// Query homework schema (za filtriranje i paginaciju)
export const QueryHomeworkSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: HomeworkStatus.optional(),
  priority: HomeworkPriority.optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("dueDate"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryHomeworkInput = z.infer<typeof QueryHomeworkSchema>;

// Response schema
export const HomeworkResponseSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  description: z.string().optional(),
  subject: z.object({
    id: z.string().cuid(),
    name: z.string(),
    color: z.string().optional(),
  }),
  dueDate: z.date(),
  priority: HomeworkPriority,
  status: HomeworkStatus,
  attachmentsCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HomeworkResponse = z.infer<typeof HomeworkResponseSchema>;

// Paginated response
export const PaginatedHomeworkSchema = z.object({
  data: z.array(HomeworkResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
});

export type PaginatedHomework = z.infer<typeof PaginatedHomeworkSchema>;
