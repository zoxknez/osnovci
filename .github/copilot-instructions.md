# Osnovci - AI Coding Instructions

## Project Overview
**Osnovci** is a Next.js 15 PWA for elementary students and parents to manage homework, schedules, grades, and analytics. Built with TypeScript, Prisma, NextAuth v5, and focuses heavily on COPPA/GDPR compliance for children's safety.

## Key Architecture Patterns

### App Router Structure (Next.js 15)
- **Route Groups**: `(auth)` for login/register, `(dashboard)` for protected pages
- **Server Components**: Default, use `"use client"` only when needed
- **API Routes**: Follow pattern `app/api/[resource]/route.ts` with proper HTTP methods
- **Middleware**: Lightweight security headers only, auth handled in layouts/API routes

### Database & Auth Patterns
```typescript
// Always include relations in Prisma queries for performance
const user = await prisma.user.findFirst({
  include: { student: true, guardian: true }
});

// NextAuth v5 session access (app router)
import { auth } from "@/lib/auth/config";
const session = await auth();
```

### Component Organization
- **UI Components**: `components/ui/` - Radix-based, shadcn/ui style
- **Features**: `components/features/` - Business logic components  
- **Route-specific**: `app/(group)/page/components/` - Page-specific components
- **Error Boundaries**: Always wrap risky operations, especially camera/PWA features

### State Management Conventions
- **Zustand**: Global state in `store/index.ts`, avoid prop drilling
- **React Query**: Server state, caching, background sync
- **Form State**: React Hook Form + Zod validation
- **Theme/Settings**: Context providers in `app/providers.tsx`

## Development Workflows

### Database Operations
```bash
# Never run migrations directly - use push for development
npm run db:push          # Push schema changes
npm run db:seed:demo      # Seed with demo data (preferred)
npm run db:reset:demo     # Reset & seed (destructive)
npm run db:studio         # Visual database browser
```

### Testing Strategy
- **Vitest + Testing Library**: Component & utility testing
- **Coverage**: Focus on business logic, not UI components
- **Test Files**: `__tests__/` mirrors `src` structure
```typescript
// Test pattern for components with auth
render(<Component />, { wrapper: TestProviders });
```

### Build & Performance
- **Turbopack**: Development mode (`npm run dev`)
- **Bundle Analysis**: `npm run build:analyze` when investigating size
- **Lighthouse**: `npm run lighthouse` for performance auditing
- **Image Optimization**: Next.js Image component, WebP/AVIF formats

## Security & Compliance Critical Points

### COPPA/GDPR for Children
- **Age Verification**: All students need `parentalConsentGiven: true`
- **Activity Logging**: `ActivityLog` model tracks all student actions
- **Content Filtering**: `lib/safety/` handles inappropriate content detection
- **Parental Oversight**: Guardian access to all student data via `Link` model

### Authentication Patterns
```typescript
// Account lockout after failed attempts
import { recordLoginAttempt, isAccountLocked } from "@/lib/auth/account-lockout";

// Biometric auth for quick access  
import { authenticateWithBiometric } from "@/lib/auth/biometric";
```

### Security Headers & CSP
- **Strict CSP**: Configured in `next.config.ts`, different for dev/prod
- **Security Headers**: Automatically applied, no HSTS in development
- **Input Validation**: All forms use Zod schemas, API routes validate inputs

## PWA & Offline Features

### Service Worker & Caching
- **Workbox**: Precaching static assets, runtime caching for API calls
- **Offline Storage**: IndexedDB via `idb` for homework attachments
- **Sync Manager**: `components/features/sync-manager.tsx` handles background sync

### Camera & Image Handling
```typescript
// Modern Camera API with compression
import { ModernCamera } from "@/components/features/modern-camera";
// Always compress images before upload (target: <1MB)
import imageCompression from 'browser-image-compression';
```

## Data Flow Patterns

### Student-Guardian Relationship
1. Student registers → generates 6-digit `linkCode` in `Link` model
2. Guardian scans QR code → enters code → relationship established
3. Guardian gets read-access to all student data via shared queries

### Homework Workflow
1. **Create**: `status: ASSIGNED` → Student adds `Attachment[]`
2. **Submit**: `status: SUBMITTED` → Guardian can review
3. **Review**: Guardian adds `reviewNote` → `status: REVIEWED`

### Gamification System
- **XP Calculation**: Based on homework completion, streaks, early submission
- **Achievements**: Unlocked via `AchievementType` enum triggers
- **Levels**: XP thresholds defined in `lib/gamification/`

## Common Integration Points

### Email System
- **Verification**: `lib/email/` handles SMTP via Nodemailer
- **Templates**: HTML templates for verification, parental consent
- **Rate Limiting**: Upstash Redis prevents abuse

### Push Notifications  
```typescript
import { showLocalNotification } from "@/lib/notifications/push";
// Templates for common scenarios
import { notificationTemplates } from "@/lib/notifications/push";
```

### Logging & Monitoring
```typescript
import { log } from "@/lib/logger";
log.info("User action", { userId, metadata });
log.error("Operation failed", error, { context });
```

## Performance Considerations

- **Image Compression**: 50-70% size reduction, WebP format preference
- **Bundle Splitting**: Lazy load heavy components (camera, charts)
- **Database Indexes**: Compound indexes on frequently queried combinations
- **Caching Strategy**: Static assets (1 year), API calls (5 minutes), user data (session-based)

## Common Gotchas

- **Environment Variables**: Use `lib/env.ts` for validation, never expose secrets to client
- **Route Protection**: Auth handled in page layouts, not middleware
- **File Uploads**: Always validate file types, compress images, scan for malicious content
- **Serbian Language**: UI text in Serbian (Latin), database stores Serbian locale as `SR_LATN`
- **Child Safety**: Any user-generated content must pass through `lib/safety/content-filter`

## Key Files for Reference
- **Auth Config**: `lib/auth/config.ts` (NextAuth v5 setup)
- **Database Schema**: `prisma/schema.prisma` (comprehensive data model)
- **Component Library**: `components/ui/` (Radix-based components)
- **Error Handling**: `components/error-boundary.tsx` (app-wide error catching)
- **PWA Config**: `next.config.ts` (security headers, PWA settings)