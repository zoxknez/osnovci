/**
 * Validation Utilities
 * Centralizovane validacione funkcije
 */

import { z } from "zod";

/**
 * Email validation
 */
export const emailSchema = z.string().email("Neispravna email adresa");

/**
 * Phone validation (Serbian format)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(\+381|0)[6-9]\d{7,8}$/,
    "Neispravan broj telefona (format: +381601234567 ili 0601234567)",
  );

/**
 * Password validation (min 8 chars, at least one number and letter)
 */
export const passwordSchema = z
  .string()
  .min(8, "Lozinka mora imati najmanje 8 karaktera")
  .regex(/[0-9]/, "Lozinka mora sadržati bar jedan broj")
  .regex(/[a-zA-Z]/, "Lozinka mora sadržati bar jedno slovo");

/**
 * PIN validation (4-6 digits)
 */
export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "PIN mora imati 4-6 cifara");

/**
 * Grade validation (1-8)
 */
export const gradeSchema = z.number().int().min(1).max(8);

/**
 * Date validation (not in future)
 */
export function dateNotFutureSchema(message?: string) {
  return z
    .date()
    .refine((date) => date <= new Date(), {
      message: message || "Datum ne može biti u budućnosti",
    });
}

/**
 * Date validation (not in past)
 */
export function dateNotPastSchema(message?: string) {
  return z
    .date()
    .refine((date) => date >= new Date(), {
      message: message || "Datum ne može biti u prošlosti",
    });
}

/**
 * URL validation
 */
export const urlSchema = z.string().url("Neispravan URL");

/**
 * File size validation (max size in bytes)
 */
export function fileSizeSchema(maxSizeBytes: number, message?: string) {
  return z
    .instanceof(File)
    .refine((file) => file.size <= maxSizeBytes, {
      message:
        message || `Fajl ne sme biti veći od ${maxSizeBytes / 1024 / 1024}MB`,
    });
}

/**
 * File type validation
 */
export function fileTypeSchema(allowedTypes: string[], message?: string) {
  return z
    .instanceof(File)
    .refine((file) => allowedTypes.includes(file.type), {
      message:
        message || `Dozvoljeni tipovi fajlova: ${allowedTypes.join(", ")}`,
    });
}
