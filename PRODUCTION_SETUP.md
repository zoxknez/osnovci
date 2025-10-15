# 🚀 Production Database Setup Guide

## Problem
SQLite (`file:./dev.db`) ne radi na Vercel jer je serverless platforma.

## ✅ Rešenje: PostgreSQL

---

## Opcija 1: Vercel Postgres (Preporučeno)

### Setup koraci:

```powershell
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link projekat
vercel link

# 4. Kreiraj Postgres bazu
vercel postgres create

# 5. Povuci env variables lokalno
vercel env pull .env.production
```

### U Vercel Dashboard:
1. Otvori projekat
2. **Storage** → **Create Database** → **Postgres**
3. Ime: `osnovci-db`
4. Region: `Washington D.C. (iad1)` (najbliži)
5. Automatski će se dodati env variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` 
   - `POSTGRES_URL_NON_POOLING`

### Environment Variables u Vercel:
```env
DATABASE_URL=${POSTGRES_PRISMA_URL}
DIRECT_URL=${POSTGRES_URL_NON_POOLING}
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-here
```

---

## Opcija 2: Supabase PostgreSQL

### Setup koraci:

1. **Idi na:** https://supabase.com
2. **Sign up** sa GitHub accountom
3. **New Project:**
   - Name: `osnovci`
   - Database Password: (generiši jak password)
   - Region: `Frankfurt` (najbliži)
4. **Čekaj 2-3 minuta** dok se kreira

### Dobij Connection String:
1. Settings → Database
2. Connection String → URI
3. Kopiraj string:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Environment Variables u Vercel:
```env
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[REF]:[PASS]@[HOST]:5432/postgres
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-here
```

---

## 🔧 Nakon što dobiješ Connection String

### 1. Update lokalni .env fajl za testiranje:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### 2. Generiši Prisma Client:
```powershell
npx prisma generate
```

### 3. Push schema na bazu:
```powershell
npx prisma db push
```

### 4. Seed bazu sa demo podacima:
```powershell
npm run db:seed
```

### 5. Proveri da li radi:
```powershell
npx prisma studio
```

---

## 📦 Deploy na Vercel

### 1. Dodaj Environment Variables u Vercel Dashboard:

**Settings → Environment Variables:**

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://...` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://osnovci.vercel.app` | Production |
| `NEXTAUTH_URL` | `https://[preview].vercel.app` | Preview |
| `NEXTAUTH_SECRET` | `random-32-char-string` | All |

### 2. Generiši NEXTAUTH_SECRET:
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

Ili: https://generate-secret.vercel.app/32

### 3. Redeploy:
- Git push će automatski trigger-ovati novi deployment
- Ili u Vercel Dashboard: **Deployments → ... → Redeploy**

---

## ✅ Verifikacija da sve radi

### 1. Check Deployment Logs:
Vercel Dashboard → Deployment → Function Logs

### 2. Testiranje:
1. Otvori: `https://your-app.vercel.app`
2. Idi na `/prijava`
3. Unesi demo credentials:
   - Email: `demo@osnovci.rs`
   - Password: `Demo123!`
4. Ako uspešno uloguje → **RADI!** ✅

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"
**Rešenje:** Proveri:
- Da li je `DATABASE_URL` tačan
- Da li je baza pokrenuta (Supabase projekat mora biti aktivan)
- Da li ima connectivity (firewall, network)

### Error: "Table does not exist"
**Rešenje:**
```powershell
# Lokalno
npx prisma db push
npx prisma db seed

# Ili pokreni u Vercel build
# Dodaj u package.json:
"postinstall": "prisma generate"
```

### Error: "Invalid `prisma.user.findUnique()` invocation"
**Rešenje:** Prisma schema nije sinhronizovan sa bazom.
```powershell
npx prisma db push --force-reset
npm run db:seed
```

### Demo user ne postoji u bazi
**Rešenje:** Run seed script:
```powershell
npm run db:seed
```

---

## 📊 Monitoring

### Vercel Postgres:
- Dashboard → Storage → Postgres → Usage
- Besplatno: 256 MB storage, 60 sati compute

### Supabase:
- Dashboard → Settings → Database → Disk Usage
- Besplatno: 500 MB storage, 2 CPU

---

## 🔄 Migracije (za budućnost)

Kada menjaš schema:

```powershell
# 1. Napravi migraciju
npx prisma migrate dev --name add_new_feature

# 2. Push na production
npx prisma migrate deploy

# 3. Commit migration fajlove
git add prisma/migrations
git commit -m "feat: Add new feature migration"
git push
```

---

## 🎯 Quick Start Checklist

- [ ] Izabrao bazu (Vercel Postgres ili Supabase)
- [ ] Kreirao bazu
- [ ] Dobio connection string
- [ ] Dodao `DATABASE_URL` u Vercel env variables
- [ ] Dodao `NEXTAUTH_URL` i `NEXTAUTH_SECRET`
- [ ] Pushovao `schema.prisma` izmene (PostgreSQL)
- [ ] Redeploy-ovao na Vercel
- [ ] Run `npx prisma db push` (lokalno ili u Vercel)
- [ ] Run `npm run db:seed` za demo data
- [ ] Testirao login sa `demo@osnovci.rs`

---

**Status:** ✅ Ready for production deployment!
