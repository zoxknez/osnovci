# 🔄 PostgreSQL Migration Guide

## 📋 Overview

Ovaj dokument sadrži **sve što ti treba** kada budeš spreman da pređeš sa SQLite na PostgreSQL. Sve je već **pripremljeno**, samo treba da **odkomentarišeš** određene linije.

**Trenutno stanje**: Aplikacija koristi **SQLite** (dev.db fajl)  
**Ciljano stanje**: Aplikacija će koristiti **PostgreSQL** (cloud database)

---

## ⏱️ Kada da migriraš?

### Migriraj SADA ako:
- ❌ SQLite je spor (>100ms queries)
- ❌ Imaš probleme sa concurrent writes
- ❌ Treba ti full-text search
- ❌ Deplojuješ na Vercel/Netlify (read-only filesystem)

### Ostani na SQLite ako:
- ✅ Aplikacija radi brzo
- ✅ Samo ti testiraš lokalno
- ✅ Manje od 10 korisnika
- ✅ Ne treba ti cloud hosting

---

## 🚀 Migracija u 5 koraka

### **KORAK 1: Kreiraj PostgreSQL bazu** (10 min)

**Opcije**:

#### A. Supabase (Preporučeno - FREE)
1. Idi na https://supabase.com
2. Sign up sa GitHub nalogom
3. "New Project"
   - Name: `osnovci-app`
   - Database Password: **SAČUVAJ OVO!**
   - Region: `Europe (Frankfurt)`
4. Čekaj 2 minuta dok se kreira
5. Settings → Database → Copy **Connection string (Pooler)**

Primer:
```
postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

#### B. Neon (Alternative - FREE)
1. Idi na https://neon.tech
2. Sign up sa GitHub
3. Create project
4. Copy connection string

#### C. Lokalni PostgreSQL (Bez cloud-a)
Ako imaš već instaliran PostgreSQL na računaru:
```bash
# Kreiraj bazu
psql -U postgres
CREATE DATABASE osnovci;
\q

# Connection string:
postgresql://postgres:password@localhost:5432/osnovci
```

---

### **KORAK 2: Update .env fajl** (2 min)

Otvori `.env` fajl i **zameni** DATABASE_URL:

```bash
# STARO (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# NOVO (PostgreSQL) - upotrebi svoj connection string!
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# OPCIONO: Dodaj direktan connection za migrations
DATABASE_URL_UNPOOLED="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**Primer** (Supabase):
```bash
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_DB_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

---

### **KORAK 3: Update schema.prisma** (1 min)

Otvori `prisma/schema.prisma` i promeni datasource:

```prisma
// ZAKOMENTARIŠI ovo (stavi // ispred):
// datasource db {
//   provider = "sqlite"
//   url      = env("DATABASE_URL")
// }

// ODKOMENTARIŠI ovo (ukloni // ispred):
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}
```

Takođe, odkomentariši PostgreSQL optimizacije ako želiš full-text search:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]  // Odkomentariši ovo
}
```

---

### **KORAK 4: Pokreni migraciju** (5 min)

```bash
# 1. Reset migrations folder (prvo backup!)
rm -rf prisma/migrations  # PowerShell: Remove-Item prisma/migrations -Recurse

# 2. Kreiraj novu migraciju za PostgreSQL
npx prisma migrate dev --name postgresql_init

# 3. Proveri da li radi
npx prisma db pull

# Očekivani output:
# ✔ Datasource "db": PostgreSQL database "postgres"
# ✔ Introspected 20 models and wrote them into prisma/schema.prisma
```

---

### **KORAK 5: Seed data i test** (3 min)

```bash
# Popuni bazu sa demo podacima
npm run db:seed:demo

# Pokreni app
npm run dev

# Test login:
# Email: demo1@osnovci.rs
# Password: demo123
```

---

## ✅ Verifikacija

### 1. Proveri da li su sve tabele kreirane

```bash
npx prisma studio
```

Trebalo bi da vidiš sve tabele:
- users
- students
- guardians
- homework
- attachments
- links
- sessions
- ...itd

### 2. Test osnovne operacije

```bash
# Login
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo1@osnovci.rs","password":"demo123"}'

# Should return session token
```

### 3. Proveri performance

