// Input Sanitization - Zaštita od XSS napada
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content - Uklanja opasne tagove i atribute
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "title", "target"],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

/**
 * Sanitize za user input (strict - samo text)
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize za homework descriptions (允许 basic formatting)
 */
export function sanitizeHomeworkDescription(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "p"],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize za URLs
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);

    // Allow only http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return DOMPurify.sanitize(url, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  } catch {
    return "";
  }
}

/**
 * Sanitize filename - Remove path traversal attempts
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_.]/g, "_") // Remove special chars
    .replace(/\.{2,}/g, ".") // Remove path traversal
    .replace(/^\.+/, "") // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Escape HTML entities
 */
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Remove potentially dangerous characters from IDs
 */
export function sanitizeID(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-_]/g, "");
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleaned)) {
    return "";
  }

  return DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize phone number (Serbian format)
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // Serbian phone: 06XXXXXXXX or +381XXXXXXXXX
  if (digits.length === 9 && digits.startsWith("6")) {
    return `0${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("381")) {
    return `+${digits}`;
  }

  return digits.substring(0, 15); // Limit length
}

/**
 * Comprehensive sanitization za form data
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, "text" | "html" | "email" | "phone" | "url" | "id">,
): T {
  const sanitized = { ...data } as Record<string, any>;

  for (const [key, type] of Object.entries(schema)) {
    const value = data[key];

    if (typeof value !== "string") continue;

    switch (type) {
      case "text":
        sanitized[key] = sanitizeText(value);
        break;
      case "html":
        sanitized[key] = sanitizeHTML(value);
        break;
      case "email":
        sanitized[key] = sanitizeEmail(value);
        break;
      case "phone":
        sanitized[key] = sanitizePhone(value);
        break;
      case "url":
        sanitized[key] = sanitizeURL(value);
        break;
      case "id":
        sanitized[key] = sanitizeID(value);
        break;
    }
  }

  return sanitized as T;
}
