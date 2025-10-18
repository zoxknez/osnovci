# 🚀 Dodatna Unapređenja - Performanse, Sigurnost & Optimizacija

**Datum:** 17. Oktobar 2025  
**Status:** Analiza i Preporuke

---

## 📊 Executive Summary

Trenutni projekat je **odlično strukturiran** sa mnogo implementiranih best practice-a. Ipak, identifikovano je **15 oblasti** za dodatna unapređenja u 3 kategorije:

- **🚀 Performanse:** 6 optimizacija
- **🔒 Sigurnost:** 5 poboljšanja  
- **⚡ Optimizacija:** 4 dodatka

**Priority Matrix:**
- 🔴 High Priority (kritično za production): 6 stavki
- 🟡 Medium Priority (poboljšanje UX): 5 stavki
- 🟢 Low Priority (nice-to-have): 4 stavke

---

## 🚀 PERFORMANSE (6 Optimizacija)

### 1. 🔴 Database Connection Pooling (PostgreSQL)

**Status:** SQLite trenutno, nema pooling potrebe  
**Za Production:** PostgreSQL će trebati optimizaciju

**Problem:**
```typescript
// lib/db/prisma.ts - Trenutno
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
// Nema connection pooling konfiguracije
```

**Rešenje:**
```typescript
// lib/db/prisma.ts - Optimized
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  ...(process.env.NODE_ENV === "production" && {
    // Prisma connection pool configuration
    // https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
  }),
});

// U .env za PostgreSQL production:
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20&statement_cache_size=100"
```

**Alternativa:** Prisma Accelerate (managed pooling)
```typescript
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())
```

**Impact:** 🔴 High (Production Only)  
**Effort:** 1 sat  
**Priority:** High za production

---

### 2. 🟡 React Query / SWR za Data Caching

**Problem:** Svaki page fetch-uje podatke iznova na svakom renderu

**Trenutno:**
```typescript
// Svaki put fetch iz baze
const homework = await prisma.homework.findMany({...})
```

**Rešenje:** Dodati React Query ili SWR za client-side caching

```bash
npm install @tanstack/react-query
```

```typescript
// lib/hooks/use-homework.ts
import { useQuery } from '@tanstack/react-query';

export function useHomework() {
  return useQuery({
    queryKey: ['homework'],
    queryFn: async () => {
      const res = await fetch('/api/homework');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchOnWindowFocus: true,
  });
}
```

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      cacheTime: 1000 * 60 * 30, // 30 min
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Benefit:**
- Automatsko caching podataka
- Pozadinska revalidacija
- Optimistic updates
- Menos API poziva

**Impact:** 🟡 Medium (UX poboljšanje)  
**Effort:** 3 sata  
**Priority:** Medium

---

### 3. 🟡 Image Optimization - Next.js Image Component

**Problem:** Slike se učitavaju kao plain `<img>` tagovi

**Trenutno:** Manual image handling
```typescript
<img src={homework.attachment} alt="Dokaz" />
```

**Rešenje:** Koristiti Next.js `<Image>` component
```typescript
import Image from 'next/image';

<Image
  src={homework.attachment}
  alt="Dokaz"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
  loading="lazy"
  quality={85}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Za Database:**
```prisma
model Attachment {
  // Dodati blur hash za placeholder
  blurHash String?
}
```

**Benefit:**
- Automatic WebP/AVIF conversion
- Lazy loading
- Blur placeholder
- Responsive images
- ~60% manje download size

**Impact:** 🟡 Medium  
**Effort:** 2 sata  
**Priority:** Medium

---

### 4. 🟢 Service Worker Improvements - Advanced Caching

**Trenutno:** Basic Service Worker (`public/sw.js`)

**Predlog:** Workbox stratégije za optimalan caching

```typescript
// lib/service-worker/strategies.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// API requests - Network First (fresh data)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 min
      }),
    ],
  })
);

// Images - Cache First (performance)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dana
      }),
    ],
  })
);

// Fonts - Cache First
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 godina
      }),
    ],
  })
);

// HTML pages - Stale While Revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  })
);
```

**Benefit:**
- Brži load times (servira iz cache)
- Offline support za API pozive
- Pametno cache invalidation

**Impact:** 🟢 Low  
**Effort:** 2 sata  
**Priority:** Low

---

### 5. 🟡 Database Query Optimization

**Problem:** Neki query-ji fetch-uju više nego što treba

**Primer:**
```typescript
// app/api/homework/route.ts - BEFORE
const homework = await prisma.homework.findMany({
  where: { studentId },
  include: {
    subject: true, // Sve polja
    attachments: true, // SVE attachments!
  },
});
// Ako neki homework ima 50 slika, fetch-uje sve!
```

**Optimizovano:**
```typescript
// AFTER - Select samo potrebno
const homework = await prisma.homework.findMany({
  where: { studentId },
  select: {
    id: true,
    title: true,
    dueDate: true,
    status: true,
    priority: true,
    subject: {
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
      },
    },
    attachments: {
      select: {
        id: true,
        type: true,
        thumbnail: true, // Samo thumbnail za listing
      },
      take: 3, // Limit na 3 thumbnails
    },
    _count: {
      select: {
        attachments: true, // Count total attachments
      },
    },
  },
  orderBy: { dueDate: 'asc' },
  take: 50, // Limit rezultata
});
```

**Dodatno:** Paginacija za large datasets
```typescript
const page = parseInt(searchParams.get('page') || '1');
const limit = 20;
const skip = (page - 1) * limit;

