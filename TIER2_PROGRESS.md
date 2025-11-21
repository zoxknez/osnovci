# Tier 2 Improvements Progress

## Scalability & Optimization (Phase 6)

### ✅ Completed
- [x] **Database Scalability**: Consolidated connection pooling, transaction retries, and batching into `lib/db/prisma.ts`.
- [x] **Offline Optimization**: Implemented LZ-string compression for `IndexedDB` storage (`lib/offline/indexeddb.ts`).
- [x] **Service Worker Upgrade**: 
  - Created `app/api/sync/route.ts` for background sync via Server Actions.
  - Updated `public/sw.js` to use the new sync endpoint and handle file uploads correctly.
  - Bumped cache version to `osnovci-v5`.
- [x] **Background Workers**: Initialized BullMQ workers in `instrumentation.ts` for email, notifications, and reports.
- [x] **Bundle Optimization**:
  - Lazy loaded `ParentalAnalytics` (heavy `recharts` dependency) in `roditelj/page.tsx`.
  - Lazy loaded `jspdf` (via `exportGradesToPDF`) in `ocene/page.tsx`.
- [x] **Advanced Caching**: Implemented Redis caching for Homework, Grades, and Schedule actions (`app/actions/`).
- [x] **Monitoring**: Sentry performance monitoring is active (`sentry.server.config.ts`).

### ⏳ Pending / Next Steps
- [ ] **Testing**: Run load tests (Artillery). `load-test.yml` created. Run with `npx artillery run load-test.yml`.

## Notes
- `lib/security/rate-limit.ts` and `lib/middleware/rate-limit.ts` coexist. `app/api/upload` uses the security one. Future refactoring could consolidate these.
- `public/sw.js` is a manual implementation. Future upgrade to Workbox (via `next-pwa` config) is possible but current implementation is robust enough for now.
