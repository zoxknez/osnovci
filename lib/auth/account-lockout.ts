// Account Lockout - Prevent brute-force attacks
import { log } from "@/lib/logger";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

interface LoginAttempt {
  email: string;
  success: boolean;
  ip?: string;
}

// In-memory store (TODO: Use Redis for production)
const failedAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

/**
 * Record a login attempt
 */
export async function recordLoginAttempt({ email, success, ip }: LoginAttempt) {
  const key = email.toLowerCase();

  if (success) {
    // Clear failed attempts on successful login
    failedAttempts.delete(key);
    log.info("Login successful - cleared failed attempts", { email });
    return { locked: false };
  }

  // Increment failed attempts
  const current = failedAttempts.get(key) || { count: 0 };
  current.count += 1;

  log.warn("Failed login attempt", {
    email,
    attemptCount: current.count,
    ip,
  });

  // Lock account if threshold exceeded
  if (current.count >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(
      Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
    );
    current.lockedUntil = lockedUntil;

    log.warn("Account locked due to too many failed attempts", {
      email,
      lockedUntil,
      attemptCount: current.count,
    });

    failedAttempts.set(key, current);

    return {
      locked: true,
      lockedUntil,
      message: `Nalog je zaključan zbog previše neuspešnih pokušaja. Pokušaj ponovo posle ${LOCKOUT_DURATION_MINUTES} minuta.`,
    };
  }

  failedAttempts.set(key, current);

  return {
    locked: false,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - current.count,
  };
}

/**
 * Check if account is locked
 */
export function isAccountLocked(email: string): {
  locked: boolean;
  lockedUntil?: Date;
  message?: string;
} {
  const key = email.toLowerCase();
  const attempt = failedAttempts.get(key);

  if (!attempt?.lockedUntil) {
    return { locked: false };
  }

  // Check if lockout has expired
  if (new Date() > attempt.lockedUntil) {
    // Lockout expired - clear
    failedAttempts.delete(key);
    log.info("Account lockout expired", { email });
    return { locked: false };
  }

  const minutesRemaining = Math.ceil(
    (attempt.lockedUntil.getTime() - Date.now()) / (1000 * 60),
  );

  return {
    locked: true,
    lockedUntil: attempt.lockedUntil,
    message: `Nalog je zaključan. Pokušaj ponovo za ${minutesRemaining} minuta.`,
  };
}

/**
 * Manually unlock account (admin function)
 */
export function unlockAccount(email: string) {
  const key = email.toLowerCase();
  failedAttempts.delete(key);
  log.info("Account manually unlocked", { email });
}

/**
 * Get failed attempts count
 */
export function getFailedAttempts(email: string): number {
  const key = email.toLowerCase();
  return failedAttempts.get(key)?.count || 0;
}

/**
 * Cleanup expired lockouts (run periodically)
 */
export function cleanupExpiredLockouts() {
  const now = new Date();
  let cleaned = 0;

  for (const [email, attempt] of failedAttempts.entries()) {
    if (attempt.lockedUntil && now > attempt.lockedUntil) {
      failedAttempts.delete(email);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    log.info("Cleaned up expired lockouts", { count: cleaned });
  }

  return cleaned;
}

// Cleanup every 10 minutes
if (typeof window === "undefined") {
  setInterval(cleanupExpiredLockouts, 10 * 60 * 1000);
}
