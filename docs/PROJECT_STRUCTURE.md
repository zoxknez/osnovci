# 📁 Struktura projekta Osnovci

## Root direktorijum

### ⚙️ Konfiguracioni fajlovi (moraju biti u root-u)
Ovi fajlovi **moraju** ostati u root direktorijumu jer alati automatski traže ove fajlove:

- **`biome.json`** - Biome linter/formatter konfiguracija
- **`postcss.config.mjs`** - PostCSS/Tailwind CSS konfiguracija  
- **`sentry.client.config.ts`** - Sentry client-side error tracking
- **`sentry.edge.config.ts`** - Sentry edge runtime tracking
- **`sentry.server.config.ts`** - Sentry server-side tracking
- **`middleware.ts`** - Next.js middleware (auth, redirects, security headers)
- **`next.config.ts`** - Next.js konfiguracija
- **`tsconfig.json`** - TypeScript konfiguracija
- **`package.json`** - NPM dependencies i scripts

### 🌍 Environment fajlovi
- **`.env`** - Lokalne environment varijable (git ignored)
- **`.env.example`** - Primer environment varijabli (commit-ovan)
- **`.env.local`** - Lokalna override varijable (git ignored)
- **`.env.production`** - Production varijable (kreiran od Vercel CLI)

### 📂 Direktorijumi

