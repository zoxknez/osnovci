/**
 * Child Content Filter
 * Filtriranje AI odgovora za bezbednost dece
 * COPPA/GDPR compliant content filtering
 */

import { log } from "@/lib/logger";

// Reči koje treba zameniti jednostavnijim
const COMPLEX_TO_SIMPLE: Record<string, string> = {
  implementirati: "napraviti",
  implementacija: "pravljenje",
  algoritam: "niz koraka",
  optimizovati: "poboljšati",
  analizirati: "proučiti",
  evaluirati: "proceniti",
  elaborirati: "objasniti detaljno",
  konkretno: "tačno",
  apstraktno: "zamišljeno",
  fundamentalno: "osnovno",
  inherentno: "prirodno",
  eksplicitno: "jasno",
  implicitno: "podrazumevano",
  kontekst: "okolnosti",
  paradigma: "način razmišljanja",
  metodologija: "način rada",
  perpektiva: "gledište",
  aspekt: "strana",
  komponenta: "deo",
  relevantno: "važno",
  signifikantno: "značajno",
  determinisati: "odrediti",
  demonstrirati: "pokazati",
  manifestovati: "pokazati",
  recipročno: "uzajamno",
  simultano: "istovremeno",
  proporcionalno: "srazmerno",
};

// Neprimereni izrazi za decu (blagi filter)
const INAPPROPRIATE_PATTERNS = [
  /\b(glup|budala|idiot|kreten)\b/gi,
  /\b(sranje|prokleto)\b/gi,
  /\b(mrzim|ubiti|smrt)\b/gi,
];

// Zamene za neprimerene izraze
const INAPPROPRIATE_REPLACEMENTS: Record<string, string> = {
  glup: "pogrešan",
  budala: "osoba",
  idiot: "osoba",
  kreten: "osoba",
};

// Fraze koje ne bi trebalo da AI koristi
const PHRASES_TO_REMOVE = [
  "kao što znate",
  "očigledno je",
  "trivijalno je",
  "jednostavno je shvatiti",
  "lako je videti",
  "naravno da",
];

/**
 * Filter response content for children
 * Makes content appropriate and understandable for elementary school students
 */
export function filterResponseForChildren(response: string): string {
  if (!response) return "";

  let filtered = response;

  try {
    // 1. Zameni složene termine jednostavnijim
    filtered = simplifyComplexTerms(filtered);

    // 2. Ukloni neprimerene izraze
    filtered = removeInappropriateContent(filtered);

    // 3. Ukloni omalovažavajuće fraze
    filtered = removeCondescendingPhrases(filtered);

    // 4. Obezbedi pozitivan ton
    filtered = ensurePositiveTone(filtered);

    // 5. Ograniči dužinu odgovora
    filtered = limitResponseLength(filtered, 2000);

    log.debug("Content filtered for children", {
      originalLength: response.length,
      filteredLength: filtered.length,
    });
  } catch (error) {
    log.error("Error filtering content", { error });
    // Return original if filtering fails
    return response;
  }

  return filtered;
}

/**
 * Simplify complex terms to child-friendly alternatives
 */
function simplifyComplexTerms(text: string): string {
  let result = text;

  for (const [complex, simple] of Object.entries(COMPLEX_TO_SIMPLE)) {
    const regex = new RegExp(`\\b${complex}\\b`, "gi");
    result = result.replace(regex, simple);
  }

  return result;
}

/**
 * Remove or replace inappropriate content
 */
function removeInappropriateContent(text: string): string {
  let result = text;

  // Replace specific inappropriate words
  for (const [bad, good] of Object.entries(INAPPROPRIATE_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${bad}\\b`, "gi");
    result = result.replace(regex, good);
  }

  // Remove patterns that match inappropriate content
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    result = result.replace(pattern, "[...]");
  }

  return result;
}

/**
 * Remove condescending phrases that might discourage children
 */
function removeCondescendingPhrases(text: string): string {
  let result = text;

  for (const phrase of PHRASES_TO_REMOVE) {
    const regex = new RegExp(phrase, "gi");
    result = result.replace(regex, "");
  }

  // Clean up any double spaces created by removal
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

/**
 * Ensure response has a positive, encouraging tone
 */
function ensurePositiveTone(text: string): string {
  // Check if response ends with encouragement
  const hasEncouragement = /[🌟✨💪🚀🎯📚🏆🦸😊👍❤️🎉]/u.test(text.slice(-50));

  if (!hasEncouragement) {
    // Add a subtle encouragement if none present
    const encouragements = [" 🌟", " ✨", " 💪"];
    const randomIndex = Math.floor(Math.random() * encouragements.length);
    text += encouragements[randomIndex];
  }

  return text;
}

/**
 * Limit response length to avoid overwhelming children
 */
function limitResponseLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to cut at a sentence boundary
  let cutPoint = text.lastIndexOf(".", maxLength - 50);
  if (cutPoint < maxLength * 0.7) {
    cutPoint = text.lastIndexOf(" ", maxLength - 20);
  }

  if (cutPoint > 0) {
    return (
      text.substring(0, cutPoint + 1) + "\n\n(...nastavak u sledećem pitanju)"
    );
  }

  return text.substring(0, maxLength - 20) + "...";
}

/**
 * Validate that content is safe for children
 * Returns true if content passes safety checks
 */
export function isContentSafe(text: string): boolean {
  if (!text) return true;

  const lowerText = text.toLowerCase();

  // Check for any inappropriate patterns
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(lowerText)) {
      return false;
    }
  }

  return true;
}

/**
 * Get age-appropriate complexity level
 */
export function getComplexityLevel(
  age: number | undefined,
): "simple" | "medium" | "advanced" {
  if (!age || age < 9) return "simple";
  if (age < 12) return "medium";
  return "advanced";
}

/**
 * Adjust response based on age
 */
export function adjustForAge(
  response: string,
  age: number | undefined,
): string {
  const complexity = getComplexityLevel(age);

  if (complexity === "simple") {
    // Shorter sentences, more emojis
    return response.replace(/\. /g, ". 😊 ").replace(/: /g, ":\n• ");
  }

  return response;
}