```sql
-- U Supabase Dashboard → SQL Editor:
EXPLAIN ANALYZE
SELECT * FROM homework 
WHERE student_id = 'clx...' 
  AND status = 'ASSIGNED'
ORDER BY due_date;

-- Trebalo bi da vidiš: "Index Scan using..."
```

---

## 🔧 Troubleshooting

### Problem 1: "Connection refused"
**Uzrok**: PostgreSQL nije pokrenut ili connection string netačan

**Rešenje**:
```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1"

# Ako ne radi, proveri:
# 1. Da li je PASSWORD tačan
# 2. Da li je HOST tačan (copy-paste iz Supabase)
# 3. Da li je port 5432 ili 6543 (pooled)
```

### Problem 2: "SSL required"
**Uzrok**: Cloud database zahteva SSL

**Rešenje**: Dodaj `?sslmode=require` na kraj connection stringa:
```
postgresql://...@host:5432/postgres?sslmode=require
```

### Problem 3: "Migration failed"
**Uzrok**: Postoji stara migracija za SQLite

**Rešenje**:
```bash
# Kompletno reset migrations
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

### Problem 4: "Too many connections"
**Uzrok**: Previše konekcija na bazu

**Rešenje**: Koristi pooled connection (port 6543):
```
postgresql://...@host.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## 🎯 PostgreSQL Extensions (Opciono)

Nakon migracije, možeš da omogućiš dodatne feature-e:

### 1. Full-text search (pg_trgm)

```sql
-- U Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Test:
SELECT * FROM homework 
WHERE title ILIKE '%matematika%';
```

### 2. UUID generation

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Case-insensitive emails

```sql
CREATE EXTENSION IF NOT EXISTS citext;

-- Update users table:
ALTER TABLE users 
ALTER COLUMN email TYPE citext;
```

---

## 📊 Performance Tips

### 1. Connection Pooling

U `lib/db/prisma.ts`, već je podešeno za 20 konekcija. Za production, povećaj:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Production: 50 konekcija
  // Development: 20 konekcija
});
```

### 2. Index Optimizacija

Proveri koje indexes se koriste:
```sql
SELECT * FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### 3. Query Performance

```sql
-- Slow query log
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🔙 Rollback (Ako nešto pođe po zlu)

### Vraćanje na SQLite:

```bash
# 1. Vrati schema.prisma (zakomentariši postgresql, odkomentariši sqlite)
# 2. Vrati .env
DATABASE_URL="file:./prisma/dev.db"

# 3. Regenerate Prisma client
npx prisma generate

# 4. Restart app
npm run dev
```

---

## 💾 Backup Strategy

### Pre migracije:
```bash
# Backup SQLite
cp prisma/dev.db prisma/dev.db.backup

# Ili koristi skriptu:
npx ts-node scripts/backup-database.ts
```

### Nakon migracije (PostgreSQL):
```bash
# Export data
pg_dump $DATABASE_URL > backup.sql

# Import (ako treba)
psql $DATABASE_URL < backup.sql
```

---

## 📈 Očekivani Results

### Performance Improvements:
- **Query speed**: 2-5x brže (compound indexes)
- **Concurrent writes**: 10x bolje (no SQLite locks)
- **Full-text search**: 50x brže (pg_trgm)

### Scalability:
- **Max connections**: 20 → 100+
- **Database size**: No limit (SQLite max 140TB, ali sporo posle 1GB)
- **Concurrent users**: 10 → 1000+

---

## 🎓 Next Steps

Nakon uspešne migracije:

1. ✅ Setup Supabase auto-backup (Settings → Database → Backups)
2. ✅ Enable pg_trgm extension za full-text search
3. ✅ Konfiguriši connection pooling (PgBouncer)
4. ✅ Setup monitoring (Sentry + Supabase Dashboard)
5. ✅ Test load (1000 requests/sec)

---

## 📞 Help

Ako nešto ne radi:
1. Proveri da li je connection string tačan
2. Test sa `npx prisma db execute --stdin <<< "SELECT 1"`
3. Proveri Supabase Dashboard → Logs
4. Pogledaj error messages u konzoli

---

**Status**: 📋 Pripremljeno, spremno za migraciju kada budeš spreman!  
**Vreme migracije**: ~20 minuta  
**Dokumentovano**: 2025-01-15
