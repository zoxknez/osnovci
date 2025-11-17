/**
 * Security Validators
 * Input validation schemas za dodatnu zaštitu od injection napada
 */

import { z } from "zod";

/**
 * ID Validation - samo alphanumeric i underscore/dash
 * Prevents SQL injection attempts
 */
export const idSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, "ID mora sadržati samo alfanumeričke karaktere");

/**
 * Safe Integer - u granicama Number.MAX_SAFE_INTEGER
 */
export const safeIntSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

/**
 * Email Validation - RFC 5322 compliant
 */
export const emailSchema = z
  .string()
  .email("Neispravna email adresa")
  .toLowerCase()
  .max(255)
  .trim();

/**
 * Phone Validation - Serbian format
 * Prihvata: +381XXXXXXXXX ili 06XXXXXXXX
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(\+381|0)[0-9]{8,9}$/,
    "Telefon mora biti u formatu +381XXXXXXXXX ili 06XXXXXXXX",
  )
  .trim();

/**
 * Name Validation - Ime i prezime
 */
export const nameSchema = z
  .string()
  .min(2, "Ime mora imati najmanje 2 karaktera")
  .max(100, "Ime može imati najviše 100 karaktera")
  .regex(
    /^[a-zA-ZčćžšđČĆŽŠĐ\s'-]+$/,
    "Ime može sadržati samo slova, razmake, apostrof i crtu",
  )
  .trim();

/**
 * Password Validation - Minimum security requirements
 */
export const passwordSchema = z
  .string()
  .min(8, "Lozinka mora imati najmanje 8 karaktera")
  .max(128, "Lozinka može imati najviše 128 karaktera")
  .regex(/[a-z]/, "Lozinka mora sadržati bar jedno malo slovo")
  .regex(/[A-Z]/, "Lozinka mora sadržati bar jedno veliko slovo")
  .regex(/[0-9]/, "Lozinka mora sadržati bar jedan broj");

/**
 * Safe String - Basic text validation
 */
export const safeStringSchema = z
  .string()
  .max(10000, "Tekst je predugačak")
  .trim();

/**
 * URL Validation - Only HTTPS in production
 */
export const urlSchema = z
  .string()
  .url("Neispravna URL adresa")
  .refine(
    (url) => {
      if (process.env.NODE_ENV === "production") {
        return url.startsWith("https://");
      }
      return true;
    },
    {
      message: "URL mora biti HTTPS u produkciji",
    },
  );

/**
 * Date String Validation - ISO 8601 format
 */
export const dateStringSchema = z.string().datetime({
  message: "Datum mora biti u ISO 8601 formatu",
});

/**
 * Grade Validation - 1-5
 */
export const gradeSchema = z
  .number()
  .int()
  .min(1, "Ocena mora biti između 1 i 5")
  .max(5, "Ocena mora biti između 1 i 5");

/**
 * Class Validation - 1-8
 */
export const classGradeSchema = z
  .number()
  .int()
  .min(1, "Razred mora biti između 1 i 8")
  .max(8, "Razred mora biti između 1 i 8");

/**
 * File Name Validation - Safe file names only
 */
export const fileNameSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(
    /^[a-zA-Z0-9_\-. ]+$/,
    "Ime fajla može sadržati samo slova, brojeve, razmake, tačke, crtice i donje crtice",
  )
  .refine(
    (name) => {
      // Prevent path traversal
      return (
        !name.includes("..") && !name.includes("/") && !name.includes("\\")
      );
    },
    {
      message: "Ime fajla ne sme sadržati .. ili / ili \\",
    },
  );

/**
 * Pagination Schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, "Limit ne može biti veći od 100")
    .default(20),
});

/**
 * Sort Order Schema
 */
export const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");

/**
 * Validate all IDs in an array
 */
export function validateIds(ids: string[]): string[] {
  return ids.map((id) => idSchema.parse(id));
}

/**
 * Sanitize search query - Remove special characters
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[^\w\sčćžšđČĆŽŠĐ-]/g, "") // Remove special chars except words, spaces, serbian chars
    .trim()
    .slice(0, 200); // Limit length
}
