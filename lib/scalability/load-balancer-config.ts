/**
 * Load Balancer Configuration and Health Check
 * Prepares application for horizontal scaling
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { checkDatabaseHealth } from '@/lib/database/connection-pool';

// Server instance ID (unique per container/process)
export const SERVER_ID = process.env['SERVER_ID'] || `server-${Date.now()}`;

// Startup timestamp
const STARTUP_TIME = Date.now();

// Graceful shutdown flag
let isShuttingDown = false;

// Request counter for load monitoring
let requestCount = 0;
let errorCount = 0;

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  serverId: string;
  uptime: number;
  timestamp: number;
  checks: {
    database: {
      healthy: boolean;
      latency: number;
      error?: string;
    };
    memory: {
      healthy: boolean;
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      healthy: boolean;
      usage: number;
    };
  };
  metrics: {
    requestCount: number;
    errorCount: number;
    errorRate: number;
  };
}

/**
 * Deep health check (for load balancer)
 */
export async function deepHealthCheck(): Promise<HealthCheckResponse> {
  // Check database
  const dbHealth = await checkDatabaseHealth();

  // Check memory
  const memUsage = process.memoryUsage();
  const memHealthy = memUsage.heapUsed / memUsage.heapTotal < 0.9;

  // Check CPU (estimated from process)
  const cpuUsage = process.cpuUsage();
  const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage
  const cpuHealthy = cpuPercentage < 80;

  // Calculate overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (!dbHealth.healthy || !memHealthy || !cpuHealthy) {
    status = 'degraded';
  }
  
  if (isShuttingDown) {
    status = 'unhealthy';
  }

  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

  return {
    status,
    serverId: SERVER_ID,
    uptime: Date.now() - STARTUP_TIME,
    timestamp: Date.now(),
    checks: {
      database: dbHealth,
      memory: {
        healthy: memHealthy,
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        healthy: cpuHealthy,
        usage: cpuPercentage,
      },
    },
    metrics: {
      requestCount,
      errorCount,
      errorRate,
    },
  };
}

/**
 * Shallow health check (for quick liveness probe)
 */
export async function shallowHealthCheck(): Promise<{
  status: 'ok' | 'shutting_down';
  serverId: string;
  uptime: number;
}> {
  return {
    status: isShuttingDown ? 'shutting_down' : 'ok',
    serverId: SERVER_ID,
    uptime: Date.now() - STARTUP_TIME,
  };
}

/**
 * Readiness check (is server ready to accept traffic?)
 */
export async function readinessCheck(): Promise<boolean> {
  if (isShuttingDown) {
    return false;
  }

  // Check database connectivity
  const dbHealth = await checkDatabaseHealth();
  
  return dbHealth.healthy;
}

// ============================================
// REQUEST TRACKING
// ============================================

/**
 * Track incoming request
 */
export function trackRequest() {
  requestCount++;
}

/**
 * Track error
 */
export function trackError() {
  errorCount++;
}

/**
 * Get request metrics
 */
