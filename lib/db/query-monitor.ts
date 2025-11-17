/**
 * Database Query Performance Monitoring
 * Logs slow queries and provides insights
 */

import type { PrismaClient } from "@prisma/client";
import { log } from "@/lib/logger";

interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

/**
 * Configure Prisma query logging for performance monitoring
 *
 * @example
 * ```ts
 * import { configurePrismaLogging } from "@/lib/db/query-monitor";
 * configurePrismaLogging(prisma);
 * ```
 */
export function configurePrismaLogging(prisma: PrismaClient) {
  // Import queryMetrics to avoid circular dependency
  // queryMetrics is exported at the bottom of this file
  // Enable query logging in development
  if (process.env.NODE_ENV === "development") {
    prisma.$on("query" as never, (e: QueryEvent) => {
      const duration = e.duration;

      // Track all queries for metrics
      const queryName = e.target || "unknown";
      queryMetrics.track(queryName, duration);

      // Log slow queries (>100ms by default, configurable)
      const slowQueryThreshold = parseInt(
        process.env["SLOW_QUERY_THRESHOLD"] || "100",
        10,
      );
      
      if (duration > slowQueryThreshold) {
        log.warn("Slow database query detected", {
          query: e.query,
          duration: `${duration}ms`,
          target: e.target,
          params: e.params,
          threshold: `${slowQueryThreshold}ms`,
        });
      }

      // Log all queries in verbose mode
      if (process.env["DATABASE_LOGGING"] === "verbose") {
        log.debug("Database query executed", {
          query: e.query,
          duration: `${duration}ms`,
          target: e.target,
        });
      }
    });
  }
}

/**
 * Query performance middleware
 * Tracks query execution time and logs metrics
 */
export function createQueryMetricsMiddleware() {
  const queryMetrics: Map<
    string,
    { count: number; totalDuration: number; avgDuration: number; maxDuration: number; minDuration: number }
  > = new Map();

  // Limit metrics to prevent memory leak
  const MAX_METRICS = 1000;

  return {
    /**
     * Track query execution
     */
    track(queryName: string, duration: number) {
      const existing = queryMetrics.get(queryName) || {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
      };

      existing.count += 1;
      existing.totalDuration += duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.minDuration = Math.min(existing.minDuration, duration);

      queryMetrics.set(queryName, existing);

      // Limit metrics size to prevent memory leaks
      if (queryMetrics.size > MAX_METRICS) {
        // Remove oldest metric (simplified - remove first entry)
        const firstKey = queryMetrics.keys().next().value;
        if (firstKey) {
          queryMetrics.delete(firstKey);
        }
      }
    },

    /**
     * Get metrics for a specific query
     */
    getMetrics(queryName: string) {
      return queryMetrics.get(queryName);
    },

    /**
     * Get all metrics
     */
    getAllMetrics() {
      return Array.from(queryMetrics.entries()).map(([name, metrics]) => ({
        query: name,
        ...metrics,
      }));
    },

    /**
     * Get slowest queries
     */
    getSlowestQueries(limit = 10) {
      return this.getAllMetrics()
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, limit);
    },

    /**
     * Reset metrics
     */
    reset() {
      queryMetrics.clear();
    },

    /**
     * Log metrics summary
     */
    logSummary() {
      const metrics = this.getAllMetrics();
      const slowest = this.getSlowestQueries(5);

      log.info("Database query metrics", {
        totalQueries: metrics.reduce((sum, m) => sum + m.count, 0),
        uniqueQueries: metrics.length,
        slowestQueries: slowest.map((q) => ({
          query: q.query,
          avgDuration: `${q.avgDuration.toFixed(2)}ms`,
          count: q.count,
        })),
      });
    },
  };
}

/**
 * Global query metrics instance
 */
export const queryMetrics = createQueryMetricsMiddleware();

/**
 * Log metrics periodically (only if enabled)
 */
if (process.env.NODE_ENV === "production" && process.env["ENABLE_QUERY_METRICS"] === "true") {
  setInterval(
    () => {
      try {
        queryMetrics.logSummary();
      } catch (error) {
        // Silently fail - metrics are non-critical
      }
    },
    1000 * 60 * 5,
  ); // 5 minutes
}