const [homework, total] = await Promise.all([
  prisma.homework.findMany({
    where: { studentId },
    skip,
    take: limit,
    // ... rest
  }),
  prisma.homework.count({ where: { studentId } }),
]);

return {
  data: homework,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
};
```

**Impact:** 🟡 Medium  
**Effort:** 2 sata (Audit all queries)  
**Priority:** Medium

---

### 6. 🔴 Redis za Rate Limiting (Production)

**Problem:** In-memory rate limiter gubi state na restart

**Trenutno:**
```typescript
// middleware/rate-limit.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  // Gubi se na restart!
}
```

**Rešenje:** Redis za perzistentan rate limiting

```bash
npm install ioredis @upstash/ratelimit
```

```typescript
// lib/rate-limit/redis.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 req/min
  analytics: true,
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/min
  analytics: true,
});

export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 req/hour
  analytics: true,
});
```

**Upotreba:**
```typescript
// app/api/homework/route.ts
import { apiRateLimit } from '@/lib/rate-limit/redis';

export async function POST(req: Request) {
  const identifier = getClientId(req);
  const { success } = await apiRateLimit.limit(identifier);
  
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // ... rest of handler
}
```

**Benefit:**
- Perzistentan state
- Distribuiran rate limiting (multiple servers)
- Analytics

**Alternative:** Upstash Redis (free tier 10k requests/day)

**Impact:** 🔴 High (Production)  
**Effort:** 2 sata  
**Priority:** High za production

---

## 🔒 SIGURNOST (5 Poboljšanja)

### 7. 🔴 CSRF Protection

**Problem:** Nema CSRF token validacije za POST/PUT/DELETE

**Rešenje:** Dodati CSRF middleware

```bash
npm install csrf
```

```typescript
// lib/security/csrf.ts
import csrf from 'csrf';

const tokens = new csrf();

export function generateCsrfToken(): string {
  const secret = tokens.secretSync();
  const token = tokens.create(secret);
  return token;
}

export function verifyCsrfToken(token: string, secret: string): boolean {
  return tokens.verify(secret, token);
}

// Middleware
export async function csrfMiddleware(req: Request): Promise<boolean> {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers.get('x-csrf-token');
    const csrfSecret = req.headers.get('x-csrf-secret');
    
    if (!csrfToken || !csrfSecret) {
      return false;
    }
    
    return verifyCsrfToken(csrfToken, csrfSecret);
  }
  
  return true; // GET requests ne trebaju CSRF
}
```

**Usage:**
```typescript
// app/api/homework/route.ts
export async function POST(req: Request) {
  if (!await csrfMiddleware(req)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  
  // ... rest
}
```

**Impact:** 🔴 High  
**Effort:** 2 sata  
**Priority:** High

---

### 8. 🟡 Input Sanitization - DOMPurify

**Status:** Već implementiran `isomorphic-dompurify`, ali treba proširiti

**Dodatno:** Server-side sanitization za sve user inpute

```typescript
// lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags
    KEEP_CONTENT: true,
  }).trim();
}

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

// Zod schema sa sanitization
export const homeworkSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeString),
  description: z.string().max(2000).transform(sanitizeHtml).optional(),
  // ...
});
```

**Apply na sve API routes:**
```typescript
// app/api/homework/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate & sanitize
  const validated = homeworkSchema.parse(body);
  
  // Now safe to use
  const homework = await prisma.homework.create({
    data: validated,
  });
  
  return NextResponse.json(homework);
}
```

**Impact:** 🟡 Medium  
**Effort:** 3 sata (Apply to all routes)  
**Priority:** Medium

---

### 9. 🔴 SQL Injection Protection via Prisma

**Status:** ✅ Already protected (Prisma uses parameterized queries)

**Ali:** Dodatni layer - Input validation

```typescript
// lib/security/validators.ts
import { z } from 'zod';

// ID validation - samo alphanumeric
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/);

// Safe integer
export const safeIntSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

// Email validation
export const emailSchema = z.string().email().toLowerCase().max(255);

