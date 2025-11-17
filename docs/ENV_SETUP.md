# Environment Variables Setup

## 📝 Overview

This document explains how to set up environment variables for the Osnovci application.

## 🚀 Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values (see sections below)

3. Start the app:
   ```bash
   npm run dev
   ```

---

## 📋 Required Variables

### Database

```bash
# Development (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Required:** ✅ Yes  
**Production:** Use PostgreSQL (Supabase, Neon, or self-hosted)

---

### Authentication

```bash
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-32-character-secret-key"

# Your app URL
NEXTAUTH_URL="http://localhost:3000"  # Development
NEXTAUTH_URL="https://osnovci.rs"     # Production

# CSRF Protection (optional, falls back to NEXTAUTH_SECRET)
CSRF_SECRET="your-32-character-secret-key"
```

**Required:** ✅ Yes  
**How to generate:** 
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## 🔧 Optional but Recommended

### Redis (Rate Limiting & Account Lockout)

Get free Redis from https://upstash.com:

```bash
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

**Required:** ❌ No (but recommended for production)  
**Fallback:** In-memory rate limiting (not persistent)

**Why you need it:**
- Persistent rate limiting across server restarts
- Persistent account lockout (after 5 failed login attempts)
- Session management

---

### Sentry (Error Tracking)

Get free account from https://sentry.io:

```bash
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ORG="your-org"
SENTRY_PROJECT="osnovci"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

**Required:** ❌ No (but recommended for production)

---

### Email (Verification & Notifications)

Popular providers: SendGrid, Mailgun, Resend, Postmark

**Example (SendGrid):**
```bash
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="noreply@osnovci.rs"
```

**Example (Resend):**
```bash
EMAIL_HOST="smtp.resend.com"
EMAIL_PORT="465"
EMAIL_USER="resend"
EMAIL_PASSWORD="re_your-api-key"
EMAIL_FROM="noreply@osnovci.rs"
```

**Required:** ❌ No (only for email features)

---

### Push Notifications

Generate VAPID keys: https://web-push-codelab.glitch.me/

```bash
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

**Required:** ❌ No (only for push notification features)

---

### Application Settings

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Development
NEXT_PUBLIC_APP_URL="https://osnovci.rs"     # Production

LOG_LEVEL="info"  # Options: debug, info, warn, error
NODE_ENV="development"  # Options: development, production, test
```

**Required:** ✅ Yes (NEXT_PUBLIC_APP_URL)

---

## 🗄️ Database Providers

### Supabase (Recommended)

1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings > Database
4. Set `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

---

### Neon (Recommended)

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Set `DATABASE_URL`

---

### Self-Hosted PostgreSQL

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/osnovci"
```

---

## 🔐 Security Best Practices

### 1. Never commit `.env` files

Already in `.gitignore`:
```
.env*
```

### 2. Use different secrets per environment

- Development: Local secrets
- Staging: Separate secrets
- Production: Production secrets

### 3. Rotate secrets regularly

- Change `NEXTAUTH_SECRET` every 90 days
- Change database passwords every 90 days

### 4. Use environment-specific values

```bash
# .env.local (development)
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"

# .env.production (production)
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://osnovci.rs"
```

---

## 🚨 Troubleshooting

### "NEXTAUTH_SECRET must be at least 32 characters"

**Solution:** Generate a new secret:
```bash
openssl rand -base64 32
```

### "Redis rate limit error, falling back to in-memory"

**Meaning:** Redis is not configured or connection failed.

**Solution:** 
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Or ignore if you don't need persistent rate limiting (development only)

### Database connection errors

**Common issues:**
1. Wrong `DATABASE_URL` format
2. Database not accessible (firewall, network)
3. Wrong credentials

**Solution:** Test connection:
```bash
npm run db:push
```

---

## 📝 Example Full `.env.local` (Development)

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Auth
NEXTAUTH_SECRET="development-secret-key-minimum-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"
CSRF_SECRET="development-csrf-secret-32-characters-long"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
LOG_LEVEL="debug"
```

---

## 📝 Example Full `.env.local` (Production)

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/osnovci"

# Auth
NEXTAUTH_SECRET="production-secret-key-generated-with-openssl-rand"
NEXTAUTH_URL="https://osnovci.rs"
CSRF_SECRET="production-csrf-secret-generated-separately"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Sentry
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="osnovci"
SENTRY_AUTH_TOKEN="your-token"

# Email (SendGrid)
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASSWORD="your-api-key"
EMAIL_FROM="noreply@osnovci.rs"

# Push Notifications
VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"

# App
NEXT_PUBLIC_APP_URL="https://osnovci.rs"
NODE_ENV="production"
LOG_LEVEL="info"
```

---

## 🆘 Need Help?

- Check [DEPLOY.md](DEPLOY.md) for deployment setup
- Check [README.md](../README.md) for general information
- Open an issue on GitHub
