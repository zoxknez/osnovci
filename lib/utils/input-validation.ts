/**
 * Advanced Input Validation Utilities
 * Modern validation with detailed error messages
 */

import { z } from "zod";

/**
 * Common validation schemas
 */
export const validationSchemas = {
  /**
   * Email validation (RFC 5322 compliant)
   */
  email: z
    .string()
    .min(1, "Email je obavezan")
    .email("Email nije validan")
    .toLowerCase()
    .trim()
    .max(255, "Email je predugačak"),

  /**
   * Phone validation (Serbian format)
   */
  phone: z
    .string()
    .min(1, "Telefon je obavezan")
    .regex(
      /^(\+381|0)[67]\d{7,8}$/,
      "Telefon mora biti u formatu: 06XXXXXXXX ili +3816XXXXXXXX",
    )
    .trim(),

  /**
   * Password validation
   */
  password: z
    .string()
    .min(6, "Lozinka mora imati minimum 6 karaktera")
    .max(128, "Lozinka je predugačka")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Lozinka mora sadržati velika i mala slova i brojeve",
    )
    .optional(),

  /**
   * Simple password (for children)
   */
  simplePassword: z
    .string()
    .min(6, "Lozinka mora imati minimum 6 karaktera")
    .max(128, "Lozinka je predugačka"),

  /**
   * Name validation
   */
  name: z
    .string()
    .min(1, "Ime je obavezno")
    .max(100, "Ime je predugačko")
    .regex(/^[a-zA-ZčćđšžČĆĐŠŽ\s-]+$/, "Ime sme sadržati samo slova"),

  /**
   * Title validation
   */
  title: z
    .string()
    .min(1, "Naslov je obavezan")
    .max(255, "Naslov je predugačak")
    .trim(),

  /**
   * Description validation
   */
  description: z.string().max(5000, "Opis je predugačak").trim().optional(),

  /**
   * URL validation
   */
  url: z.string().url("URL nije validan").max(2048, "URL je predugačak"),

  /**
   * Date validation
   */
  date: z.coerce.date().refine((date) => !isNaN(date.getTime()), {
    message: "Datum nije validan",
  }),

  /**
   * Future date validation
   */
  futureDate: z.coerce.date().refine((date) => date > new Date(), {
    message: "Datum mora biti u budućnosti",
  }),

  /**
   * Past date validation
   */
  pastDate: z.coerce.date().refine((date) => date < new Date(), {
    message: "Datum mora biti u prošlosti",
  }),

  /**
   * Positive number
   */
  positiveNumber: z.coerce
    .number()
    .positive("Broj mora biti pozitivan")
    .int("Broj mora biti ceo broj"),

  /**
   * Grade validation (1-5)
   */
  grade: z.coerce
    .number()
    .min(1, "Ocena mora biti između 1 i 5")
    .max(5, "Ocena mora biti između 1 i 5")
    .int("Ocena mora biti ceo broj"),

  /**
   * School grade validation (1-8)
   */
  schoolGrade: z.coerce
    .number()
    .min(1, "Razred mora biti između 1 i 8")
    .max(8, "Razred mora biti između 1 i 8")
    .int("Razred mora biti ceo broj"),

  /**
   * Age validation (for COPPA compliance)
   */
  age: z.coerce
    .number()
    .min(7, "Morate imati najmanje 7 godina")
    .max(18, "Maksimalna starost je 18 godina")
    .int("Starost mora biti ceo broj"),

  /**
   * File size validation (in bytes)
   */
  fileSize: (maxBytes: number) =>
    z
      .number()
      .max(
        maxBytes,
        `Fajl je prevelik (maksimum ${Math.round(maxBytes / 1024 / 1024)}MB)`,
      ),

  /**
   * MIME type validation
   */
  mimeType: (allowedTypes: string[]) =>
    z
      .string()
      .refine(
        (type) => allowedTypes.includes(type),
        `Tip fajla mora biti jedan od: ${allowedTypes.join(", ")}`,
      ),

  /**
   * CUID validation
   */
  cuid: z.string().regex(/^c[a-z0-9]{24}$/, "ID nije validan"),

  /**
   * UUID validation
   */
  uuid: z.string().uuid("UUID nije validan"),

  /**
   * Color hex validation
   */
  hexColor: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Boja mora biti u hex formatu (#RRGGBB)",
    ),
};

/**
 * Combine multiple validation schemas
 */
export function combineSchemas<T extends z.ZodRawShape>(
  schemas: T,
): z.ZodObject<T> {
  return z.object(schemas);
}

/**
 * Validate with detailed error messages
 */
export function validateWithDetails<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: result.error };
}
