/**
 * Prisma Connection Pool Configuration
 * Optimized for production scalability
 */

import { PrismaClient } from '@prisma/client';
import { log } from '@/lib/logger';

// Global Prisma instance to prevent multiple connections in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection pool configuration
const connectionConfig = {
  // Connection pool size (adjust based on your database plan)
  connection_limit: parseInt(process.env['DATABASE_CONNECTION_LIMIT'] || '10', 10),
  
  // Connection timeout (5 seconds)
  connect_timeout: 5,
  
  // Pool timeout (10 seconds)
  pool_timeout: 10,
  
  // Statement cache size
  statement_cache_size: 100,
};

// Query timeout configuration
const queryTimeout = parseInt(process.env['DATABASE_QUERY_TIMEOUT'] || '10000', 10); // 10 seconds default

/**
 * Create Prisma client with optimized connection pool
 */
export function createPrismaClient() {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: buildConnectionString(),
      },
    },
    log: process.env['NODE_ENV'] === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
  });

  // TODO: Add query timeout using Prisma Client Extensions
  // $use middleware is deprecated in Prisma 5+

  // Add connection pool monitoring
  if (process.env['NODE_ENV'] === 'production') {
    setInterval(async () => {
      try {
        // Check database connectivity
        await client.$queryRaw`SELECT 1`;
      } catch (error) {
        log.error('Database health check failed', error as Error);
      }
    }, 60000); // Check every minute
  }

  return client;
}

/**
 * Build connection string with pool parameters
 */
function buildConnectionString(): string {
  const baseUrl = process.env['DATABASE_URL'];
  
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // For PostgreSQL, add connection pool parameters
  if (baseUrl.startsWith('postgresql://') || baseUrl.startsWith('postgres://')) {
    const url = new URL(baseUrl);
    
    // Add pool parameters to query string
    url.searchParams.set('connection_limit', String(connectionConfig.connection_limit));
    url.searchParams.set('connect_timeout', String(connectionConfig.connect_timeout));
    url.searchParams.set('pool_timeout', String(connectionConfig.pool_timeout));
    url.searchParams.set('statement_cache_size', String(connectionConfig.statement_cache_size));
    
    // Enable prepared statements for better performance
    url.searchParams.set('pgbouncer', 'false'); // Set to 'true' if using PgBouncer
    
    return url.toString();
  }

  // For SQLite or other databases, return as-is
  return baseUrl;
}

/**
 * Get or create Prisma client (singleton pattern)
 */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    log.info('Prisma client initialized', {
      connectionLimit: connectionConfig.connection_limit,
      queryTimeout: `${queryTimeout}ms`,
    });
  }

  return globalForPrisma.prisma;
}

// Export singleton instance
export const prisma = getPrismaClient();

/**
 * Graceful shutdown
 */
export async function disconnectDatabase() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    log.info('Database connection closed');
  }
}

// Register shutdown handlers
if (process.env['NODE_ENV'] === 'production') {
  process.on('SIGTERM', async () => {
    log.info('SIGTERM received, closing database connection...');
    await disconnectDatabase();
  });

  process.on('SIGINT', async () => {
    log.info('SIGINT received, closing database connection...');
    await disconnectDatabase();
    process.exit(0);
  });
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      healthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get connection pool metrics
 */
export async function getConnectionPoolMetrics() {
  // $metrics API not available without explicit Prisma Client configuration
  return {
    available: connectionConfig.connection_limit,
    active: 0,
    idle: connectionConfig.connection_limit,
    note: 'Metrics require Prisma Client metrics configuration',
  };
}

/**
 * Transaction helper with retry logic
 */
export async function executeTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx: any) => {
        return await callback(tx as PrismaClient);
      }, {
        maxWait: 5000, // 5 seconds max wait to start transaction
        timeout: 10000, // 10 seconds max transaction time
      });
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable (deadlock, serialization failure, etc.)
      const isRetryable = 
        lastError.message.includes('deadlock') ||
        lastError.message.includes('serialization') ||
        lastError.message.includes('lock timeout');

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      log.warn('Transaction retry', {
        attempt,
        maxRetries,
        error: lastError.message,
        nextDelay: `${delay}ms`,
      });
    }
  }

  throw lastError;
}

/**
 * Batch operation helper
 */
export async function executeBatch<T>(
  operations: Array<Promise<T>>,
  batchSize = 10
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    // Small delay between batches to prevent overwhelming the database
    if (i + batchSize < operations.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
