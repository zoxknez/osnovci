// Age Verification - COPPA Compliance
// Children under 13 require parental consent BEFORE account creation

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Check if user requires parental consent (under 13 years old)
 * COPPA compliance: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
 */
export function requiresParentalConsent(dateOfBirth: Date): boolean {
  const age = calculateAge(dateOfBirth);
  return age < 13;
}

/**
 * Validate date of birth (must be realistic age for elementary school)
 * Elementary school: typically ages 6-14
 */
export function isValidStudentAge(dateOfBirth: Date): {
  valid: boolean;
  reason?: string;
} {
  const age = calculateAge(dateOfBirth);
  
  if (age < 5) {
    return {
      valid: false,
      reason: "Dete mora imati najmanje 5 godina za korišćenje aplikacije",
    };
  }
  
  if (age > 18) {
    return {
      valid: false,
      reason: "Aplikacija je namenjena učenicima osnovne škole (5-18 godina)",
    };
  }
  
  return { valid: true };
}

/**
 * Generate parental consent token (sent via email to parent)
 */
export function generateConsentToken(): string {
  const chars = '0123456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Age verification result with recommendations
 */
export interface AgeVerificationResult {
  age: number;
  isValid: boolean;
  requiresConsent: boolean;
  canProceed: boolean;
  message?: string;
}

/**
 * Comprehensive age verification
 */
export function verifyAge(dateOfBirth: Date): AgeVerificationResult {
  const age = calculateAge(dateOfBirth);
  const validation = isValidStudentAge(dateOfBirth);
  const needsConsent = requiresParentalConsent(dateOfBirth);
  
  if (!validation.valid) {
    return {
      age,
      isValid: false,
      requiresConsent: needsConsent,
      canProceed: false,
      message: validation.reason || "Invalid age",
    };
  }
  
  return {
    age,
    isValid: true,
    requiresConsent: needsConsent,
    canProceed: true,
    message: needsConsent 
      ? "Dete je mlađe od 13 godina. Potrebna je saglasnost roditelja."
      : "Dete može kreirati nalog samostalno.",
  };
}
