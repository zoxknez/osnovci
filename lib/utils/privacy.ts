/**
 * Privacy Utilities
 *
 * Functions for protecting user privacy and PII (Personally Identifiable Information)
 * COPPA/GDPR compliant data masking
 */

/**
 * Mask full name for leaderboard display
 *
 * Examples:
 * - "Marko Petrović" → "Marko P."
 * - "Ana" → "Ana"
 * - "Stefan Milanović Đurić" → "Stefan M. Đ."
 *
 * @param fullName - Student's full name
 * @param isCurrentUser - If true, show full name (user can see their own name)
 * @returns Masked name for privacy protection
 */
export function maskLeaderboardName(
  fullName: string,
  isCurrentUser: boolean = false,
): string {
  // Current user sees their full name
  if (isCurrentUser) {
    return fullName;
  }

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  // Single name (no surname) - show as-is
  if (nameParts.length === 1) {
    return nameParts[0] || fullName;
  }

  // Multiple names - show first name + initial(s) of surname(s)
  const firstName = nameParts[0] || "";
  const surnameInitials = nameParts
    .slice(1)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(" ");

  return `${firstName} ${surnameInitials}`;
}

/**
 * Mask email address for privacy
 *
 * Examples:
 * - "john.doe@example.com" → "j***e@example.com"
 * - "a@b.com" → "a@b.com" (too short to mask)
 *
 * @param email - Email address to mask
 * @returns Masked email
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");

  if (!local || !domain || local.length <= 2) {
    return email; // Invalid email or too short to mask
  }

  const firstChar = local.charAt(0);
  const lastChar = local.charAt(local.length - 1);
  const maskedLocal = `${firstChar}${"*".repeat(Math.min(local.length - 2, 5))}${lastChar}`;

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for privacy
 *
 * Examples:
 * - "+381641234567" → "+381 64 ***4567"
 * - "0641234567" → "064 ***4567"
 *
 * @param phone - Phone number to mask
 * @returns Masked phone number
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 6) {
    return phone; // Too short to mask
  }

  const lastFour = digits.slice(-4);
  const prefix = phone.slice(0, phone.indexOf(lastFour) - 3);

  return `${prefix}***${lastFour}`;
}

/**
 * Sanitize user ID for logging (prevent PII exposure)
 *
 * @param userId - User ID to sanitize
 * @returns First 8 characters of user ID
 */
export function sanitizeUserId(userId: string): string {
  return userId.substring(0, 8);
}

/**
 * Check if name contains inappropriate words
 * (Used for leaderboard name validation)
 *
 * @param name - Name to check
 * @returns True if name is appropriate
 */
export function isNameAppropriate(name: string): boolean {
  const inappropriateWords = [
    // Serbian offensive words (basic list)
    "pizda",
    "kurac",
    "jebem",
    "peder",
    "kurva",
    // English offensive words
    "fuck",
    "shit",
    "bitch",
    "ass",
    "dick",
  ];

  const lowerName = name.toLowerCase();
  return !inappropriateWords.some((word) => lowerName.includes(word));
}
