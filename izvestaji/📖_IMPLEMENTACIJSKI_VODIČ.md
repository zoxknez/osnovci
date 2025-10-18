# 📖 Implementacijski Vodič - Korak po Korak

**Kako da primenite bezbednosna i performance unapređenja**

---

## 🎯 Quick Start - Top 5 Prioriteta

### 1. 🔒 CSRF Protection (30 min)

**a) Instalacija:**
```bash
# Već instalirano - crypto je built-in Node.js
```

**b) Dodaj u `.env`:**
```env
CSRF_SECRET="your-random-32-character-string-here"
```

**c) Generiši secret:**
```bash
openssl rand -base64 32
```

**d) Primeni na API routes:**
```typescript
// app/api/homework/route.ts
import { csrfMiddleware } from "@/lib/security/csrf";

export async function POST(req: Request) {
  // Proveri CSRF token
  const csrfResult = await csrfMiddleware(req);
  if (!csrfResult.valid) {
    return NextResponse.json(
      { error: csrfResult.error },
      { status: 403 }
    );
  }
  
  // Rest of your code...
}
```

**e) Client-side - Dodaj u fetch pozive:**
```typescript
// components/forms/homework-form.tsx
import { generateCsrfToken } from "@/lib/security/csrf";

async function submitHomework(data: FormData) {
  const { token, secret } = generateCsrfToken();
  
  const res = await fetch("/api/homework", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
      "X-CSRF-Secret": secret,
    },
    body: JSON.stringify(data),
  });
}
```

---

### 2. ✅ Input Validation (1 sat)

**Apply na SVIM API routes:**

```typescript
// app/api/homework/route.ts
import { idSchema } from "@/lib/security/validators";
import { z } from "zod";

// Define schema
const createHomeworkSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  subjectId: idSchema, // Validates ID format
  dueDate: z.string().datetime(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate
    const validated = createHomeworkSchema.parse(body);
    
    // Now safe to use
    const homework = await prisma.homework.create({
      data: validated,
    });
    
    return NextResponse.json(homework);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    // ...
  }
}
```

**Primeni na sve API routes:**
- `/api/homework/route.ts`
- `/api/grades/route.ts`
- `/api/subjects/route.ts`
- `/api/schedule/route.ts`
- `/api/profile/route.ts`
- `/api/events/route.ts`

---

### 3. 🚀 React Query Setup (1 sat)

**a) Instalacija:**
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**b) Update `app/layout.tsx`:**
```typescript
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="sr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**c) Koristi hooks u komponentama:**
```typescript
// app/(dashboard)/dashboard/domaci/page.tsx
"use client";

import { useHomework } from "@/lib/hooks/use-react-query";

export default function DomaciPage() {
  const { data: homework, isLoading, error } = useHomework();
  
  if (isLoading) return <div>Učitavanje...</div>;
  if (error) return <div>Greška: {error.message}</div>;
  
  return (
    <div>
      {homework.map(item => (
        <HomeworkCard key={item.id} homework={item} />
      ))}
    </div>
  );
}
```

**d) Mutations (Create/Update/Delete):**
```typescript
import { useCreateHomework } from "@/lib/hooks/use-react-query";

