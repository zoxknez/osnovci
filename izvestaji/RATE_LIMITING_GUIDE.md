# 🚦 API Rate Limiting Guide

## Overview

Aplikacija koristi **Upstash Redis** za implementaciju sliding window rate limitinga, što štiti API od abuse-a i osigurava fer upotrebu resursa za sve korisnike.

## Implementacija

### Rate Limit Mehanizam

**Lokacija:** `lib/security/rate-limit.ts`

**Sliding Window Algoritam:**
- Redis Sorted Set sa timestamp-om kao score
- Automatsko uklanjanje starih unosa
- Failsafe - ako Redis nije dostupan, dozvoljava zahteve (fail open)
- Identifikacija po user ID (ako je autentifikovan) ili IP adresi

### Predefined Presets

```typescript
RateLimitPresets.strict    // 10 requests/min  - Auth endpoints
RateLimitPresets.moderate  // 30 requests/min  - Write operations
RateLimitPresets.relaxed   // 100 requests/min - Read operations
RateLimitPresets.upload    // 5 uploads/5min   - File uploads
```

## Implementirani Endpoints

### 1. Authentication

**Register:** `/api/auth/register`
- **Limit:** 10 requests per minute (strict)
- **Razlog:** Sprečava spam registracije i botove
- **Identifikator:** IP adresa (korisnik nije autentifikovan)

**Login:** (via NextAuth)
- **Limit:** Implementirano preko `account-lockout.ts`
- **5 neuspelih pokušaja** = 15 minuta lockout

### 2. File Upload

**Upload:** `/api/upload`
- **Limit:** 5 uploads per 5 minutes
- **Razlog:** Sprečava flood upload-a, ograničava trošak storage-a
- **Identifikator:** User ID

### 3. Homework API

**Read:** `GET /api/homework`
- **Limit:** 100 requests per minute (relaxed)
- **Razlog:** Read operacije su jeftine, visok limit za UX
- **Identifikator:** User ID

**Write:** `POST /api/homework`
- **Limit:** 30 requests per minute (moderate)
- **Razlog:** Write operacije su skuplje, umereni limit
- **Identifikator:** User ID

## Response Headers

Svaki odgovor sadrži rate limit informacije:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1729534800000
```

Kada je limit prekoračen (429 Too Many Requests):

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1729534860000
Retry-After: 60
```

## Error Response

```json
{
  "error": "Too Many Requests",
  "message": "Previše zahteva. Pokušaj ponovo za par minuta."
}
```

## Implementacija u Novim Endpointima

### Primer - Dodavanje Rate Limitinga

```typescript
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.moderate,
      prefix: "my-endpoint", // Unique prefix per endpoint
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      
      return new Response(
        JSON.stringify({ 
          error: "Too Many Requests", 
          message: "Previše zahteva. Pokušaj ponovo za par minuta." 
        }),
        { 
          status: 429, 
          headers: { 
            ...Object.fromEntries(headers), 
            "Content-Type": "application/json" 
          } 
        },
      );
    }

    // Continue with request logic...
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Custom Rate Limit

```typescript
const rateLimitResult = await rateLimit(request, {
  limit: 20,       // 20 requests
  window: 120,     // per 2 minutes
  prefix: "custom",
});
```

## Testing Rate Limits

### Manual Testing

```bash
# Testiranje registracije (strict - 10/min)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com","password":"Test123!","role":"STUDENT","name":"Test"}' \
    -i | grep "X-RateLimit"
done
```

### Expected Behavior

1. **Prvih 10 zahteva:** Status 200/201, `X-RateLimit-Remaining` opada
2. **11+ zahteva:** Status 429, `Retry-After` header
3. **Nakon window perioda:** Rate limit se resetuje

## Monitoring

### Redis Keys

Rate limit podaci se čuvaju u Redis-u sa TTL:

```
ratelimit:register:ip:192.168.1.100
ratelimit:upload:user:clxxx123
ratelimit:homework:write:user:clyyy456
```

### Upstash Dashboard

1. Otvori [Upstash Console](https://console.upstash.com)
2. Izaberi Redis instancu
3. Proveri keys sa `ratelimit:*` prefiksom
4. Monitoring → Vidi broj zahteva, latency, storage

## Environment Variables

```env
# Required for rate limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