export function getRequestMetrics() {
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
  
  return {
    total: requestCount,
    errors: errorCount,
    errorRate,
    uptime: Date.now() - STARTUP_TIME,
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
  requestCount = 0;
  errorCount = 0;
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Initiate graceful shutdown
 */
export async function initiateShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  log.info('Graceful shutdown initiated', { signal, serverId: SERVER_ID });

  // Give load balancer time to remove this instance from rotation
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

  // Close database connections
  try {
    const { disconnectDatabase } = await import('@/lib/database/connection-pool');
    await disconnectDatabase();
  } catch (error) {
    log.error('Error closing database', error as Error);
  }

  // Close queue workers
  try {
    // Workers handle their own shutdown via SIGTERM
    log.info('Queue workers shutting down');
  } catch (error) {
    log.error('Error closing workers', error as Error);
  }

  log.info('Graceful shutdown completed', { serverId: SERVER_ID });
}

// Register shutdown handlers
if (process.env['NODE_ENV'] === 'production') {
  process.on('SIGTERM', async () => {
    await initiateShutdown('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await initiateShutdown('SIGINT');
    process.exit(0);
  });
}

// ============================================
// LOAD BALANCING HEADERS
// ============================================

/**
 * Add load balancing headers to response
 */
export function addLoadBalancingHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Server-ID', SERVER_ID);
  response.headers.set('X-Server-Uptime', String(Date.now() - STARTUP_TIME));
  
  return response;
}

/**
 * Check if request should be handled (for circuit breaker)
 */
export function shouldHandleRequest(): boolean {
  if (isShuttingDown) {
    return false;
  }

  // Check if server is overloaded
  const memUsage = process.memoryUsage();
  const memoryOverload = memUsage.heapUsed / memUsage.heapTotal > 0.95;
  
  if (memoryOverload) {
    log.warn('Server overloaded, rejecting request', {
      memoryPercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    });
    return false;
  }

  return true;
}

// ============================================
// SESSION AFFINITY
// ============================================

/**
 * Generate session affinity cookie value
 */
export function generateAffinityCookie(): string {
  return `${SERVER_ID}-${Date.now()}`;
}

/**
 * Parse session affinity cookie
 */
export function parseAffinityCookie(cookie: string): {
  serverId: string;
  timestamp: number;
} | null {
  try {
    const parts = cookie.split('-');
    if (parts.length !== 2) return null;
    
    const [serverId, timestampStr] = parts;
    if (!serverId || !timestampStr) return null;
    
    return {
      serverId,
      timestamp: parseInt(timestampStr, 10),
    };
  } catch {
    return null;
  }
}

/**
 * Check if request should be handled by this server (for session affinity)
 */
export function isAffinityMatch(req: NextRequest): boolean {
  const cookie = req.cookies.get('server-affinity')?.value;
  
  if (!cookie) {
    return true; // No affinity set, handle request
  }

  const affinity = parseAffinityCookie(cookie);
  
  if (!affinity) {
    return true; // Invalid cookie, handle request
  }

  return affinity.serverId === SERVER_ID;
}

// ============================================
// LOAD BALANCER CONFIGURATION
// ============================================

export const loadBalancerConfig = {
  // Health check endpoints
  healthEndpoint: '/api/health',
  readinessEndpoint: '/api/ready',
  livenessEndpoint: '/api/alive',

  // Health check intervals
  healthCheckInterval: 30, // seconds
  healthCheckTimeout: 5, // seconds

  // Graceful shutdown
  gracefulShutdownDelay: 5, // seconds
  shutdownTimeout: 30, // seconds

  // Session affinity
  sessionAffinityEnabled: true,
  affinityCookieName: 'server-affinity',
  affinityCookieMaxAge: 3600, // 1 hour

  // Load balancing algorithm suggestions
  // - Round Robin: Simple, works well for stateless apps
  // - Least Connections: Better for long-running requests
  // - IP Hash: Natural session affinity
  // - Weighted: For servers with different capacities
  recommendedAlgorithm: 'least-connections',

  // Circuit breaker thresholds
  maxErrorRate: 10, // percentage
  maxMemoryUsage: 90, // percentage
  maxCpuUsage: 80, // percentage
};

/**
 * Example Nginx configuration for reference
 */
export const nginxConfigExample = `
# upstream configuration
upstream osnovci_backend {
    least_conn;  # Use least connections algorithm
    
    server app1.example.com:3000 max_fails=3 fail_timeout=30s;
    server app2.example.com:3000 max_fails=3 fail_timeout=30s;
    server app3.example.com:3000 max_fails=3 fail_timeout=30s;
    
    # Health check
    # Requires nginx-plus or custom module
}

server {
    listen 80;
    server_name osnovci.app;
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://osnovci_backend;
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
    }
    
    # Main application
    location / {
        proxy_pass http://osnovci_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
`;

/**
 * Example Docker Compose configuration for horizontal scaling
 */
export const dockerComposeExample = `
version: '3.8'

services:
  app:
    image: osnovci:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        max_attempts: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/osnovci
      - REDIS_URL=redis://redis:6379
      - SERVER_ID={{.Service.Name}}-{{.Task.Slot}}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    depends_on:
      - db
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=osnovci
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - db-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  db-data:
  redis-data:
`;