// Phone validation (Serbian format)
export const phoneSchema = z.string().regex(/^(\+381|0)[0-9]{8,9}$/);
```

**Apply svugde:**
```typescript
// app/api/homework/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Validate ID format BEFORE querying database
  const validatedId = idSchema.parse(params.id);
  
  const homework = await prisma.homework.findUnique({
    where: { id: validatedId },
  });
  
  return NextResponse.json(homework);
}
```

**Impact:** 🔴 High (Defense in depth)  
**Effort:** 2 sata  
**Priority:** High

---

### 10. 🟡 File Upload Security

**Trenutno:** `browser-image-compression` za slike

**Dodatno:** Server-side validation i anti-malware

```typescript
// lib/security/file-upload.ts
import { createHash } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function validateFileUpload(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Fajl je prevelik (max 10MB)' };
  }
  
  // 2. Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Nedozvoljen tip fajla' };
  }
  
  // 3. Check file signature (magic bytes)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  if (file.type === 'image/jpeg') {
    // JPEG starts with FF D8 FF
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      return { valid: false, error: 'Korumpiran JPEG fajl' };
    }
  } else if (file.type === 'image/png') {
    // PNG starts with 89 50 4E 47
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
      return { valid: false, error: 'Korumpiran PNG fajl' };
    }
  }
  
  // 4. Generate hash for duplicate detection
  const hash = createHash('sha256').update(bytes).digest('hex');
  
  return { valid: true };
}
```

**Server-side endpoint:**
```typescript
// app/api/upload/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // Validate
  const validation = await validateFileUpload(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // Process...
  // Upload to S3/Cloudinary/etc
  
  return NextResponse.json({ url: uploadedUrl });
}
```

**Impact:** 🟡 Medium  
**Effort:** 2 sata  
**Priority:** Medium

---

### 11. 🟢 Security Headers Enhancement

**Trenutno:** Dobre security headers u `next.config.ts`

**Dodatno:** Subresource Integrity (SRI) za CDN resurse

```typescript
// next.config.ts
export default {
  // ... existing config
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // ... existing headers
          
          // Dodatno:
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          {
            key: 'Expect-CT',
            value: 'max-age=86400, enforce',
          },
        ],
      },
    ];
  },
};
```

**Dodati SRI za CDN resurse:**
```html
<!-- app/layout.tsx -->
<link 
  rel="stylesheet" 
  href="https://cdn.example.com/styles.css"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossOrigin="anonymous"
/>
```

**Impact:** 🟢 Low  
**Effort:** 30 min  
**Priority:** Low

---

## ⚡ OPTIMIZACIJA (4 Dodatka)

### 12. 🟡 Error Tracking - Sentry Integration

**Predlog:** Integrisati Sentry za error tracking

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

**Usage:**
```typescript
// app/api/homework/route.ts
import * as Sentry from '@sentry/nextjs';

export async function POST(req: Request) {
  try {
    // ... logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/homework',
        method: 'POST',
      },
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    });
    
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**Alternative:** LogRocket, Rollbar, BugSnag

**Impact:** 🟡 Medium  
**Effort:** 1 sat  
**Priority:** Medium

---

### 13. 🟢 Bundle Size Optimization

**Analyze trenutni bundle:**
```bash
npm install -D @next/bundle-analyzer
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

**Run:**
```bash
ANALYZE=true npm run build
```

**Optimizacije:**

1. **Dynamic Imports** za teške komponente:
```typescript
// components/heavy-chart.tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./chart'), {
  loading: () => <p>Učitavanje grafikona...</p>,
  ssr: false, // Ako nije potreban SSR
});
```

2. **Tree Shaking** - import samo što treba:
```typescript
// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports only what's needed
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

3. **Replace heavy libraries:**
```typescript
// ❌ moment.js (70kb)
import moment from 'moment';

// ✅ date-fns (lightweight)
import { format, parseISO } from 'date-fns';
```

**Impact:** 🟢 Low (ali bolje UX)  
**Effort:** 2 sata  
**Priority:** Low

---

### 14. 🟡 API Response Compression

**Predlog:** Compress API responses (gzip/brotli)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

export async function middleware(req: Request) {
  const response = await NextResponse.next();
  
  // Check if client accepts gzip
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  
  if (acceptEncoding.includes('gzip') && req.url.startsWith('/api/')) {
    const body = await response.text();
    
    // Compress only if > 1KB
    if (body.length > 1024) {
      const compressed = await gzipAsync(body);
      
      return new NextResponse(compressed, {
        ...response,
        headers: {
          ...response.headers,
          'Content-Encoding': 'gzip',
          'Content-Length': String(compressed.length),
        },
      });
    }
  }
  
  return response;
}
```

**Alternative:** Use CDN with automatic compression (Cloudflare, Vercel Edge)

**Impact:** 🟡 Medium (smanjuje bandwidth)  
**Effort:** 1 sat  
**Priority:** Medium

---

### 15. 🟢 Database Backups - Automated

**Trenutno:** Manual backup (`prisma/dev.db.backup`)

**Predlog:** Automated backup script

```typescript
// scripts/backup-db.ts
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { format } from 'date-fns';

