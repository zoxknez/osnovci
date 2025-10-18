# ⚡ Performance Testing & Lighthouse Audit Guide

## ✅ Implementirano

### 1. Lighthouse Configuration (`lighthouserc.json`)
- ✅ Desktop preset
- ✅ Multiple pages
- ✅ Performance thresholds
- ✅ Accessibility checks
- ✅ SEO validation
- ✅ Best practices audit

### 2. Lighthouse Audit Script (`scripts/lighthouse-audit.ts`)
- ✅ Automated page audits
- ✅ Core Web Vitals tracking
- ✅ HTML report generation
- ✅ Markdown summary
- ✅ Score badges

### 3. Performance Test Script (`scripts/performance-test.ts`)
- ✅ Load testing
- ✅ Concurrent requests
- ✅ Response time tracking
- ✅ Success rate calculation
- ✅ Percentile metrics (P50, P95, P99)

### 4. NPM Scripts
```bash
npm run lighthouse       # Run Lighthouse audit
npm run lighthouse:ci    # Run Lighthouse CI
npm run perf:test        # Run performance tests
```

## 🚀 Usage

### Lighthouse Audit

#### 1. Start Development Server
```bash
npm run dev
```

#### 2. Run Lighthouse Audit
```bash
# In new terminal
npm run lighthouse

# Output:
# 🚀 Starting Lighthouse audit...
# 📅 Date: 2025-10-17T10:30:00Z
# 🌐 Base URL: http://localhost:3000
#
# 🔍 Auditing: home (/)
#   ✅ Performance: 95
#   ✅ Accessibility: 98
#   ✅ Best Practices: 100
#   ✅ SEO: 100
#
# 📊 LIGHTHOUSE AUDIT SUMMARY
# 📈 Average Scores:
#   Performance:     92/100
#   Accessibility:   96/100
#   Best Practices:  98/100
#   SEO:             98/100
```

#### 3. View Reports
```bash
# HTML reports
open lighthouse-reports/home.report.html
open lighthouse-reports/dashboard.report.html

# Markdown summary
cat lighthouse-reports/summary.md
```

### Performance Testing

#### 1. Run Load Test
```bash
npm run perf:test

# Output:
# 🚀 Starting performance tests...
# 📅 Date: 2025-10-17T10:30:00Z
# 🌐 Base URL: http://localhost:3000
#
# 🔥 Load testing: Home (/)
#   Requests: 100
#   Concurrency: 10
#   Progress: [██████████████████████████] 100% (100/100)
#   ✅ Success: 100/100
#   ❌ Failed: 0
#   ⏱️  Average: 45.23ms
#   🚀 Min: 32.10ms
#   🐌 Max: 89.50ms
#   📊 P50: 43.20ms
#   📊 P95: 67.80ms
#   📊 P99: 82.30ms
#   🔥 RPS: 111.73
```

#### 2. Custom Configuration
```bash
# More concurrent requests
CONCURRENT=20 npm run perf:test

# More total requests
REQUESTS=500 npm run perf:test

# Custom URL
TEST_URL=http://localhost:3000 npm run perf:test

# Longer timeout
TIMEOUT=10000 npm run perf:test
```

## 📊 Performance Targets

### Core Web Vitals

#### Lighthouse Scores
- **Performance**: ≥ 90/100 ✅
- **Accessibility**: ≥ 90/100 ✅
- **Best Practices**: ≥ 90/100 ✅
- **SEO**: ≥ 90/100 ✅

#### Metrics
| Metric | Target | Good | Needs Improvement |
|--------|--------|------|-------------------|
| **FCP** (First Contentful Paint) | < 1.8s | < 2.0s | > 2.0s |
| **LCP** (Largest Contentful Paint) | < 2.5s | < 3.0s | > 3.0s |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 | > 0.25 |
| **TBT** (Total Blocking Time) | < 200ms | < 300ms | > 300ms |
| **SI** (Speed Index) | < 3.0s | < 4.0s | > 4.0s |

### Load Testing Targets

#### Response Time
- **Average**: < 100ms
- **P95**: < 200ms
- **P99**: < 500ms

#### Success Rate
- **Target**: 100%
- **Acceptable**: ≥ 99%
- **Critical**: < 95%

#### Throughput
- **Small app**: 50-100 req/s
- **Medium app**: 100-500 req/s
- **Large app**: 500+ req/s

## 🎯 Optimization Strategies

### 1. Bundle Size
```bash
# Analyze bundle
npm run build:analyze

# Optimize imports
- Tree shaking
- Code splitting
- Dynamic imports
- Remove unused code
```

