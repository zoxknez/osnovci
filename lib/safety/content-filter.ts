// Content Moderation & Safety - Za decu!
// Štiti decu od neprikladnog sadržaja

import { containsProfanity, getActionForSeverity } from '@/lib/security/profanity-list';

/**
 * Content Filter - za tekst
 * Koristi comprehensive profanity detection
 */
export class ContentFilter {
  /**
   * Proverava da li tekst sadrži neprikladne reči
   */
  static check(text: string): {
    safe: boolean;
    filtered: string;
    flagged: string[];
    severity: 'none' | 'mild' | 'moderate' | 'severe' | 'critical';
    action: 'allow' | 'warn' | 'filter' | 'block' | 'flag';
    notifyParent: boolean;
  } {
    const result = containsProfanity(text);
    const actionInfo = getActionForSeverity(result.severity);

    // Filter matched words
    let filtered = text;
    for (const word of result.matches) {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '***');
    }

    return {
      safe: !result.hasProfanity,
      filtered,
      flagged: result.matches,
      severity: result.severity,
      action: actionInfo.action,
      notifyParent: actionInfo.notifyParent,
    };
  }

  /**
   * Auto-korekcija često pravljenih grešaka
   */
  static autoCorrect(text: string): string {
    // Jednostavne korekcije
    return text
      .replace(/(\w+)\1{2,}/g, "$1$1") // Ponavljanje slova: "heeeej" -> "hej"
      .replace(/[!?]{3,}/g, "!!") // Previše znakova: "!!!!!!" -> "!!"
      .trim();
  }
}

/**
 * Age-Appropriate Content Filter
 * Filtrira sadržaj prema uzrastu
 */
export class AgeFilter {
  /**
   * Proverava da li je sadržaj prikladan za uzrast
   */
  static isAppropriate(
    content: string,
    age: number,
  ): {
    appropriate: boolean;
    reason?: string;
    suggestedAge?: number;
  } {
    // Osnovci: 7-15 godina
    if (age < 7) {
      return {
        appropriate: false,
        reason: "Sadržaj namenjen deci starije od 7 godina",
        suggestedAge: 7,
      };
    }

    if (age > 15) {
      return {
        appropriate: true,
      };
    }

    // Check za kompleksnost teksta (Flesch Reading Ease)
    const complexity = AgeFilter.calculateComplexity(content);

    // Za decu 7-10: jednostavan jezik
    if (age <= 10 && complexity > 60) {
      return {
        appropriate: false,
        reason: "Tekst je previše složen",
      };
    }

    // Za decu 11-15: umereno složen jezik
    if (age <= 15 && complexity > 80) {
      return {
        appropriate: false,
        reason: "Tekst je previše složen",
      };
    }

    return {
      appropriate: true,
    };
  }

  /**
   * Izračunava kompleksnost teksta (0-100, veći = složeniji)
   */
  private static calculateComplexity(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = AgeFilter.countSyllables(text);

    // Flesch Reading Ease formula (prilagođeno za srpski)
    const score =
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

    // Inverzno: veći score = lakši tekst, mi želimo obrnuto
    return Math.max(0, Math.min(100, 100 - score));
  }

  /**
   * Broji slogove u tekstu (approximation za srpski)
   */
  private static countSyllables(text: string): number {
    // Jednostavna approximacija: broj samoglasnika
    const vowels = text.match(/[aeiouаеиоу]/gi);
    return vowels ? vowels.length : 0;
  }

  /**
   * Pojednostavnjuje tekst za mlađe korisnike
   */
  static simplify(text: string): string {
    return (
      text
        // Zameni složene reči jednostavnijim
        .replace(/međutim/gi, "ali")
        .replace(/naravno/gi, "naravno")
        // Skrati duge rečenice
        .replace(/\. /g, ".\n\n") // Više prostora između rečenica
    );
  }
}

/**
 * Personal Information Detector
 * Detektuje i maskira lične informacije
 */
export class PIIDetector {
  /**
   * Detektuje lične informacije u tekstu
   */
  static detect(text: string): {
    detected: boolean;
    types: string[];
    masked: string;
  } {
    const types: string[] = [];
    let masked = text;

    // Email adrese
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailRegex.test(text)) {
      types.push("email");
      masked = masked.replace(emailRegex, "[EMAIL ADRESA]");
    }

    // Telefoni (serbian format)
    const phoneRegex = /(\+381|0)[0-9]{8,9}/g;
    if (phoneRegex.test(text)) {
      types.push("phone");
      masked = masked.replace(phoneRegex, "[TELEFON]");
    }

    // Adrese (approximate)
    const addressRegex = /\b\d+\s+[A-Za-zА-Жа-ж\s]+ulica\b/gi;
    if (addressRegex.test(text)) {
      types.push("address");
      masked = masked.replace(addressRegex, "[ADRESA]");
    }

    // JMBG (Serbian personal ID)
    const jmbgRegex = /\b\d{13}\b/g;
    if (jmbgRegex.test(text)) {
      types.push("jmbg");
      masked = masked.replace(jmbgRegex, "[JMBG]");
    }

    return {
      detected: types.length > 0,
      types,
      masked,
    };
  }

  /**
   * Upozorenje za roditelje ako dete deli lične info
   */
  static generateWarning(types: string[]): string {
    if (types.length === 0) return "";

    return `⚠️ UPOZORENJE: Detektovane lične informacije (${types.join(", ")}). Roditelji će biti obavešteni.`;
  }
}

/**
 * Comprehensive content moderation
 */
export async function moderateContent(content: {
  text: string;
  userId: string;
  userAge: number;
}): Promise<{
  approved: boolean;
  moderated: string;
  warnings: string[];
  parentalNotification: boolean;
}> {
  const warnings: string[] = [];

  // 1. Filter inappropriate words
  const filtered = ContentFilter.check(content.text);
  if (!filtered.safe) {
    warnings.push(`Neprikladne reči: ${filtered.flagged.join(", ")}`);
  }

  // 2. Check age appropriateness
  const ageCheck = AgeFilter.isAppropriate(content.text, content.userAge);
  if (!ageCheck.appropriate) {
    warnings.push(ageCheck.reason || "Sadržaj nije prikladan za uzrast");
  }

  // 3. Detect personal information
  const pii = PIIDetector.detect(content.text);
  if (pii.detected) {
    warnings.push(PIIDetector.generateWarning(pii.types));
  }

  // 4. Auto-correct
  const corrected = ContentFilter.autoCorrect(
    pii.detected ? pii.masked : filtered.filtered,
  );

  return {
    approved: warnings.length === 0,
    moderated: corrected,
    warnings,
    parentalNotification: pii.detected || !filtered.safe,
  };
}