function CreateHomeworkForm() {
  const createHomework = useCreateHomework();
  
  const handleSubmit = async (data) => {
    try {
      await createHomework.mutateAsync(data);
      toast.success("Domaći kreiran!");
    } catch (error) {
      toast.error("Greška");
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button type="submit" disabled={createHomework.isPending}>
        {createHomework.isPending ? "Čuvanje..." : "Kreiraj"}
      </button>
    </form>
  );
}
```

---

### 4. 🖼️ Image Optimization (30 min)

**Zameni `<img>` sa `<Image>`:**

**Before:**
```typescript
<img 
  src="/images/homework.jpg" 
  alt="Domaći" 
  className="w-full h-64 object-cover"
/>
```

**After:**
```typescript
import Image from "next/image";

<Image
  src="/images/homework.jpg"
  alt="Domaći"
  width={800}
  height={600}
  className="w-full h-64 object-cover"
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
  quality={85}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Za dinamičke slike:**
```typescript
<Image
  src={homework.attachment.url}
  alt={homework.title}
  width={800}
  height={600}
  className="rounded-lg"
  unoptimized={homework.attachment.url.startsWith('http')} // Za external URLs
/>
```

---

### 5. 📊 Database Query Optimization (1 sat)

**Before (Fetches sve):**
```typescript
const homework = await prisma.homework.findMany({
  where: { studentId },
  include: {
    subject: true, // ALL fields
    attachments: true, // ALL attachments!
  },
});
```

**After (Optimized):**
```typescript
const homework = await prisma.homework.findMany({
  where: { studentId },
  select: {
    id: true,
    title: true,
    dueDate: true,
    status: true,
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
        thumbnail: true,
      },
      take: 3, // Limit attachments
    },
    _count: {
      select: { attachments: true }, // Count total
    },
  },
  orderBy: { dueDate: "asc" },
  take: 50, // Limit results
});
```

**Primeni na:**
- `/api/homework/route.ts`
- `/api/grades/route.ts`
- `/api/schedule/route.ts`

---

## 🔐 Production Checklist

### Pre-deployment (Must Have)

- [ ] **Environment Variables**
  - `NEXTAUTH_SECRET` (32+ characters)
  - `CSRF_SECRET` (32+ characters)
  - `DATABASE_URL` (PostgreSQL)
  
- [ ] **Security**
  - [x] Auth middleware active (✅ već implementirano)
  - [ ] CSRF protection na POST/PUT/DELETE
  - [ ] Input validation na svim API routes
  - [ ] Rate limiting active
  - [x] Security headers configured (✅ već u next.config.ts)
  
- [ ] **Performance**
  - [ ] Database connection pooling configured
  - [ ] Image optimization (Next.js Image)
  - [ ] Bundle size analyzed (<200kb initial load)
  - [ ] React Query caching implemented
  
- [ ] **Monitoring**
  - [ ] Error tracking (Sentry)
  - [ ] Analytics (Vercel Analytics)
  - [ ] Database backups automated

---

## 🚀 Step-by-Step Full Implementation

### Week 1: Security Hardening

#### Day 1: CSRF Protection
```bash
# 1. Dodaj CSRF_SECRET u .env
echo 'CSRF_SECRET="'$(openssl rand -base64 32)'"' >> .env

# 2. Apply na API routes
# - app/api/homework/route.ts
# - app/api/grades/route.ts
# - app/api/profile/route.ts

# 3. Test
npm run dev
# Try POST without CSRF token - should get 403
```

#### Day 2-3: Input Validation
```typescript
// Create schemas za sve API endpoints
// Apply z.parse() na svim req.json() pozivima
// Test sa invalid inputs
```

#### Day 4: File Upload Security
```typescript
// Apply validateFileUpload() na upload endpoint
// Test sa malicious files (exe, php, scripts)
```

#### Day 5: Security Audit
```bash
# Run security checks
npm audit
npm audit fix

# Check dependencies
npm outdated

# Test auth flows
# Test rate limiting
```

---

### Week 2: Performance Optimization

#### Day 1: React Query Setup
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools

# Update app/layout.tsx
# Create app/providers.tsx
# Test basic query
```

#### Day 2: Convert Pages to React Query
```typescript
// Convert dashboard pages:
// - app/(dashboard)/dashboard/page.tsx
// - app/(dashboard)/dashboard/domaci/page.tsx
// - app/(dashboard)/dashboard/ocene/page.tsx
// - app/(dashboard)/dashboard/raspored/page.tsx
```

#### Day 3: Image Optimization
```typescript
// Find all <img> tags
# grep -r "<img" app/ components/

// Replace with <Image>
// Test lazy loading
// Measure performance (Lighthouse)
```

#### Day 4: Database Query Optimization
```typescript
// Audit all Prisma queries
# grep -r "prisma." app/api/

// Add select: {} to all queries
// Add pagination where needed
// Test performance
```

#### Day 5: Bundle Analysis
```bash
npm install -D @next/bundle-analyzer

# Update next.config.ts
# Run analysis
ANALYZE=true npm run build

# Identify large bundles
# Apply dynamic imports where needed
```

---

### Week 3: Infrastructure & Monitoring

#### Day 1: Redis Rate Limiting (Production)
```bash
# Sign up for Upstash Redis (free tier)
# Get connection URL and token

# Add to .env
echo 'UPSTASH_REDIS_REST_URL="..."' >> .env
echo 'UPSTASH_REDIS_REST_TOKEN="..."' >> .env

# Install package
npm install @upstash/ratelimit @upstash/redis

# Apply to API routes
```

#### Day 2: Database Connection Pooling
```typescript
// Update lib/db/prisma.ts
// Configure connection pool
// Test with load

# Update DATABASE_URL
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20"
```

#### Day 3: Error Tracking (Sentry)
```bash
# Sign up for Sentry (free tier)
npm install @sentry/nextjs

# Run wizard
npx @sentry/wizard -i nextjs

# Test error reporting
```

#### Day 4: Automated Backups
```bash
# Create backup script
# scripts/backup-db.ts

# Test backup
npm run db:backup

# Setup cron job (production)
crontab -e
# Add: 0 3 * * * cd /path/to/app && npm run db:backup
```

#### Day 5: Performance Testing
```bash
# Lighthouse CI
npm install -D @lhci/cli

# Run tests
lhci autorun

# Analyze results
# Fix performance issues
```

---

## 📊 Testing Checklist

### Security Testing

- [ ] **CSRF Attack Prevention**
  ```bash
  # Try POST without CSRF token
  curl -X POST http://localhost:3000/api/homework \
    -H "Content-Type: application/json" \
    -d '{"title": "Test"}'
  
  # Should return 403 Forbidden
  ```

- [ ] **SQL Injection Prevention**
  ```bash
  # Try injection in ID parameter
  curl http://localhost:3000/api/homework/1%27%20OR%20%271%27=%271
  
  # Should return 400 Bad Request (validation error)
  ```

- [ ] **XSS Prevention**
  ```bash
  # Try XSS in input
  curl -X POST http://localhost:3000/api/homework \
    -H "Content-Type: application/json" \
    -d '{"title": "<script>alert(1)</script>"}'
  
  # Should be sanitized
  ```

- [ ] **Rate Limiting**
  ```bash
  # Send 101 requests in 1 minute
  for i in {1..101}; do
    curl http://localhost:3000/api/homework
  done
  
  # Last requests should return 429 Too Many Requests
  ```

---

### Performance Testing

- [ ] **Page Load Speed**
  ```bash
  # Run Lighthouse
  npm run build
  npm start
  
  # Open Chrome DevTools → Lighthouse
  # Target: Score > 90 for Performance
  ```

- [ ] **API Response Time**
  ```bash
  # Measure API response
  time curl http://localhost:3000/api/homework
  
  # Target: < 200ms
  ```

- [ ] **Bundle Size**
  ```bash
  ANALYZE=true npm run build
  
  # Target: First Load JS < 200kb
  ```

- [ ] **Database Query Performance**
  ```typescript
  // Enable query logging
  // lib/db/prisma.ts
  const prisma = new PrismaClient({
    log: ["query"],
  });
  
  // Check slow queries (> 100ms)
  ```

---

## 🎯 Success Metrics

### Before vs After

| Metric | Before | Target | Priority |
|--------|--------|--------|----------|
| Lighthouse Performance | 70-80 | >90 | High |
| First Contentful Paint | ~2s | <1.5s | High |
| Time to Interactive | ~3s | <2.5s | High |
| Bundle Size | ~300kb | <200kb | Medium |
| API Response Time | ~300ms | <200ms | High |
| SQL Queries per Page | 10-15 | <5 | High |

### Security Posture

- [x] Auth Middleware ✅
- [ ] CSRF Protection ⏳
- [ ] Input Validation ⏳
- [ ] Rate Limiting (in-memory) ✅
- [ ] Rate Limiting (Redis) ⏳
- [x] Security Headers ✅
- [ ] File Upload Security ⏳
- [ ] Error Tracking ⏳

---

## 📚 Reference Links

### Documentation
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [React Query Docs](https://tanstack.com/query/latest)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Tools
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Sentry](https://sentry.io)
- [Upstash Redis](https://upstash.com)

---

## ❓ FAQ

**Q: Da li je CSRF zaštita neophodna?**  
A: Da, za production svakako. Sprečava cross-site request forgery napade.

**Q: Da li React Query zamenjuje state management?**  
A: Delimično. Za server state (API data) - da. Za UI state - i dalje koristiti useState/Zustand.

**Q: Koliko košta Sentry/Upstash?**  
A: Oba imaju free tier koji je dovoljan za mali projekat:
- Sentry: 5k events/month free
- Upstash: 10k requests/day free

**Q: Kada prelaziti sa SQLite na PostgreSQL?**  
A: Za production obavezno PostgreSQL. SQLite je samo za development.

**Q: Koliko vremena traje implementacija svih unapređenja?**  
A: ~3-4 nedelje part-time. Prioriteti:
1. Security (1 week) - Must have
2. Performance (1 week) - Should have
3. Monitoring (1 week) - Nice to have

---

**Sledeći koraci:**
1. Review ovaj vodič
2. Odredi prioritete
3. Započni sa Week 1: Security
4. Testiraj nakon svake izmene

Pitanja? Need help? Javi se! 🚀

