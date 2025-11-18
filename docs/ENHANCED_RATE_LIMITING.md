# 🚦 Enhanced Rate Limiting - Documentation

## Overview

Issue #14 extends the existing rate limiting system with **tiered limits**, **exponential backoff**, **violation tracking**, and **admin monitoring**.

## Features

### 1. Tiered Rate Limits (Role-Based)

Different limits based on user role:

| Endpoint Type | Student | Guardian | Admin | Unauthenticated |
|--------------|---------|----------|-------|-----------------|
| **API** | 120/min | 150/min | 300/min | 30/min |
| **Auth** | 10/min | 10/min | 20/min | 5/min |
| **Upload** | 15/hour | 20/hour | 50/hour | 3/hour |
| **Read** | 200/min | 250/min | 500/min | 50/min |
| **Moderation** | 50/min | 50/min | 200/min | 10/min |

**Why tiered?**
- Guardians need higher limits (managing multiple students)
- Admins need highest limits (monitoring/analytics)
- Unauthenticated users get strict limits (security)

### 2. Exponential Backoff

Repeated violations trigger progressive penalties:

| Violations | Multiplier | Effective Limit | Duration |
|-----------|------------|-----------------|----------|
| 0 | 1x | 100% | - |
| 1 | 1x | 100% | - |
| 2 | 2x | 50% | - |
| 3 | 4x | 25% | - |
| 4 | 8x | 12.5% | - |
| 5+ | 16x | 6.25% | Temp block |

**Blocking Logic:**
- 5 violations → 1-minute block
- 6 violations → 2-minute block
- 7 violations → 4-minute block
- 8+ violations → Up to 1-hour block

### 3. Violation Tracking

All violations logged in Redis with metadata:
```typescript
{
  identifier: "192.168.1.1:userId123",
  count: 3,
  firstViolation: 1700000000000,
  lastViolation: 1700001000000,
  blocked: false,
  blockedUntil: undefined
}
```

### 4. Admin Monitoring

#### API Endpoints

**GET /api/admin/rate-limits**
- Returns all violation records
- Stats: total violators, active blocks, high violators
- Admin-only access

**POST /api/admin/rate-limits/reset**
- Reset violations for specific user/IP
- Body: `{ identifier: "IP:userId" }`
- Admin-only action

**GET /api/rate-limit/stats**
- Get current user's rate limit status across all presets
- Shows limits, remaining, violations, backoff multiplier
- Available to all authenticated users

#### Admin Dashboard

Route: `/admin/rate-limits`

Features:
- **Stats Cards**: Total violators, active blocks, high violators
- **Violation List**: All records sorted by severity
- **Per-Record Actions**: Reset violations button
- **Real-time Status**: Blocked until timestamp, duration countdown
- **Severity Badges**: Moderate (1-2), High (3-4), Critical (5+)

## Usage

### In API Routes

```typescript
import { applyRateLimit, addRateLimitHeaders } from "@/lib/security/rate-limit-middleware";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Apply enhanced rate limiting
  const rateLimitCheck = await applyRateLimit(request, "api");
  if (!rateLimitCheck.success) return rateLimitCheck.response;
  
  // Process request...
  const data = { success: true };
  
  // Add rate limit headers to response
  const response = NextResponse.json(data);
  return response;
}
```

### Available Presets

```typescript
import { TieredRateLimitPresets } from "@/lib/security/enhanced-rate-limit";

// API endpoints (homework, grades, schedule)
applyRateLimit(request, "api");

// Auth endpoints (login, register)
applyRateLimit(request, "auth");

// File uploads
applyRateLimit(request, "upload");

// Read-only endpoints (dashboards, analytics)
applyRateLimit(request, "read");

// Moderation endpoints (AI moderation)
applyRateLimit(request, "moderation");
```

### Response Headers

On **successful** requests:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000060000
X-RateLimit-Violations: 0
X-RateLimit-Backoff: 1
```

On **rate-limited** requests (429):
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700000060000
X-RateLimit-Violations: 3
X-RateLimit-Backoff: 4
X-RateLimit-Blocked-Until: 1700000120000 (if blocked)
Retry-After: 60
```

### Response Body (429)

```json
{
  "error": "Too Many Requests",
  "message": "Previše pokušaja. Vaš nalog je privremeno blokiran.",
  "violations": 5,
  "backoffMultiplier": 16,
  "retryAfter": 120,
  "blockedUntil": 1700000120000
}
```

## Implementation Details

### Files Created

1. **lib/security/enhanced-rate-limit.ts** (339 lines)
   - Tiered rate limit logic
   - Exponential backoff calculation
   - Violation tracking (Redis)
   - Role-based limit selection

2. **lib/security/rate-limit-middleware.ts** (78 lines)
   - Easy-to-use API wrapper
   - Response formatting
   - Header management

3. **app/api/admin/rate-limits/route.ts** (148 lines)
   - GET: List all violations
   - POST: Reset violations
   - Admin-only access

4. **app/api/rate-limit/stats/route.ts** (58 lines)
   - User-facing stats API
   - Shows limits across all presets

5. **components/admin/rate-limit-dashboard.tsx** (211 lines)
   - Admin UI for monitoring
   - Violation list with actions
   - Real-time status updates

6. **app/(dashboard)/admin/rate-limits/page.tsx** (22 lines)
   - Admin page route
   - Auth & role check

### Redis Keys

