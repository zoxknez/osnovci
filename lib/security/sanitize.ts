/**
 * Input Sanitization
 * Cleans user-generated content to prevent XSS attacks
 * Uses DOMPurify for HTML sanitization
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize plain text - removes ALL HTML tags
 * Use for: titles, names, short text fields
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    KEEP_CONTENT: true, // Keep text content
  }).trim();
}

/**
 * Sanitize rich text - allows safe HTML tags only
 * Use for: descriptions, notes, comments
 */
export function sanitizeRichText(input: string): string {
  if (!input) return "";

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      // Formatting
      "b",
      "i",
      "em",
      "strong",
      "u",
      "s",
      "mark",
      "small",
      "sup",
      "sub",
      // Structure
      "p",
      "br",
      "hr",
      "div",
      "span",
      // Lists
      "ul",
      "ol",
      "li",
      // Links (with restrictions)
      "a",
      // Headings
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      // Quotes
      "blockquote",
      "q",
      "cite",
      // Code
      "code",
      "pre",
    ],
    ALLOWED_ATTR: [
      "href",
      "title",
      "class", // For styling
      "id", // For accessibility
      "aria-label", // For accessibility
      "aria-describedby", // For accessibility
    ],
    ALLOW_DATA_ATTR: false, // No data-* attributes
    ALLOW_ARIA_ATTR: true, // Allow aria-* for accessibility
    ALLOW_UNKNOWN_PROTOCOLS: false, // Only http, https, mailto
    // Link safety
    ADD_ATTR: ["target"], // Add target="_blank" to links
    ADD_URI_SAFE_ATTR: ["href"], // Sanitize href values
    SAFE_FOR_TEMPLATES: true, // Prevent template injection
  }).trim();
}

/**
 * Sanitize HTML for display - very restrictive
 * Use for: user-generated HTML that will be displayed
 */
export function sanitizeHtmlForDisplay(input: string): string {
  if (!input) return "";

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

/**
 * Sanitize search query - removes special characters
 * Use for: search inputs, query parameters
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input) return "";

  // Remove all HTML first
  const cleaned = sanitizePlainText(input);

  // Remove special regex characters except spaces and Serbian characters
  return cleaned
    .replace(/[^\w\sčćžšđČĆŽŠĐ-]/g, "")
    .trim()
    .slice(0, 200); // Limit length
}

/**
 * Sanitize URL - ensures safe URLs only
 * Use for: user-provided URLs
 */
export function sanitizeUrl(input: string): string {
  if (!input) return "";

  const cleaned = input.trim();

  // Must start with http:// or https://
  if (!cleaned.match(/^https?:\/\//i)) {
    return "";
  }

  // Use DOMPurify's URL sanitization
  const anchor = document.createElement("a");
  anchor.href = DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });

  return anchor.href;
}

/**
 * Sanitize email - basic email validation & cleaning
 * Use for: email inputs
 */
export function sanitizeEmail(input: string): string {
  if (!input) return "";

  const cleaned = sanitizePlainText(input).toLowerCase();

  // Basic email validation
  if (!cleaned.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return "";
  }

  return cleaned;
}

/**
 * Sanitize phone number - Serbian format
 * Use for: phone inputs
 */
export function sanitizePhone(input: string): string {
  if (!input) return "";

  // Remove all non-digits except +
  const cleaned = input.replace(/[^\d+]/g, "");

  // Must match Serbian format
  if (!cleaned.match(/^(\+381|0)[0-9]{8,9}$/)) {
    return "";
  }

  return cleaned;
}

/**
 * Sanitize filename - safe characters only
 * Use for: file uploads
 */
export function sanitizeFilename(input: string): string {
  if (!input) return "unnamed-file";

  return input
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace unsafe chars
    .replace(/\.+/g, ".") // Remove multiple dots
    .replace(/^\./, "") // Remove leading dot
    .slice(0, 255); // Limit length
}

/**
 * Sanitize JSON - removes potentially dangerous content
 * Use for: storing user JSON data
 */
export function sanitizeJson(input: unknown): unknown {
  if (!input) return null;

  try {
    const str = JSON.stringify(input);
    const parsed = JSON.parse(str);

    // Recursively sanitize string values
    return sanitizeObjectValues(parsed);
  } catch {
    return null;
  }
}

/**
 * Helper: Recursively sanitize object string values
 */
function sanitizeObjectValues(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizePlainText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectValues);
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectValues(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Batch sanitization - sanitize multiple fields at once
 * Use for: forms with multiple text inputs
 */
export function sanitizeFields<T extends Record<string, unknown>>(
  data: T,
  fieldConfig: Record<keyof T, "plain" | "rich" | "search" | "email" | "phone">,
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "string") {
      sanitized[key] = value;
      continue;
    }

    const config = fieldConfig[key as keyof T];

    switch (config) {
      case "plain":
        sanitized[key] = sanitizePlainText(value);
        break;
      case "rich":
        sanitized[key] = sanitizeRichText(value);
        break;
      case "search":
        sanitized[key] = sanitizeSearchQuery(value);
        break;
      case "email":
        sanitized[key] = sanitizeEmail(value);
        break;
      case "phone":
        sanitized[key] = sanitizePhone(value);
        break;
      default:
        sanitized[key] = sanitizePlainText(value); // Default to plain text
    }
  }

  return sanitized as T;
}

/**
 * Middleware helper - sanitize request body
 * Use in API routes before validation
 */
export function sanitizeRequestBody(
  body: Record<string, unknown>,
  schema: Record<string, "plain" | "rich" | "search">,
): Record<string, unknown> {
  return sanitizeFields(body, schema);
}
