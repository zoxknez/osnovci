/**
 * Performance Monitoring Utilities
 * Track and monitor application performance metrics
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Measure execution time of async function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure execution time of sync function
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>,
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(
    name: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      ...(metadata !== undefined && { metadata }),
    });

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for operation
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, { count: number; avg: number; max: number }> {
    const summary: Record<
      string,
      { count: number; avg: number; max: number }
    > = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, avg: 0, max: 0 };
      }

      const stats = summary[metric.name]!;
      stats.count++;
      stats.max = Math.max(stats.max, metric.duration);
      stats.avg = (stats.avg * (stats.count - 1) + metric.duration) / stats.count;
    }

    return summary;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for functions
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = fn(...args);
      const duration = performance.now() - start;

      if (result instanceof Promise) {
        return result
          .then((value) => {
            performanceMonitor['recordMetric'](name, duration);
            return value;
          })
          .catch((error) => {
            performanceMonitor['recordMetric'](name, duration, { error: true });
            throw error;
          });
      }

      performanceMonitor['recordMetric'](name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor['recordMetric'](name, duration, { error: true });
      throw error;
    }
  }) as T;
}

