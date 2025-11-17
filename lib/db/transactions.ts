/**
 * Database Transaction Helpers
 * Modern transaction utilities for safe database operations
 */

import { prisma } from './prisma';
import { log } from '@/lib/logger';
import type { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Execute a transaction with automatic retry on deadlock
 */
export async function executeTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const retryDelay = options?.retryDelay ?? 100;
  const isolationLevel = options?.isolationLevel;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (isolationLevel) {
        return await prisma.$transaction(callback, {
          isolationLevel,
          maxWait: 10000, // 10 seconds
          timeout: 30000, // 30 seconds
        });
      }

      return await prisma.$transaction(callback, {
        maxWait: 10000,
        timeout: 30000,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a deadlock or serialization failure (should retry)
      const isRetryableError =
        error instanceof PrismaClientKnownRequestError &&
        (error.code === 'P2034' || // Transaction conflict
          error.code === 'P2035' || // Transaction deadlock
          error.code === 'P1008' || // Operations timed out
          error.code === 'P1017'); // Server closed connection

      if (!isRetryableError || attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      log.warn(`Transaction retry (attempt ${attempt + 1}/${maxRetries})`, {
        error: lastError.message,
        delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Transaction failed after all retries');
}

/**
 * Execute multiple operations in parallel within a transaction
 */
export async function executeParallel<T>(
  operations: Array<(tx: Prisma.TransactionClient) => Promise<T>>,
): Promise<T[]> {
  return executeTransaction(async (tx) => {
    return Promise.all(operations.map((op) => op(tx)));
  });
}

/**
 * Batch operations with size limit
 */
export async function executeBatch<T>(
  items: T[],
  batchSize: number,
  operation: (batch: T[], tx: Prisma.TransactionClient) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await executeTransaction(async (tx) => {
      await operation(batch, tx);
    });
  }
}

/**
 * Safe transaction wrapper that handles errors gracefully
 */
export async function safeTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  fallback?: () => T,
): Promise<T | null> {
  try {
    return await executeTransaction(callback);
  } catch (error) {
    log.error('Transaction failed', { error });

    if (fallback) {
      return fallback();
    }

    return null;
  }
}