**Development Fallback:**
- Ako Redis nije konfigurisan, rate limiting je **disabled**
- Warning log: "Rate limiting disabled - Upstash Redis not configured"
- Svi zahtevi prolaze (fail open za development)

## Best Practices

### 1. Endpoint-Specific Prefixes
Koristi unique prefix po endpoint tipu:
```typescript
prefix: "auth:register"  // Ne "register"
prefix: "homework:write" // Ne "homework"
```

### 2. Balans Limit/Window
- **Strict** za auth: Mali limit, kratak window
- **Moderate** za write: Umereni limit
- **Relaxed** za read: Visok limit za dobar UX

### 3. User-Friendly Messages
```typescript
message: "Previše pokušaja. Pokušaj za 2 minuta." // ✅ Good
message: "Rate limit exceeded"                     // ❌ Bad
```

### 4. Log Rate Limit Events
```typescript
if (!rateLimitResult.success) {
  log.warn("Rate limit exceeded", {
    endpoint: "/api/upload",
    userId,
    limit: rateLimitResult.limit,
  });
}
```

## Security Considerations

### IP Spoofing Prevention
Rate limiter koristi multiple headers za IP detection:
1. `x-forwarded-for` (Vercel, proxies)
2. `x-real-ip` (Nginx)
3. Fallback: "unknown" (ne blokira)

### Distributed Systems
- Upstash Redis je serverless i globally distributed
- Consistency: Eventually consistent (dovoljno za rate limiting)
- Latency: <50ms worldwide

### Attack Scenarios

**Scenario 1: DDoS Attack**
- Rate limiter automatski blokira IP nakon limite
- Minimal Redis cost (samo metadata storage)

**Scenario 2: Credential Stuffing**
- Account lockout (5 failed attempts)
- Rate limiting na register endpoint
- Combined protection

**Scenario 3: Resource Exhaustion**
- Upload endpoint limitiran na 5/5min
- Sprečava storage flooding
- Automatski cleanup old uploads

## Future Improvements

### Planned Features
- [ ] Dynamic rate limits based on user tier
- [ ] IP whitelist/blacklist
- [ ] Per-endpoint analytics dashboard
- [ ] Automatic threshold adjustment based on load
- [ ] Redis Cluster for higher throughput

### Advanced Patterns
```typescript
// User tier-based limits
const limit = user.isPremium ? 100 : 30;

// Time-of-day based limits (peak hours)
const window = isPeakHours() ? 30 : 60;

// Endpoint-specific multipliers
const config = {
  ...RateLimitPresets.moderate,
  limit: RateLimitPresets.moderate.limit * 2, // 2x for important endpoint
};
```

## Troubleshooting

### Issue: "Too many requests" u developmentu
**Solution:** Proveri da li je UPSTASH_REDIS_REST_URL setovan. Ako nije, rate limiting je disabled.

### Issue: Rate limit ne resetuje
**Solution:** Proveri Redis TTL. Key bi trebalo da ima `EXPIRE` vrednost jednaku window-u.

### Issue: Različiti limiti za isti user
**Solution:** Proveri prefix - različiti endpoints imaju različite limite.

## Conclusion

Rate limiting je **prvi red odbrane** protiv abuse-a i osigurava stabilnost aplikacije. Implementacija je **fail-safe** (ako Redis padne, app radi dalje) i **user-friendly** (jasne poruke i headeri).

**Status:** ✅ Implementirano na 4 kritična endpointa
**Coverage:** Auth, Upload, Homework CRUD
**Next:** Proširiti na sve API endpoints
