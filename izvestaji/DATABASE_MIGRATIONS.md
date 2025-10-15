# 🗄️ Database Migrations Strategy

**Siguran pristup za schema changes u produkciji**

---

## 📋 Migration Best Practices

### 1. Development Flow

```bash
# 1. Promeni schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_new_field

# 3. Test migration
npm run test

# 4. Commit
git add prisma/
git commit -m "feat: add new field to Student"
```

### 2. Production Flow

```bash
# NIKAD ne koristi `prisma db push` u produkciji!
# Uvek koristi migrations

# Deploy migration
npx prisma migrate deploy
```

---

## 🔄 Schema Change Process

### Safe Changes (Low Risk)

✅ **Add new table**
```prisma
model NewTable {
  id String @id @default(cuid())
  // ...
}
```

✅ **Add optional column**
```prisma
model Student {
  newField String? // Optional
}
```

✅ **Add index**
```prisma
@@index([email])
```

### Risky Changes (Need Care)

⚠️ **Rename column**
```sql
-- Use multi-step approach:
-- 1. Add new column
-- 2. Copy data
-- 3. Remove old column
```

⚠️ **Change data type**
```sql
-- 1. Add new column with new type
-- 2. Migrate data
-- 3. Drop old column
-- 4. Rename new column
```

⚠️ **Drop column**
```sql
-- WARNING: Data loss!
-- 1. Backup first
-- 2. Ensure not used in code
-- 3. Drop column
```

---

## 🚀 Zero-Downtime Migrations

### Step-by-Step Process

#### 1. Add Column (Non-Breaking)

```prisma
// Step 1: Add optional column
model Student {
  oldField String
  newField String? // Optional, doesn't break existing queries
}
```

```bash
# Deploy
npx prisma migrate deploy
```

#### 2. Backfill Data (if needed)

```typescript
// scripts/backfill-new-field.ts
const students = await prisma.student.findMany({
  where: { newField: null },
});

for (const student of students) {
  await prisma.student.update({
    where: { id: student.id },
    data: { newField: calculateValue(student.oldField) },
  });
}
```

#### 3. Make Required (if needed)

```prisma
// Step 2: Make required after backfill
model Student {
  oldField String
  newField String // Now required
}
```

#### 4. Remove Old Column

```prisma
// Step 3: Remove old column
model Student {
  newField String
}
```

---

## 📊 Migration Checklist

### Before Migration

- [ ] Backup database
- [ ] Test migration locally
- [ ] Test on staging environment
- [ ] Review migration SQL
- [ ] Check for breaking changes
- [ ] Notify team
- [ ] Schedule maintenance window (if needed)

### During Migration

- [ ] Monitor health endpoint
- [ ] Watch error logs
- [ ] Monitor database load
- [ ] Test critical paths
- [ ] Keep rollback script ready

### After Migration

- [ ] Verify data integrity
- [ ] Test all features
- [ ] Check performance
- [ ] Monitor for 24h
- [ ] Update documentation

---

## 🔙 Rollback Strategy

### Automatic Rollback

```bash
# Prisma migrations can't rollback automatically
# Must create inverse migration

# 1. Create rollback migration
npx prisma migrate dev --name rollback_previous_change

# 2. Write inverse SQL
-- migration.sql
ALTER TABLE "students" DROP COLUMN "newField";
```

### Manual Rollback

```bash
# 1. Restore from backup
pg_restore -d osnovci backup.sql

# 2. Reset migrations
npx prisma migrate resolve --rolled-back [migration-name]

# 3. Deploy previous version
git checkout v1.0.0
vercel --prod
```

---

## 🧪 Testing Migrations

### Local Testing

```bash
# 1. Test migration
npm run db:reset
npm run db:seed

# 2. Test app
npm run dev
# Manually test all features

# 3. Test rollback
# Create inverse migration & test
```

### Staging Testing

```bash
# 1. Deploy to staging
DATABASE_URL=[staging-db] npx prisma migrate deploy

# 2. Run integration tests
npm run test:e2e

# 3. Manual QA
```

---

## 📈 Migration Types

### Type 1: Additive (Safe) ✅

**Characteristics:**
- Adds new tables/columns
- No data loss
- Backward compatible

**Example:**
```prisma
model Student {
  // Existing fields
  id String @id
  name String
  // New field
  nickname String? // Optional = safe
}
```

**Deployment:** Can deploy anytime

---

### Type 2: Modification (Careful) ⚠️

**Characteristics:**
- Changes existing structure
- Requires data migration
- Potential downtime

**Example:**
```prisma
// Renaming column
model Student {
  // Before: firstName
  // After: fullName
}
```

**Deployment:** Use multi-step process

---

### Type 3: Destructive (Dangerous) 🚨

**Characteristics:**
- Removes data
- Irreversible
- Requires backup

**Example:**
```prisma
// Dropping column
model Student {
  // Removed: temporaryField
}
```

**Deployment:** Maintenance window + backup

---

## 🔐 Production Database Access

### Who Has Access?

- **Full Access:** Senior Developer + DevOps
- **Read-Only:** QA Team
- **No Access:** Junior Developers (use staging)

### Access Log

```bash
# Track all database access
# Who, When, What, Why

2025-10-15 10:00 - John - Added index - Performance
2025-10-15 14:30 - Jane - Ran migration - Feature X
```

---

## 📊 Migration Monitoring

### Metrics to Watch

- **Duration:** How long did it take?
- **Rows Affected:** How many records changed?
- **Downtime:** Any user impact?
- **Error Rate:** Any errors during migration?
- **Rollbacks:** Did we need to rollback?

### Tools

```bash
# Monitor query performance
EXPLAIN ANALYZE SELECT * FROM students WHERE ...;

# Watch database size
SELECT pg_size_pretty(pg_database_size('osnovci'));

# Monitor active connections
SELECT count(*) FROM pg_stat_activity;
```

---

## 🎯 Migration Timeline

### Small Changes (<1 min)
- Add column
- Add index (online)
- Add constraint

**Deployment:** Anytime (off-peak preferred)

### Medium Changes (1-10 min)
- Rename column
- Change data type
- Backfill data

**Deployment:** Off-peak hours (2-4 AM)

### Large Changes (>10 min)
- Major restructure
- Large data migration
- Multiple tables

**Deployment:** Maintenance window, pre-announced

---

## 📞 Emergency Procedures

### If Migration Fails:

1. **Stop immediately**
2. **Check error logs**
3. **Restore from backup** (if data loss)
4. **Roll back code**
5. **Investigate issue**
6. **Fix & retry**

### Emergency Contacts:

- Database Admin: [Contact]
- DevOps Lead: [Contact]
- CTO: [Contact]

---

**Migrations su kritične - uvek sa pažnjom! ⚠️**

