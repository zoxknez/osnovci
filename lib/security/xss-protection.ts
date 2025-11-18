/**
 * XSS Protection - Server-Side HTML Sanitization
 *
 * Uses DOMPurify to sanitize user-generated HTML content
 * Protects against XSS attacks in:
 * - Homework descriptions/notes
 * - Student profile bios
 * - Comments/reviews
 * - Any user-submitted rich text
 *
 * CRITICAL: Always sanitize before storing OR before rendering
 */

import DOMPurify from "isomorphic-dompurify";
import { log } from "@/lib/logger";

/**
 * Strict sanitization config (for untrusted user content)
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: [
    // Text formatting
    "b",
    "i",
    "em",
    "strong",
    "u",
    "s",
    "mark",
    "small",
    "sub",
    "sup",
    // Structure
    "p",
    "br",
    "span",
    "div",
    // Lists
    "ul",
    "ol",
    "li",
    // Links (safe)
    "a",
  ],
  ALLOWED_ATTR: [
    "href", // Links
    "title", // Tooltips
    "class", // Styling (limited)
  ],
  ALLOWED_URI_REGEXP: /^(?:https?:\/\/|mailto:)/i, // Only HTTPS/HTTP/mailto links
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onfocus",
    "onblur",
  ], // Event handlers
  KEEP_CONTENT: true, // Keep text content even if tags removed
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Minimal config (only plain text with line breaks)
 */
const MINIMAL_CONFIG = {
  ALLOWED_TAGS: ["br", "p"],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * 🛡️ MAIN FUNCTION: Sanitize HTML (XSS protection)
 *
 * @param html - Potentially malicious HTML input
 * @param mode - Sanitization strictness level
 * @returns Safe HTML with XSS vectors removed
 *
 * @example
 * ```ts
 * // Homework description (allow basic formatting)
 * const safe = sanitizeHtml(userInput, "strict");
 *
 * // Student name/profile (plain text only)
 * const safe = sanitizeHtml(userInput, "minimal");
 * ```
 */
export function sanitizeHtml(
  html: string,
  mode: "strict" | "minimal" = "strict"
): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    const config = mode === "strict" ? STRICT_CONFIG : MINIMAL_CONFIG;
    const sanitized = DOMPurify.sanitize(html, config) as string;

    // Log if content was modified (potential XSS attempt)
    if (sanitized !== html) {
      log.warn("HTML content was sanitized (potential XSS)", {
        originalLength: html.length,
        sanitizedLength: sanitized.length,
        removed: html.length - sanitized.length,
        mode,
      });
    }

    return sanitized;
  } catch (error) {
    log.error("HTML sanitization failed", error, { htmlLength: html.length });
    // Fail-closed: return empty string on error
    return "";
  }
}

/**
 * Sanitize plain text (remove ALL HTML tags)
 *
 * Use for: names, titles, short descriptions
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  try {
    // Remove all HTML tags
    const sanitized = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    });

    // Also decode HTML entities
    return decodeHtmlEntities(sanitized).trim();
  } catch (error) {
    log.error("Plain text sanitization failed", error);
    return "";
  }
}

/**
 * Decode HTML entities (e.g., &lt; → <, &amp; → &)
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return text.replace(/&[a-z]+;|&#\d+;/gi, (match) => {
    return entities[match.toLowerCase()] || match;
  });
}

/**
 * 🔍 Detect XSS attempts (for logging/monitoring)
 *
 * @param html - Input to check
 * @returns True if XSS patterns detected
 */
export function containsXssPatterns(html: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi, // <script> tags
    /on\w+\s*=\s*["']?[^"'>]*/gi, // Event handlers (onclick, onerror, etc.)
    /javascript:/gi, // javascript: protocol
    /data:text\/html/gi, // data:text/html (base64 encoded HTML)
    /<iframe/gi, // <iframe>
    /<object/gi, // <object>
    /<embed/gi, // <embed>
    /eval\s*\(/gi, // eval() function
    /expression\s*\(/gi, // CSS expression (IE)
    /vbscript:/gi, // vbscript: protocol
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(html)) {
      return true;
    }
  }

  return false;
}

/**
 * 🧪 Test sanitization function
 */
export function testSanitization(): void {
  const testCases = [
    {
      name: "XSS via script tag",
      input: '<script>alert("XSS")</script>Hello',
      expected: "Hello",
    },
    {
      name: "XSS via onerror",
      input: '<img src=x onerror="alert(\'XSS\')">',
      expected: "",
    },
    {
      name: "Safe HTML",
      input: "<p><b>Bold</b> and <i>italic</i></p>",
      expected: "<p><b>Bold</b> and <i>italic</i></p>",
    },
    {
      name: "Link with javascript:",
      input: '<a href="javascript:alert(\'XSS\')">Click</a>',
      expected: "<a>Click</a>", // href removed
    },
    {
      name: "Plain text mode",
      input: "<b>Bold</b> text",
      expectedMinimal: "Bold text", // Tags stripped
    },
  ];

  console.log("🧪 XSS Protection Test Results:\n");

  for (const testCase of testCases) {
    const result = sanitizeHtml(testCase.input, "strict");
    const minimal = sanitizeHtml(testCase.input, "minimal");
    const passed =
      result === (testCase.expected || testCase.input) ||
      minimal === (testCase.expectedMinimal || "");

    console.log(`${passed ? "✅" : "❌"} ${testCase.name}`);
    console.log(`  Input:    "${testCase.input}"`);
    console.log(`  Output:   "${result}"`);
    if (testCase.expectedMinimal) {
      console.log(`  Minimal:  "${minimal}"`);
    }
    console.log("");
  }

  console.log("🔍 XSS Pattern Detection Test:\n");
  const xssTests = [
    { input: '<script>alert(1)</script>', expected: true },
    { input: '<img src=x onerror=alert(1)>', expected: true },
    { input: '<a href="javascript:void(0)">Link</a>', expected: true },
    { input: "<p>Normal text</p>", expected: false },
  ];

  for (const test of xssTests) {
    const detected = containsXssPatterns(test.input);
    const passed = detected === test.expected;
    console.log(`${passed ? "✅" : "❌"} ${test.input} → ${detected}`);
  }
}

/**
 * 📋 Sanitization Middleware (for API routes)
 *
 * Use this to automatically sanitize request body fields
 *
 * @example
 * ```ts
 * // In API route
 * const body = await request.json();
 * const sanitized = sanitizeRequestBody(body, ['description', 'notes']);
 * ```
 */
export function sanitizeRequestBody<T extends Record<string, any>>(
  body: T,
  fields: (keyof T)[],
  mode: "strict" | "minimal" = "strict"
): T {
  const sanitized = { ...body };

  for (const field of fields) {
    if (typeof sanitized[field] === "string") {
      (sanitized[field] as any) = sanitizeHtml(sanitized[field] as string, mode);
    }
  }

  return sanitized;
}
