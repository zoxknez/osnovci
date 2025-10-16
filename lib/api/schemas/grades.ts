import { z } from "zod";

// Grade type enum (marking scale 1-5)
export const GradeValue = z.enum(["1", "2", "3", "4", "5"]);
export type GradeValue = z.infer<typeof GradeValue>;

// Grade category
export const GradeCategory = z.enum([
  "CLASSWORK",
  "HOMEWORK",
  "TEST",
  "QUIZ",
  "PARTICIPATION",
  "PROJECT",
  "EXAM",
  "OTHER",
]);
export type GradeCategory = z.infer<typeof GradeCategory>;

// Period
export const Period = z.enum(["MONTH", "SEMESTER", "YEAR"]);
export type Period = z.infer<typeof Period>;

// Create grade schema (za nastavnike)
export const CreateGradeSchema = z.object({
  subjectId: z.string().uuid("Predmet je obavezan"),
  grade: GradeValue,
  category: GradeCategory,
  description: z
    .string()
    .max(500, "Opis može biti najviše 500 karaktera")
    .optional(),
  date: z.string().datetime("Datum mora biti validan").optional(),
  weight: z.number().min(1).max(5).default(1),
});

export type CreateGradeInput = z.infer<typeof CreateGradeSchema>;

// Query grades schema
export const QueryGradesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  subjectId: z.string().uuid().optional(),
  category: GradeCategory.optional(),
  period: Period.optional(),
  sortBy: z.enum(["date", "subject", "grade"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type QueryGradesInput = z.infer<typeof QueryGradesSchema>;

// Grade response schema
export const GradeResponseSchema = z.object({
  id: z.string().uuid(),
  subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string().optional(),
  }),
  grade: GradeValue,
  category: GradeCategory,
  description: z.string().optional(),
  date: z.date(),
  weight: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GradeResponse = z.infer<typeof GradeResponseSchema>;

// Grade statistics
export const GradeStatsSchema = z.object({
  average: z.number().min(1).max(5),
  total: z.number().int(),
  byCategory: z.record(z.string(), z.number()),
  bySubject: z.array(
    z.object({
      subject: z.string(),
      average: z.number(),
      count: z.number(),
    }),
  ),
});

export type GradeStats = z.infer<typeof GradeStatsSchema>;

// Paginated response
export const PaginatedGradesSchema = z.object({
  data: z.array(GradeResponseSchema),
  stats: GradeStatsSchema,
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
});

export type PaginatedGrades = z.infer<typeof PaginatedGradesSchema>;
