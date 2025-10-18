import { z } from "zod";
import { sanitizePlainText, sanitizeRichText } from "@/lib/security/sanitize";

// Gender enum
export const Gender = z.enum(["MALE", "FEMALE", "OTHER"]);
export type Gender = z.infer<typeof Gender>;

// Get profile schema
export const GetProfileSchema = z.object({
  studentId: z.string().uuid().optional(),
});

export type GetProfileInput = z.infer<typeof GetProfileSchema>;

// Update profile schema - with sanitization
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Ime mora biti najmanje 2 karaktera")
    .max(255, "Ime može biti najviše 255 karaktera")
    .transform(sanitizePlainText) // Sanitize name
    .optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: Gender.optional(),
  avatar: z.string().url().optional(),
  school: z
    .string()
    .min(1, "Naziv škole je obavezan")
    .max(255, "Naziv škole može biti najviše 255 karaktera")
    .transform(sanitizePlainText) // Sanitize school name
    .optional(),
  grade: z
    .number()
    .int()
    .min(1, "Razred mora biti između 1 i 8")
    .max(8, "Razred mora biti između 1 i 8")
    .optional(),
  bio: z
    .string()
    .max(500, "Opis može biti najviše 500 karaktera")
    .transform(sanitizeRichText) // Sanitize bio (allow safe HTML)
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// Change password schema
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Trenutna šifra je obavezna"),
    newPassword: z
      .string()
      .min(8, "Nova šifra mora biti najmanje 8 karaktera")
      .regex(/[A-Z]/, "Nova šifra mora sadržavati jedno velika slova")
      .regex(/[0-9]/, "Nova šifra mora sadržavati jedan broj")
      .regex(
        /[!@#$%^&*]/,
        "Nova šifra mora sadržavati jedan specijalan karakter",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Šifre se ne poklapaju",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// Profile response schema
export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  dateOfBirth: z.date().optional(),
  gender: Gender.optional(),
  school: z.string().optional(),
  grade: z.number().int().optional(),
  bio: z.string().optional(),
  role: z.enum(["STUDENT", "PARENT", "TEACHER", "ADMIN"]),
  xp: z.number().int().default(0),
  level: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

// Profile statistics
export const ProfileStatsSchema = z.object({
  totalHomework: z.number().int(),
  completedHomework: z.number().int(),
  averageGrade: z.number(),
  totalClasses: z.number().int(),
  attendanceRate: z.number(),
  xpThisMonth: z.number().int(),
  achievements: z.array(z.string()),
});

export type ProfileStats = z.infer<typeof ProfileStatsSchema>;

// Full profile with stats
export const FullProfileSchema = z.object({
  profile: ProfileResponseSchema,
  stats: ProfileStatsSchema,
});

export type FullProfile = z.infer<typeof FullProfileSchema>;
