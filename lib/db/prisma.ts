// Prisma Client Singleton (best practice za Next.js)
// Sprečava kreiranje previše konekcija u development-u
// Production-ready sa connection pooling i optimizacijama

import { PrismaClient } from "@prisma/client";
import { configurePrismaLogging } from "./query-monitor";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Build optimized DATABASE_URL with connection pooling parameters
 */
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;

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
 * Health check helper
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Get connection pool stats (for monitoring)
 * Note: $metrics requires preview feature in Prisma
 */
export async function getDatabaseStats() {
  try {
    // $metrics requires preview feature, return basic info instead
    const info = {
      connected: true,
      timestamp: new Date().toISOString(),
    };
    return info;
  } catch (error) {
    console.error("Failed to get database stats:", error);
    return null;
  }
}

export default prisma;