#### `app/` - Next.js 15 App Router
- **(auth)/** - Login, registracija, verifikacija
- **(dashboard)/** - Zaštićene stranice (dashboard, zadaci, ocene, raspored, porodica)
- **api/** - API routes (auth, homework, grades, schedule, family)
- **globals.css** - Globalni stilovi
- **layout.tsx** - Root layout
- **providers.tsx** - React context providers

#### `components/` - React komponente
- **ui/** - Osnovne UI komponente (button, input, card, dialog, etc.)
- **features/** - Feature komponente (modern-camera, sync-manager, etc.)
- **modals/** - Modal dialozi
- **onboarding/** - Onboarding flow komponente

#### `lib/` - Biblioteke i utility funkcije
- **auth/** - NextAuth konfiguracija i autentikacija
- **db/** - Prisma database client
- **email/** - Email funkcionalnost (SMTP, templates)
- **gamification/** - XP, achievements, levels
- **notifications/** - Push notifications
- **safety/** - Content filtering (COPPA compliance)
- **logger.ts** - Centralizovano logovanje

#### `prisma/` - Database
- **schema.prisma** - Database schema (PostgreSQL)
- **seed.ts** - Production seed data
- **seed-demo.ts** - Demo accounts (demo1-demo20@osnovci.rs)
- **master-seed.ts** - Master seed (sve varijante)

#### `scripts/` - Utility skripte
- **backup-database.ts** - Database backup
- **backup-to-cloud.ts** - Cloud backup (Vercel Blob)
- **lighthouse-audit.ts** - Performance audit
- **performance-test.ts** - Performance testing
- **check-user.js** - User validation
- **start-server.ps1** - Server starter (PowerShell)
- **start.ps1** - Project starter (PowerShell)

#### `docs/` - Dokumentacija 📚
- **COMMIT_MESSAGE.md** - Git commit guidelines
- **DEPLOY.md** - Deployment guide
- **QUICK_START_DEPLOYMENT.md** - Quick start za deployment
- **TESTING_CHECKLIST.md** - Testing checklist
- **MOBILE_TESTING.md** - Mobile testing guide
- **PROJECT_STRUCTURE.md** - Ovaj dokument

#### `config/` - Test i build konfiguracije
- **vitest.config.ts** - Vitest test runner konfiguracija
- **vitest.setup.ts** - Vitest setup fajl
- **lighthouserc.json** - Lighthouse CI konfiguracija
- **docker-compose.yml** - Docker compose za development

#### `deployment/` - Deployment konfiguracije
- **Dockerfile** - Docker image definition
- **vercel.json** - Vercel deployment konfiguracija

#### `izvestaji/` - Izvještaji i dokumentacija (stari)
Veliki broj markdown fajlova sa izvještajima o razvoju i testiranju.

#### `hooks/` - Custom React hooks
- **use-dyslexia-mode.ts** - Dyslexia režim
- **use-focus-trap.ts** - Accessibility focus trap
- **use-offline-homework.ts** - Offline homework support
- **use-text-to-speech.ts** - Text-to-speech

#### `store/` - Zustand global state
- State management za kompleksne feature-e

#### `types/` - TypeScript type definitions
- Globalne type definicije i interfaces

#### `__tests__/` - Test fajlovi
- **api/** - API route testovi
- **components/** - Component testovi
- **lib/** - Library testovi

#### `middleware/` - Custom middleware
- Dodatni middleware za specifične potrebe

#### `public/` - Static assets
- Icons, images, manifest.json, robots.txt

#### `.github/` - GitHub konfiguracija
- **copilot-instructions.md** - AI coding assistant uputstva
- CI/CD workflows (ako postoje)

#### `.next/` - Next.js build output
Auto-generisano, git ignored.

#### `node_modules/` - NPM dependencies
Auto-generisano, git ignored.

#### `.vercel/` - Vercel deployment cache
Auto-generisano, git ignored.

#### `backups/` - Database backups
SQLite backup fajlovi.

## NPM Scripts

### Development
```bash
npm run dev              # Start development server (Turbopack)
npm run build            # Production build
npm run build:analyze    # Build with bundle analyzer
npm run start            # Start production server
```

### Database
```bash
npm run db:push          # Push schema changes to DB
npm run db:seed          # Seed production data
npm run db:seed:demo     # Seed demo accounts (demo1-demo20@osnovci.rs)
npm run db:seed:master   # Seed sve varijante
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset DB + seed production
npm run db:reset:demo    # Reset DB + seed demo
npm run db:reset:master  # Reset DB + seed master
```

### Testing
```bash
npm run test             # Run tests (watch mode)
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage
npm run test:run         # Run tests once
```

### Code Quality
```bash
npm run lint             # Run Biome linter
npm run format           # Format code with Biome
npm run type-check       # TypeScript type check
```

### Backup & Performance
```bash
npm run backup           # Backup database
npm run backup:list      # List backups
npm run backup:restore   # Restore backup
npm run backup:cloud     # Backup to cloud (Vercel Blob)
npm run lighthouse       # Run Lighthouse audit
npm run lighthouse:ci    # Run Lighthouse CI
npm run perf:test        # Performance testing
```

## Environment Variables

### Required for Production (Vercel)
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
POSTGRES_URL="postgres://user:pass@host:5432/db"
PRISMA_DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://osnovci.vercel.app"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@osnovci.rs"

# Sentry (optional)
SENTRY_ORG="your-org"
SENTRY_PROJECT="osnovci"
SENTRY_AUTH_TOKEN="your-token"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Redis (optional - for rate limiting)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Vercel Blob (optional - for file uploads)
BLOB_READ_WRITE_TOKEN="vercel_blob_xxx"
```

### Demo Accounts
**Email pattern**: `demo1@osnovci.rs` - `demo20@osnovci.rs`  
**Password**: `demo123`

## Git Workflow

### Commit Message Format
```
type(scope): Subject

Body (optional)

Footer (optional)
```

**Types**: feat, fix, docs, style, refactor, test, chore, perf

### Branching
- **master** - Production branch
- **develop** - Development branch (if exists)
- **feature/xxx** - Feature branches
- **fix/xxx** - Bugfix branches

## Deployment

### Vercel (Current)
1. Push to GitHub
2. Vercel auto-deploys from master branch
3. Environment variables set in Vercel Dashboard
4. Live URL: https://osnovci.vercel.app

### Docker (Alternative)
```bash
docker-compose up -d
```

## Performance Targets

- **Lighthouse Score**: >90 (all categories)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3.5s
- **Bundle Size**: <500KB (initial load)

## Security Features

- ✅ CSRF Protection
- ✅ Rate Limiting (via middleware)
- ✅ Content Security Policy
- ✅ XSS Protection headers
- ✅ Account lockout after failed login attempts
- ✅ COPPA compliance (parental consent for children)
- ✅ Activity logging for students
- ✅ Content filtering for inappropriate content

---

**Last Updated**: 2025-10-21  
**Maintained By**: Osnovci Development Team
