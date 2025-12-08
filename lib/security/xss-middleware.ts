/**
 * XSS Protection Middleware
 *
 * Auto-sanitizes request body fields to prevent XSS attacks
 * Apply this middleware to ALL API routes that accept user-generated content
 */

import type { NextRequest } from "next/server";
import { log } from "../logger";
import {
  containsXssPatterns,
  sanitizeHtml,
  sanitizePlainText,
} from "./xss-protection";

/**
 * Fields that contain rich HTML (allow basic formatting)
 */
const HTML_FIELDS = [
  "description",
  "content",
  "notes",
  "reviewNote",
  "message",
];

/**
 * Fields that should be plain text only (strip all HTML)
 */
const PLAIN_TEXT_FIELDS = [
  "title",
  "name",
  "firstName",
  "lastName",
  "bio",
  "subjectName",
  "location",
];

/**
 * Sanitize request body for XSS protection
 *
 * @param request - NextRequest
 * @returns Sanitized body + XSS detection metadata
 */
export async function sanitizeRequestBody(request: NextRequest): Promise<{
  body: any;
  xssDetected: boolean;
  sanitizedFields: string[];
}> {
  try {
    const originalBody = await request.json();
    const sanitizedBody = { ...originalBody };
    const sanitizedFields: string[] = [];
    let xssDetected = false;

    // Recursively sanitize object
    const sanitizeObject = (obj: any, path: string = ""): any => {
      if (typeof obj !== "object" || obj === null) {
        return obj;
      }

      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;

        if (typeof value === "string") {
          // Check for XSS patterns
          if (containsXssPatterns(value)) {
            xssDetected = true;
            log.warn("XSS pattern detected in request", {
              field: fullPath,
              valuePreview: value.substring(0, 100),
            });
          }

          // Sanitize HTML fields (allow basic formatting)
          if (HTML_FIELDS.includes(key)) {
            const sanitized = sanitizeHtml(value, "strict");
            if (sanitized !== value) {
              sanitizedFields.push(fullPath);
            }
            obj[key] = sanitized;
          }
          // Sanitize plain text fields (strip all HTML)
          else if (PLAIN_TEXT_FIELDS.includes(key)) {
            const sanitized = sanitizePlainText(value);
            if (sanitized !== value) {
              sanitizedFields.push(fullPath);
            }
            obj[key] = sanitized;
          }
        } else if (typeof value === "object" && value !== null) {
          // Recursively sanitize nested objects/arrays
          obj[key] = sanitizeObject(value, fullPath);
        }
      }

      return obj;
    };

    sanitizeObject(sanitizedBody);

    // Log if sanitization occurred
    if (sanitizedFields.length > 0) {
      log.info("Request body sanitized", {
        fields: sanitizedFields,
        xssDetected,
        url: request.url,
      });
    }

    return {
      body: sanitizedBody,
      xssDetected,
      sanitizedFields,
    };
  } catch (error) {
    log.error("Request body sanitization failed", error);
    throw new Error("Invalid request body");
  }
}

/**
 * XSS protection middleware wrapper (use in API routes)
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const { body, xssDetected } = await withXssProtection(request);
 *
 *   if (xssDetected) {
 *     // Optional: Log security incident, notify admin, etc.
 *   }
 *
 *   // Use sanitized body...
 * }
 * ```
 */
export async function withXssProtection(request: NextRequest) {
  return sanitizeRequestBody(request);
}

/**
 * Sanitize specific fields from body (for custom sanitization)
 *
 * @example
 * ```ts
 * const body = await request.json();
 * const sanitized = sanitizeFields(body, {
 *   description: "html",
 *   title: "plain",
 *   notes: "html"
 * });
 * ```
 */
export function sanitizeFields<T extends Record<string, any>>(
  body: T,
  fields: Record<keyof T, "html" | "plain">,
): T {
  const sanitized = { ...body };

  for (const [field, mode] of Object.entries(fields)) {
    if (typeof sanitized[field as keyof T] === "string") {
      const value = sanitized[field as keyof T] as string;
      (sanitized[field as keyof T] as any) =
        mode === "html"
          ? sanitizeHtml(value, "strict")
          : sanitizePlainText(value);
    }
  }

  return sanitized;
}