### 2. Image Optimization
```typescript
// Use Next.js Image component
import Image from "next/image";

<Image
  src="/photo.jpg"
  width={800}
  height={600}
  alt="Photo"
  loading="lazy"
  quality={85}
  placeholder="blur"
/>
```

### 3. Caching Strategy
```typescript
// Static assets: 1 year
Cache-Control: public, max-age=31536000, immutable

// API responses: 5 minutes
Cache-Control: public, max-age=300, s-maxage=600

// Dynamic pages: no cache
Cache-Control: no-cache, no-store, must-revalidate
```

### 4. Database Optimization
```typescript
// Use indexes
@@index([studentId, status])

// Batch queries
const [users, homework] = await Promise.all([
  prisma.user.findMany(),
  prisma.homework.findMany(),
]);

// Use pagination
const homework = await prisma.homework.findMany({
  take: 20,
  skip: page * 20,
});
```

### 5. API Optimization
```typescript
// Use compression
import compression from "compression";
app.use(compression());

// Rate limiting (already implemented)
import { checkRateLimit } from "@/middleware/rate-limit";

// Response caching
import { cacheGet, cacheSet } from "@/lib/upstash";
```

## 🔍 Monitoring

### 1. Vercel Analytics
```typescript
// Already integrated
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

<Analytics />
<SpeedInsights />
```

### 2. Sentry Performance
```typescript
// Already integrated
import { startTransaction } from "@/lib/sentry";

const transaction = startTransaction("loadDashboard", "http.server");
// ... code ...
transaction.finish();
```

### 3. Custom Metrics
```typescript
// Track custom metrics
import { trackAPICall } from "@/lib/sentry";

const start = Date.now();
const response = await fetch("/api/homework");
const duration = Date.now() - start;

trackAPICall("/api/homework", "GET", response.status, duration);
```

## 🚨 Performance Issues

### Issue 1: Slow Initial Load
**Symptoms**: High FCP, LCP
**Solutions**:
- Reduce bundle size
- Enable code splitting
- Optimize fonts
- Use CDN

### Issue 2: Layout Shift
**Symptoms**: High CLS
**Solutions**:
- Set image dimensions
- Reserve space for dynamic content
- Use skeleton loaders
- Avoid layout-triggering CSS

### Issue 3: Slow API Responses
**Symptoms**: High TBT, low throughput
**Solutions**:
- Add database indexes
- Use connection pooling
- Implement caching
- Optimize queries

### Issue 4: Low Success Rate
**Symptoms**: Errors, timeouts
**Solutions**:
- Increase server resources
- Add rate limiting
- Implement retry logic
- Use circuit breaker

## 🧪 CI/CD Integration

### GitHub Actions

#### 1. Create Workflow (`.github/workflows/lighthouse.yml`)
```yaml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Lighthouse CI
        run: npm run lighthouse:ci
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### Vercel Integration

#### 1. Add Lighthouse Check
```json
// vercel.json
{
  "checks": {
    "lighthouse": {
      "performance": 90,
      "accessibility": 90,
      "best-practices": 90,
      "seo": 90
    }
  }
}
```

## 📈 Progressive Enhancement

### 1. Service Worker
```typescript
// Already implemented (next-pwa)
// Offline support
// Background sync
// Push notifications
```

### 2. Image Optimization
```typescript
// Already implemented (Next.js Image)
// WebP/AVIF format
// Lazy loading
// Responsive images
```

### 3. Code Splitting
```typescript
// Dynamic imports
const PDFViewer = dynamic(() => import("./PDFViewer"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

## ✅ Checklist

- [x] Install Lighthouse CLI
- [x] Create lighthouserc.json
- [x] Create lighthouse-audit.ts
- [x] Create performance-test.ts
- [x] Add npm scripts
- [ ] **Run Lighthouse audit** (Manual step)
- [ ] **Fix performance issues** (Manual step)
- [ ] **Run load tests** (Manual step)
- [ ] **Setup CI/CD checks** (Manual step)
- [x] Document procedures

## 🎉 Next Steps

1. **Run Audit**: `npm run lighthouse`
2. **Analyze Results**: Check reports in `lighthouse-reports/`
3. **Fix Issues**: Address performance bottlenecks
4. **Run Load Tests**: `npm run perf:test`
5. **Monitor Production**: Use Vercel Analytics + Sentry
6. **Iterate**: Continuous improvement

---

✅ Performance testing & Lighthouse audit CONFIGURED
📅 Date: 2025-10-17
⚡ Ready for optimization

