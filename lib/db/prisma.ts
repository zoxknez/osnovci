// Prisma Client Singleton (best practice za Next.js)
// Sprečava kreiranje previše konekcija u development-u
// Production-ready sa connection pooling i optimizacijama

import { type Prisma, PrismaClient } from "@prisma/client";
import { log } from "@/lib/logger";
import { configurePrismaLogging } from "./query-monitor";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Build optimized DATABASE_URL with connection pooling parameters
 */
function getDatabaseUrl(): string {
  const baseUrl = process.env["DATABASE_URL"];

  if (!baseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  // If URL already has query params, return as-is
  if (baseUrl.includes("?")) {
    return baseUrl;
  }

  // Add connection pooling parameters for PostgreSQL
  const poolParams = new URLSearchParams({
    connection_limit: "20", // Max connections (default: 10)
    pool_timeout: "20", // Pool timeout in seconds
    connect_timeout: "10", // Connection timeout in seconds
    // pgbouncer: "true", // Uncomment if using PgBouncer
  });

  return `${baseUrl}?${poolParams.toString()}`;
}

/**
 * Prisma Client Configuration
 * - Connection pooling (20 connections)
 * - Query logging in development
 * - Performance optimizations
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],

    // Connection pool configuration
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },

    // Performance optimizations
    errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
  });

// Prevent hot reload from creating new instances
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Configure query logging for performance monitoring
configurePrismaLogging(prisma);

// Note: Graceful shutdown handlers removed for Edge Runtime compatibility
// Prisma will handle disconnection automatically on process termination

/**
 * Health check helper with detailed status
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    return { connected: true, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error("Database connection check failed", {
      error: errorMessage,
      latency,
    });
    return { connected: false, latency, error: errorMessage };
  }
}

/**
 * Alias for checkDatabaseConnection to match connection-pool interface
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const result = await checkDatabaseConnection();
  return {
    healthy: result.connected,
    latency: result.latency || 0,
    ...(result.error && { error: result.error }),
  };
}

/**
 * Transaction helper with retry logic
 */
export async function executeTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          return await callback(tx as PrismaClient);
        },
        {
          maxWait: 5000, // 5 seconds max wait to start transaction
          timeout: 10000, // 10 seconds max transaction time
        },
      );
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable (deadlock, serialization failure, etc.)
      const isRetryable =
        lastError.message.includes("deadlock") ||
        lastError.message.includes("serialization") ||
        lastError.message.includes("lock timeout");

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      log.warn("Transaction retry", {
        attempt,
        maxRetries,
        error: lastError.message,
        nextDelay: `${delay}ms`,
      });
    }
  }

  throw lastError as Error;
}

/**
 * Batch operation helper
 */
export async function executeBatch<T>(
  operations: Array<Promise<T>>,
  batchSize = 10,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    // Small delay between batches to prevent overwhelming the database
    if (i + batchSize < operations.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Graceful shutdown
 */
export async function disconnectDatabase() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    log.info("Database connection closed");
  }
}

/**
 * Get database stats (for monitoring)
 * Returns connection health and basic statistics
 */
export async function getDatabaseStats() {
  try {
    const health = await checkDatabaseConnection();
    const info = {
      connected: health.connected,
      latency: health.latency,
      timestamp: new Date().toISOString(),
      provider: process.env["DATABASE_URL"]?.includes("postgresql")
        ? "postgresql"
        : "sqlite",
    };
    return info;
  } catch (error) {
    log.error("Failed to get database stats", { error });
    return {
      connected: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default prisma;
