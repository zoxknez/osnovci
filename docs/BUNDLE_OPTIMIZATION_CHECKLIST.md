# Bundle Optimization Checklist

## Heavy Dependencies to Lazy Load

### ✅ Already Optimized
- [x] ModernCamera - Lazy loaded in domaci/page.tsx
- [x] Grade Charts - Dynamic import in ocene/page.tsx

### ⏳ TODO - High Priority
- [ ] Recharts library (if used)
- [ ] PDF viewer components
- [ ] Rich text editors
- [ ] Video players
- [ ] 3D graphics libraries

### ⏳ TODO - Medium Priority
- [ ] Date picker libraries
- [ ] File upload components with preview
- [ ] Syntax highlighters
- [ ] Markdown renderers

### ⏳ TODO - Low Priority
- [ ] Icon libraries (use lucide-react tree-shaking)
- [ ] Animation libraries
- [ ] Utility libraries

## Code Splitting Strategies

### Route-based Splitting
```typescript
// Next.js does this automatically
// Each page in app/ is a separate chunk
```

### Component-based Splitting
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

### Library-based Splitting
```typescript
// Instead of:
import _ from 'lodash';

// Use:
import debounce from 'lodash/debounce';
```

## Performance Metrics

### Target Metrics
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

### Bundle Size Targets
- Initial JS: < 200KB (gzipped)
- Total JS: < 500KB (gzipped)
- CSS: < 50KB (gzipped)
- Images: Use Next.js Image optimization

## Implementation Steps

1. **Run Bundle Analysis**
   ```bash
   npm run build:analyze
   ```

2. **Identify Large Chunks**
   - Look for files > 200KB in .next/analyze/
   - Check vendor bundles
   - Identify duplicate dependencies

3. **Apply Lazy Loading**
   ```typescript
   const LazyComponent = lazy(() => import('./Component'));
   ```

4. **Verify Improvements**
   ```bash
   npm run lighthouse
   ```

5. **Monitor in Production**
   - Use Vercel Analytics
   - Track bundle size in CI/CD
   - Set up performance budgets

## Common Pitfalls

### ❌ Don't Lazy Load
- Critical above-the-fold components
- Small components (< 20KB)
- Frequently used utilities
- Authentication logic

### ✅ Do Lazy Load
- Modals and dialogs
- Charts and data visualizations
- Camera/media components
- Admin panels
- Help documentation
- Third-party widgets

## Webpack Bundle Analyzer Setup

Already configured in `next.config.ts`:

```typescript
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  return withBundleAnalyzer(config);
}
```

Run with:
```bash
ANALYZE=true npm run build
```
