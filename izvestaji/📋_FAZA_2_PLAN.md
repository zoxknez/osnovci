# 📋 FAZA 2: PostgreSQL Migration - Detailed Plan

## 🎯 OBJECTIVE

Migrate from SQLite (development) to PostgreSQL (production-ready) database with performance optimizations.

**Estimated Time**: 3-5 days  
**Risk Level**: 🔴 HIGH (data migration)  
**Impact**: 🟢 HIGH (production readiness)

---

## 📊 CURRENT STATE

- **Database**: SQLite (file: `prisma/dev.db`)
- **Schema**: Fully defined with indexes
- **Data**: Demo data + test users
- **Status**: Works perfectly in development

---

## 🎯 TARGET STATE

- **Database**: PostgreSQL 15+ (Supabase/Neon/Railway)
- **Connection**: Pooled via PgBouncer
- **Optimizations**: 
  - Full-text search (pg_trgm extension)
  - JSON indexing (GIN indexes)
  - Optimized query performance
- **Scalability**: Ready for 1000+ concurrent users

---

## 📝 TASKS BREAKDOWN

### **TASK 1: Choose PostgreSQL Provider** (30min)

**Options**:
1. **Supabase** (Recommended)
   - ✅ Free tier: 500MB database
   - ✅ Built-in connection pooler
   - ✅ Auto backups
   - ✅ Easy setup
   - ❌ Limited to 2 projects on free tier

2. **Neon** (Alternative)
   - ✅ Serverless PostgreSQL
   - ✅ Auto-scaling
   - ✅ Branch database support
   - ✅ Free tier: 3GB storage
   - ❌ Cold starts on free tier

3. **Railway** (Alternative)
   - ✅ Simple deployment
   - ✅ $5/month starter plan
   - ❌ No free tier for PostgreSQL

**Decision Criteria**:
- Development: Supabase (best free tier)
- Production: Neon (better scaling)

**Action**:
```bash
# After creating account, get connection string:
postgresql://postgres:[password]@[host].supabase.co:5432/postgres
```

---

### **TASK 2: Update Prisma Schema** (1h)

**Changes Required**:

#### 2.1 Update datasource
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 2.2 Remove SQLite-specific syntax
```prisma
// BEFORE (SQLite)
createdAt DateTime @default(now())

// AFTER (PostgreSQL) - Same! No change needed
createdAt DateTime @default(now())
```

#### 2.3 Add PostgreSQL optimizations
```prisma
model Homework {
  // Existing fields...
  
  // Add full-text search index
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gist)
  
  // Optimize JSON queries
  @@index([metadata(ops: raw("jsonb_path_ops"))], type: Gin)
}
```

---

### **TASK 3: Add PostgreSQL Extensions** (30min)

Create migration file to enable extensions:

```sql
-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text (optional)
CREATE EXTENSION IF NOT EXISTS citext;
```

---

### **TASK 4: Update Environment Variables** (15min)

#### Development (.env.local)
```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/osnovci_dev"

# Connection pooling (optional for dev)
DATABASE_URL_UNPOOLED="postgresql://postgres:password@localhost:5432/osnovci_dev"
```

#### Production (.env.production)
```bash
# Direct connection (for migrations)
DATABASE_URL="postgresql://postgres:password@host.supabase.co:5432/postgres?pgbouncer=true"

# Pooled connection (for app)
DATABASE_URL_UNPOOLED="postgresql://postgres:password@host.supabase.co:6543/postgres"
```

---

### **TASK 5: Create Migration Strategy** (2h)

#### Option A: Fresh Start (Recommended for development)
```bash
# 1. Backup current SQLite data
npx ts-node scripts/backup-database.ts

# 2. Create new PostgreSQL schema
npx prisma migrate dev --name postgresql_init

# 3. Re-seed with demo data
npm run db:seed:demo
```

#### Option B: Data Migration (If preserving data)
```bash
# 1. Export SQLite data
npx prisma db pull

# 2. Generate SQL dump
sqlite3 prisma/dev.db .dump > backup.sql

# 3. Convert SQLite SQL to PostgreSQL SQL (manual editing)
# Fix: INTEGER → SERIAL, TEXT → VARCHAR, etc.

# 4. Import to PostgreSQL
psql $DATABASE_URL < backup_converted.sql
```

**Recommendation**: Use **Option A** for cleaner migration.

---

### **TASK 6: Run Migration** (1h)

```bash
# 1. Update DATABASE_URL in .env
DATABASE_URL="postgresql://..."

# 2. Reset Prisma migrations
rm -rf prisma/migrations
npx prisma migrate dev --name init

# 3. Generate Prisma Client
npx prisma generate

# 4. Seed database
npm run db:seed:demo

# 5. Verify data
npx prisma studio
```

**Expected Output**:
```
✔ Generated Prisma Client
✔ Applied 1 migration(s)
✔ Database seeded successfully
```

---

### **TASK 7: Update Prisma Configuration** (30min)

#### prisma/schema.prisma optimizations

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}
```

#### Connection pool settings (lib/db/prisma.ts)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

### **TASK 8: Performance Optimization** (2h)

#### 8.1 Analyze Current Queries
```sql
-- Enable query logging
ALTER DATABASE osnovci SET log_statement = 'all';

