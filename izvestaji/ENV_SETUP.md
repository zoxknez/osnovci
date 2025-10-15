# 🔐 Environment Variables Setup

## Required Variables

Kreiraj `.env` fajl u root-u projekta sa sledećim varijablama:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/osnovci?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Kopiraj output u `NEXTAUTH_SECRET`.

---

## Database Setup Options

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql
# Windows: Download from postgresql.org

# Start PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo service postgresql start

# Create database
createdb osnovci

# Set DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/osnovci?schema=public"
```

### Option 2: Supabase (Free Tier)

1. Kreiraj account na [supabase.com](https://supabase.com)
2. Kreiraj novi projekat
3. Idi na **Settings → Database**
4. Kopiraj **Connection String** (Direct Connection)
5. Zalepi u `DATABASE_URL`

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### Option 3: Neon (Free Tier)

1. Kreiraj account na [neon.tech](https://neon.tech)
2. Kreiraj novi projekat
3. Kopiraj connection string
4. Zalepi u `DATABASE_URL`

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/osnovci?sslmode=require"
```

---

## Optional Variables

### Push Notifications

Generate VAPID keys: https://web-push-codelab.glitch.me/

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
```

### Logging

```env
LOG_LEVEL="debug"  # debug, info, warn, error
```

### Sentry (Error Tracking)

```env
NEXT_PUBLIC_SENTRY_DSN="https://..."
```

### OpenAI (AI Features)

```env
OPENAI_API_KEY="sk-..."
```

---

## Vercel Deployment

Dodaj environment variables u Vercel dashboard:

1. Idi na **Project Settings → Environment Variables**
2. Dodaj:
   - `DATABASE_URL` (production database)
   - `NEXTAUTH_SECRET` (generiši novi za production!)
   - `NEXTAUTH_URL` (auto-popunjava se)

**VAŽNO:** Koristi **različit** `NEXTAUTH_SECRET` za development i production!

---

## Validation

Environment variables se automatski validiraju kroz `lib/env.ts`.

Ako nešto fali, dobićeš error pri startu aplikacije sa tačnom porukom šta nedostaje.

---

## Security Best Practices

1. ✅ **Nikad** ne commituj `.env` fajl u git
2. ✅ Koristi **različite** secrets za dev/prod
3. ✅ Generiši **jake** NEXTAUTH_SECRET (min 32 chars)
4. ✅ Koristi **SSL** connection za production database
5. ✅ Rotuj secrets redovno (svaka 3-6 meseci)
6. ✅ Koristi environment variable management (Vercel, Railway, etc.)

---

## Troubleshooting

### Error: "DATABASE_URL is required"
➡️ Proveri da li `.env` fajl postoji i da ima `DATABASE_URL`

### Error: "NEXTAUTH_SECRET must be at least 32 characters"
➡️ Generiši novi sa: `openssl rand -base64 32`

### Error: "Can't connect to database"
➡️ Proveri:
- Da li PostgreSQL radi
- Da li su credentials tačni
- Da li database postoji
- Da li port 5432 je otvoren

---

**Sve postavljeno? Kreni dalje sa README.md! 🚀**

