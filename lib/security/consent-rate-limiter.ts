/**
 * Parental Consent Verification Rate Limiter
 * CRITICAL SECURITY: Prevents brute-force attacks on 6-digit consent codes
 * 
 * Attack Vector: 1 million combinations (000000-999999) can be brute-forced
 * Mitigation: Exponential backoff + code invalidation after failures
 */

import { redis } from '@/lib/upstash';
import { log } from '@/lib/logger';

const CONSENT_ATTEMPTS_PREFIX = 'consent:attempts:';
const CONSENT_LOCKOUT_PREFIX = 'consent:lockout:';

const MAX_ATTEMPTS = 5; // Max attempts before lockout
const LOCKOUT_DURATION = 15 * 60; // 15 minutes lockout
const ATTEMPT_WINDOW = 15 * 60; // 15 minute sliding window
const EXPONENTIAL_BASE = 2; // Delay multiplier

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  attempts: Array<{
    timestamp: number;
    ipAddress: string;
    userAgent: string;
    success: boolean;
  }>;
}

interface LockoutRecord {
  code: string;
  lockedAt: number;
  unlockAt: number;
  reason: string;
  attemptCount: number;
}

/**
 * Check if consent code verification is allowed
 * Returns { allowed: boolean, retryAfter?: number, reason?: string }
 */
export async function canAttemptConsentVerification(
  code: string,
  ipAddress: string
): Promise<{
  allowed: boolean;
  retryAfter?: number;
  reason?: string;
  attemptsRemaining?: number;
}> {
  if (!redis) {
    log.warn('Redis unavailable - consent rate limiting disabled', { code });
    return { allowed: true };
  }

  // Check if code is locked out
  const lockoutKey = `${CONSENT_LOCKOUT_PREFIX}${code}`;
  const lockout = await redis.get<LockoutRecord>(lockoutKey);

  if (lockout) {
    const now = Date.now();
    const unlockAt = lockout.unlockAt;
    
    if (now < unlockAt) {
      const retryAfter = Math.ceil((unlockAt - now) / 1000);
      
      log.warn('Consent code lockout - attempt blocked', {
        code,
        ipAddress,
        retryAfter,
        reason: lockout.reason,
      });

      return {
        allowed: false,
        retryAfter,
        reason: `Previše neuspelih pokušaja. Pokušaj ponovo za ${Math.ceil(retryAfter / 60)} minuta.`,
      };
    } else {
      // Lockout expired - remove it
      await redis.del(lockoutKey);
    }
  }

  // Check attempt count
  const attemptsKey = `${CONSENT_ATTEMPTS_PREFIX}${code}`;
  const record = await redis.get<AttemptRecord>(attemptsKey);

  if (!record) {
    // First attempt - allowed
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS };
  }

  const now = Date.now();
  const windowStart = now - (ATTEMPT_WINDOW * 1000);

  // Count recent attempts within window
  const recentAttempts = record.attempts.filter(
    a => a.timestamp > windowStart
  );

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    // Exceeded max attempts - lock out the code
    await lockoutConsentCode(code, 'MAX_ATTEMPTS_EXCEEDED', recentAttempts.length);

    return {
      allowed: false,
      retryAfter: LOCKOUT_DURATION,
      reason: `Previše neuspelih pokušaja (${recentAttempts.length}/${MAX_ATTEMPTS}). Kod je privremeno blokiran.`,
    };
  }

  return {
    allowed: true,
    attemptsRemaining: MAX_ATTEMPTS - recentAttempts.length,
  };
}

/**
 * Record consent verification attempt
 * MUST be called after every verification attempt (success or failure)
 */
export async function recordConsentAttempt(
  code: string,
  success: boolean,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  if (!redis) return;

  const attemptsKey = `${CONSENT_ATTEMPTS_PREFIX}${code}`;
  const now = Date.now();

  try {
    const record = await redis.get<AttemptRecord>(attemptsKey);

    const newAttempt = {
      timestamp: now,
      ipAddress,
      userAgent,
      success,
    };

    if (!record) {
      // First attempt
      const newRecord: AttemptRecord = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        attempts: [newAttempt],
      };

      await redis.set(attemptsKey, newRecord, { ex: ATTEMPT_WINDOW });
    } else {
      // Update existing record
      const windowStart = now - (ATTEMPT_WINDOW * 1000);
      
      // Keep only recent attempts
      const recentAttempts = record.attempts.filter(
        a => a.timestamp > windowStart
      );

      const updatedRecord: AttemptRecord = {
        count: recentAttempts.length + 1,
        firstAttempt: recentAttempts[0]?.timestamp || now,
        lastAttempt: now,
        attempts: [...recentAttempts, newAttempt],
      };

      await redis.set(attemptsKey, updatedRecord, { ex: ATTEMPT_WINDOW });
    }

    log.info('Consent attempt recorded', {
      code,
      success,
      ipAddress,
      attemptsCount: record ? record.count + 1 : 1,
    });

    // If successful, clear the attempts
    if (success) {
      await redis.del(attemptsKey);
      log.info('Consent verification successful - attempts cleared', { code });
    }
  } catch (error) {
    log.error('Failed to record consent attempt', { error, code });
  }
}