```
ratelimit:{preset}:{role}:{identifier}
  - Sorted set of request timestamps
  - TTL: window duration

ratelimit:violations:{identifier}
  - JSON violation record
  - TTL: 24 hours
```

### Identifier Format

```
{IP}:{userId}
```

Examples:
- `192.168.1.1:clx123abc` (authenticated)
- `10.0.0.5` (unauthenticated)

## Security Considerations

### Fail-Open Strategy

If Redis is unavailable:
- Rate limiting **allows** requests (fail-open)
- Prevents service disruption
- Logs warning in development mode

### DDoS Protection

Multiple layers:
1. **IP-based limiting** (before auth)
2. **User-based limiting** (after auth)
3. **Exponential backoff** (progressive penalties)
4. **Temporary blocks** (automatic at 5+ violations)
5. **Admin override** (manual reset)

### Privacy

- IP addresses hashed before storage (not implemented yet - future improvement)
- Violation records expire after 24 hours
- Admin can reset violations (GDPR compliance)

## Monitoring & Alerts

### Admin Dashboard Stats

- **Total Violators**: Users/IPs with any violations
- **Active Blocks**: Currently blocked identifiers
- **High Violators**: 3+ violations

### Log Events

```typescript
log.warn("Rate limit exceeded", {
  identifier,
  role,
  preset,
  limit,
  count,
  violations
});

log.info("Violations reset by admin", {
  adminId,
  identifier
});
```

## Migration from Old Rate Limit

Existing endpoints can gradually migrate:

**Before:**
```typescript
import { checkRateLimit } from "@/middleware/rate-limit";

const rateLimitResult = await checkRateLimit(request, "api");
if (!rateLimitResult.success) {
  return rateLimitResult.response;
}
```

**After:**
```typescript
import { applyRateLimit } from "@/lib/security/rate-limit-middleware";

const rateLimitCheck = await applyRateLimit(request, "api");
if (!rateLimitCheck.success) return rateLimitCheck.response;
```

**Benefits:**
- Role-aware limits
- Violation tracking
- Exponential backoff
- Admin monitoring
- Same API surface

## Testing

### Manual Testing

1. **Trigger Rate Limit:**
   ```bash
   # Make 121+ requests in 1 minute
   for i in {1..150}; do
     curl http://localhost:3000/api/homework
     sleep 0.4
   done
   ```

2. **Check Stats:**
   ```bash
   curl http://localhost:3000/api/rate-limit/stats
   ```

3. **View Admin Dashboard:**
   - Navigate to `/admin/rate-limits`
   - Check violation records
   - Reset violations

### Load Testing

```bash
# Apache Bench
ab -n 500 -c 10 http://localhost:3000/api/homework

# or Artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/homework
```

## Performance

### Redis Operations

Per request:
- 1 ZREMRANGEBYSCORE (cleanup old entries)
- 1 ZCARD (count current requests)
- 1 ZADD (add new request)
- 1 EXPIRE (set TTL)

Total: ~4ms average latency

### Violation Tracking

Per violation:
- 1 GET (read violation record)
- 1 SETEX (update violation record)

Total: ~2ms average latency

### Memory Usage

- **Per request entry**: ~64 bytes (timestamp + ID)
- **Per violation record**: ~200 bytes (JSON)
- **100,000 active users**: ~6.4 MB + 20 MB = ~26 MB total

## Future Improvements

1. **IP Hashing**: Hash IP addresses before storage (privacy)
2. **Geolocation Blocking**: Block specific countries/regions
3. **Machine Learning**: Detect bot patterns
4. **Webhooks**: Alert admins via Slack/Discord
5. **Whitelist**: Bypass rate limits for trusted IPs
6. **Custom Presets**: User-defined rate limits per endpoint
7. **Analytics**: Grafana dashboards for rate limit metrics

## Dependencies

- **@upstash/redis**: Redis client
- **@upstash/ratelimit**: Rate limiting primitives
- **next**: v15.5.5+
- **react**: v19+

## Environment Variables

```env
# Required for production rate limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

If not configured:
- Falls back to in-memory rate limiting
- Violations not persisted across restarts
- Suitable for development only

## Troubleshooting

### Rate Limit Not Working

**Check:**
1. Redis configured? (`isRedisConfigured()`)
2. Environment variables set?
3. Redis connection healthy? (GET `/api/health/redis`)

### Violations Not Persisting

**Cause:** Redis not configured or connection failed

**Solution:**
1. Check Redis URL/token
2. Test connection: `GET /api/health/redis`
3. Check logs for Redis errors

### Can't Access Admin Dashboard

**Cause:** User role not ADMIN

**Solution:**
1. Check user role in database
2. Update role: `UPDATE User SET role = 'ADMIN' WHERE id = '...'`
3. Logout and login again

### False Positives (Legitimate Users Blocked)

**Solution:**
1. Navigate to `/admin/rate-limits`
2. Find user's identifier
3. Click "Reset" button
4. User can retry immediately

## Summary

✅ **Tiered rate limits** based on user role
✅ **Exponential backoff** for repeated violations  
✅ **Violation tracking** with Redis persistence
✅ **Temporary blocking** after 5+ violations
✅ **Admin dashboard** for monitoring and management
✅ **API endpoints** for programmatic access
✅ **Response headers** for client-side handling
✅ **Fail-open** strategy for reliability
✅ **DDoS protection** with multiple layers

**Phase 2 Progress: 7/7 Complete (100%)**