const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
const backupFile = `prisma/backups/backup_${timestamp}.db`;

// SQLite backup
execSync(`cp prisma/dev.db ${backupFile}`);

// PostgreSQL backup (production)
if (process.env.DATABASE_URL?.includes('postgresql')) {
  const pgDump = execSync('pg_dump $DATABASE_URL').toString();
  writeFileSync(`prisma/backups/backup_${timestamp}.sql`, pgDump);
}

console.log(`✅ Backup created: ${backupFile}`);
```

**Cron Job (Linux/Mac):**
```bash
# crontab -e
# Backup svaki dan u 3am
0 3 * * * cd /path/to/project && npm run db:backup
```

**Package.json:**
```json
{
  "scripts": {
    "db:backup": "tsx scripts/backup-db.ts"
  }
}
```

**Cloud Backup:** Upload na S3/Google Cloud Storage

**Impact:** 🟢 Low (ali kritično za recovery)  
**Effort:** 1 sat  
**Priority:** Low (High za production)

---

## 📊 Priority Matrix

### 🔴 High Priority (Implementirati odmah)

1. **Database Connection Pooling** (za production)
2. **Redis Rate Limiting** (za production)
3. **CSRF Protection**
4. **SQL Injection Prevention (validation layer)**

**Total Effort:** ~7 sati  
**Impact:** Kritično za sigurnost i skalabilnost

---

### 🟡 Medium Priority (Implementirati uskoro)

5. **React Query / SWR** (caching)
6. **Image Optimization**
7. **Database Query Optimization**
8. **Input Sanitization**
9. **File Upload Security**
10. **Error Tracking (Sentry)**
11. **API Response Compression**

**Total Effort:** ~15 sati  
**Impact:** Značajno poboljšanje UX i sigurnosti

---

### 🟢 Low Priority (Nice-to-have)

12. **Service Worker Advanced Caching**
13. **Security Headers Enhancement**
14. **Bundle Size Optimization**
15. **Automated Database Backups**

**Total Effort:** ~6 sati  
**Impact:** Marginalno poboljšanje

---

## 🎯 Recommended Implementation Order

### Phase 1: Security (1 week)
1. CSRF Protection
2. Input Sanitization na svim API routes
3. SQL Injection validation layer
4. File Upload Security

### Phase 2: Performance (1 week)
5. React Query integration
6. Image Optimization
7. Database Query Optimization
8. Bundle Size Analysis & Optimization

### Phase 3: Infrastructure (1 week)
9. Redis Rate Limiting setup
10. Database Connection Pooling (za production)
11. Error Tracking (Sentry)
12. API Response Compression

### Phase 4: Polish (3 days)
13. Service Worker improvements
14. Security Headers enhancement
15. Automated Backups

**Total Implementation Time:** ~3-4 nedelje (part-time)

---

## 🚀 Quick Wins (< 2h svaki)

Ako želiš brze rezultate, počni sa:

1. ✅ **Input Validation Schemas** (Zod na sve API routes) - 2h
2. ✅ **Image Component Migration** (Next.js Image) - 1h
3. ✅ **Security Headers Enhancement** - 30min
4. ✅ **Bundle Analyzer Setup** - 30min
5. ✅ **Error Tracking (Sentry)** - 1h

**Total:** 5 sati za 5 unapređenja!

---

## 📚 Resources

### Performance
- [Next.js Performance Guide](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Query Docs](https://tanstack.com/query/latest)
- [Web.dev Performance](https://web.dev/performance/)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [Prisma Security Guide](https://www.prisma.io/docs/guides/database/advanced-database-tasks/security)

### Optimization
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

## ✅ Zaključak

Projekat je već **veoma dobro strukturiran** sa mnogim best practice-ima implementiranim:

**✅ Već implementirano:**
- Auth middleware
- Rate limiting (in-memory)
- Security headers
- Error boundaries
- Content filtering
- Accessibility features
- Dark mode
- PWA support

**🚀 Preporučeno za production:**
- Redis rate limiting
- Database connection pooling
- CSRF protection
- Sentry error tracking
- Input validation na svim API routes

**🎯 Quick Wins:**
- React Query za caching
- Next.js Image za optimizaciju slika
- Bundle size optimization

---

**Next Steps:**  
1. Review ovu listu sa timom
2. Prioritize based on production timeline
3. Create tasks u project managementu
4. Start with Quick Wins za brze rezultate

Pitanja? Trebaju li ti code snippets za bilo koju stavku? 🚀