-- Run app, then analyze slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 20;
```

#### 8.2 Add Missing Indexes
```sql
-- Example: Homework status + due date queries
CREATE INDEX CONCURRENTLY idx_homework_status_due 
ON homework(status, due_date) 
WHERE status IN ('ASSIGNED', 'IN_PROGRESS');

-- Example: Full-text search on homework titles
CREATE INDEX CONCURRENTLY idx_homework_title_search 
ON homework USING gin(to_tsvector('english', title));
```

#### 8.3 Optimize Connection Pool
```typescript
// lib/db/prisma.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool config
  connection: {
    pool: {
      max: 20,           // Max connections
      min: 5,            // Min connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  },
});
```

---

### **TASK 9: Testing** (2h)

#### 9.1 Functional Tests
- [ ] Login/Register flow
- [ ] Create homework
- [ ] Upload attachment
- [ ] Link guardian-student
- [ ] Session management
- [ ] Email verification

#### 9.2 Performance Tests
```bash
# Run load test
npm run test:load

# Expected results:
# - Response time: <500ms (p95)
# - Throughput: >100 req/s
# - Error rate: <0.1%
```

#### 9.3 Data Integrity
```sql
-- Check all tables have data
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Verify foreign keys
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f';
```

---

### **TASK 10: Documentation** (1h)

#### Update README.md
```markdown
## Database Setup

### PostgreSQL (Production)
1. Create database on Supabase/Neon
2. Copy connection string
3. Update `.env`:
   ```
   DATABASE_URL="postgresql://..."
   ```
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Local Development
- Use PostgreSQL locally via Docker:
  ```bash
  docker run -d \
    --name osnovci-postgres \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=osnovci \
    -p 5432:5432 \
    postgres:15-alpine
  ```
```

#### Create Migration Guide
- Document breaking changes
- Provide rollback strategy
- List environment variable changes

---

## 🚨 RISKS & MITIGATIONS

### Risk 1: Data Loss
**Mitigation**: 
- Full SQLite backup before migration
- Test migration in staging first
- Keep SQLite backup for 30 days

### Risk 2: Performance Degradation
**Mitigation**:
- Benchmark before/after
- Add EXPLAIN ANALYZE to critical queries
- Monitor with Sentry performance tracking

### Risk 3: Connection Pool Exhaustion
**Mitigation**:
- Configure PgBouncer
- Set connection limits
- Implement connection retry logic

### Risk 4: Schema Incompatibilities
**Mitigation**:
- Review all Prisma models
- Test migrations in dev first
- Use `prisma db pull` to verify schema

---

## ✅ SUCCESS CRITERIA

- [ ] All tables migrated successfully
- [ ] All indexes present
- [ ] Demo data seeded
- [ ] Build passes (0 errors)
- [ ] Performance: <500ms p95 response time
- [ ] All functional tests pass
- [ ] Documentation updated
- [ ] Rollback plan documented

---

## 📊 EXPECTED IMPROVEMENTS

### Performance
- **Query Speed**: 2-5x faster (PostgreSQL optimizations)
- **Concurrent Users**: 10x increase (connection pooling)
- **Full-Text Search**: 10-50x faster (pg_trgm)

### Scalability
- **Max Connections**: 20 → 100+ (PgBouncer)
- **Database Size**: 140KB → Unlimited (no SQLite limits)
- **Backup Strategy**: Manual → Automated (Supabase auto-backup)

### Features
- ✅ Full-text search (homework titles, student names)
- ✅ JSON querying (metadata fields)
- ✅ Concurrent writes (no SQLite lock issues)
- ✅ Production-ready (ACID compliance)

---

## 🛠️ TOOLS & RESOURCES

### Database Providers
- [Supabase](https://supabase.com) - Free tier, 500MB
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Railway](https://railway.app) - Simple deployment

### Monitoring
- [Sentry Performance](https://sentry.io) - Query performance tracking
- [pgAdmin](https://www.pgadmin.org) - Database management
- [Prisma Studio](https://www.prisma.io/studio) - Visual editor

### Documentation
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Connection Pooling Guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

## 🎯 TIMELINE

| Day | Tasks | Duration |
|-----|-------|----------|
| 1 | Setup database, update schema | 3h |
| 2 | Migration, seeding, testing | 4h |
| 3 | Performance tuning, optimization | 4h |
| 4 | Documentation, final testing | 3h |
| 5 | Buffer for issues | 2h |

**Total Estimated Time**: 16 hours over 5 days

---

## 🚀 NEXT STEPS (After FAZA 2)

### FAZA 3: Missing Features
1. Biometric API endpoints (WebAuthn)
2. Enhanced gamification
3. Weekly reports generation

### FAZA 4: Production Hardening
1. ClamAV integration (file scanning)
2. Enhanced security headers
3. Load testing (1000+ users)
4. Monitoring & alerts

---

**Created**: 2025-01-15  
**Status**: 📋 READY TO START  
**Priority**: 🔴 HIGH