/**
 * Lock out consent code after too many failures
 * Invalidates the code and notifies parent
 */
async function lockoutConsentCode(
  code: string,
  reason: string,
  attemptCount: number
): Promise<void> {
  if (!redis) return;

  const lockoutKey = `${CONSENT_LOCKOUT_PREFIX}${code}`;
  const now = Date.now();
  const unlockAt = now + (LOCKOUT_DURATION * 1000);

  const lockoutRecord: LockoutRecord = {
    code,
    lockedAt: now,
    unlockAt,
    reason,
    attemptCount,
  };

  try {
    await redis.set(lockoutKey, lockoutRecord, { ex: LOCKOUT_DURATION });

    log.warn('Consent code locked out', {
      code,
      reason,
      attemptCount,
      lockoutDuration: LOCKOUT_DURATION,
    });

    // Invalidate the consent code in database
    const { prisma } = await import('@/lib/db/prisma');
    await prisma.parentalConsent.updateMany({
      where: { 
        code,
        status: 'PENDING',
      },
      data: {
        status: 'EXPIRED',
        revokedAt: new Date(),
      },
    });

    // Notify parent via email
    await notifyParentAboutLockout(code, attemptCount);

  } catch (error) {
    log.error('Failed to lockout consent code', { error, code });
  }
}

/**
 * Notify parent about suspicious verification attempts
 */
async function notifyParentAboutLockout(
  code: string,
  attemptCount: number
): Promise<void> {
  try {
    const { prisma } = await import('@/lib/db/prisma');
    const consent = await prisma.parentalConsent.findUnique({
      where: { code },
      include: {
        student: {
          select: { name: true },
        },
      },
    });

    if (!consent) return;

    const { sendEmail } = await import('@/lib/email/send');
    
    await sendEmail({
      to: consent.parentEmail,
      subject: '🚨 Osnovci: Sigurnosno upozorenje - Verifikacija pristanka',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">🚨 Sigurnosno upozorenje</h2>
          
          <p>Poštovani,</p>
          
          <p>
            Detektovali smo <strong>${attemptCount} neuspelih pokušaja</strong> 
            verifikacije koda pristanka za učenika <strong>${consent.student.name}</strong>.
          </p>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Kod je privremeno blokiran iz bezbednosnih razloga.</strong>
            </p>
          </div>
          
          <p><strong>Šta treba da uradite:</strong></p>
          <ul>
            <li>Ako ste Vi pokušavali verifikaciju, sačekajte 15 minuta i pokušajte ponovo</li>
            <li>Ako niste Vi pokušavali verifikaciju, molimo kontaktirajte nas ODMAH</li>
            <li>Proverite da li neko neovlašćeno ima pristup vašem email-u</li>
          </ul>
          
          <p>
            Možete zatražiti novi kod pristanka sa strane učenika ili kontaktirati našu podršku.
          </p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Ovo je automatska poruka iz sigurnosnog sistema Osnovci aplikacije.
          </p>
        </div>
      `,
    });

    log.info('Parent notified about consent lockout', {
      code,
      parentEmail: consent.parentEmail,
    });
  } catch (error) {
    log.error('Failed to notify parent about lockout', { error, code });
  }
}

/**
 * Get rate limit status for monitoring
 */
export async function getConsentRateLimitStatus(code: string): Promise<{
  isLocked: boolean;
  attempts: number;
  lockoutExpiresAt?: Date;
}> {
  if (!redis) {
    return { isLocked: false, attempts: 0 };
  }

  try {
    const lockoutKey = `${CONSENT_LOCKOUT_PREFIX}${code}`;
    const lockout = await redis.get<LockoutRecord>(lockoutKey);

    if (lockout && lockout.unlockAt > Date.now()) {
      return {
        isLocked: true,
        attempts: lockout.attemptCount,
        lockoutExpiresAt: new Date(lockout.unlockAt),
      };
    }

    const attemptsKey = `${CONSENT_ATTEMPTS_PREFIX}${code}`;
    const record = await redis.get<AttemptRecord>(attemptsKey);

    return {
      isLocked: false,
      attempts: record ? record.count : 0,
    };
  } catch (error) {
    log.error('Failed to get consent rate limit status', { error, code });
    return { isLocked: false, attempts: 0 };
  }
}

/**
 * Clear all rate limit data for consent code (admin only)
 */
export async function clearConsentRateLimit(code: string): Promise<boolean> {
  if (!redis) return false;

  try {
    const attemptsKey = `${CONSENT_ATTEMPTS_PREFIX}${code}`;
    const lockoutKey = `${CONSENT_LOCKOUT_PREFIX}${code}`;

    await redis.del(attemptsKey);
    await redis.del(lockoutKey);

    log.info('Consent rate limit cleared', { code });
    return true;
  } catch (error) {
    log.error('Failed to clear consent rate limit', { error, code });
    return false;
  }
}
