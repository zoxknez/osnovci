# 🚀 PostgreSQL Setup Instructions

## 🎯 Choose Your Provider

### Option 1: Supabase (Recommended for Development)

**Why Supabase?**
- ✅ 500MB free database
- ✅ Built-in connection pooler (port 6543)
- ✅ Automatic backups
- ✅ Easy dashboard
- ✅ Real-time subscriptions (bonus)

**Setup Steps**:
1. Go to https://supabase.com
2. Click "Start your project"
3. Create account (GitHub/Email)
4. Create new project:
   - Name: `osnovci-app`
   - Database Password: (save this!)
   - Region: Europe (closest to Serbia)
5. Wait ~2 minutes for provisioning
6. Go to "Project Settings" → "Database"
7. Copy **Connection string** (URI format)
8. Copy **Connection pooling** string (for production)

**Connection Strings**:
```bash
# Direct connection (for migrations)
postgresql://postgres.[project-ref]:[password]@[project-ref].supabase.co:5432/postgres

# Pooled connection (for app) - use this!
postgresql://postgres.[project-ref]:[password]@[project-ref].pooler.supabase.co:6543/postgres?pgbouncer=true
```

---

### Option 2: Neon (Recommended for Production)

**Why Neon?**
- ✅ Serverless (auto-scaling)
- ✅ Branch databases (like Git branches)
- ✅ 3GB free storage
- ✅ No cold starts on paid tier
- ✅ Better performance under load

**Setup Steps**:
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project:
   - Name: `osnovci-production`
   - Region: Europe (Frankfurt)
4. Copy connection string
5. Create branch for `development`

**Connection String**:
```bash
postgresql://[user]:[password]@[project].aws.neon.tech/neondb?sslmode=require
```

---

### Option 3: Railway (Simple but Paid)

**Why Railway?**
- ✅ Extremely simple setup
- ✅ $5/month PostgreSQL
- ✅ Great for small apps
- ❌ No free tier

**Setup Steps**:
1. Go to https://railway.app
2. Create account
3. "New Project" → "Provision PostgreSQL"
4. Copy `DATABASE_URL` from Variables tab

---

## 📝 After Getting Connection String

### Step 1: Update .env file

```bash
# Open .env file
code .env
```

Add these lines:
```bash
# PostgreSQL Connection (replace with your actual connection string)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# For production with connection pooling
DATABASE_URL_POOLED="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
```

### Step 2: Test Connection

```bash
# Test if Prisma can connect
npx prisma db execute --stdin <<< "SELECT 1"

# Expected output: ✔ Executed SQL
```

### Step 3: Ready to Migrate!

Once connection works, return to chat and say:
**"Connection ready, kreni sa migracijom"**

---

## 🔒 Security Notes

### DO NOT commit connection strings!
```bash
# Add to .gitignore (already done)
.env
.env.local
.env.production
```

### Use different databases for dev/prod
```bash
# Development
DATABASE_URL="postgresql://...localhost:5432/osnovci_dev"

# Production
DATABASE_URL="postgresql://...supabase.co:5432/osnovci_prod"
```

---

## 💡 Pro Tips

### 1. Connection Pooling
Always use pooled connection for app, direct for migrations:
```typescript
// Use direct connection
npx prisma migrate deploy

// Use pooled connection
npm run dev
```

### 2. Free Tier Limits
- **Supabase Free**: 500MB, 2 projects
- **Neon Free**: 3GB, unlimited projects
- **Railway**: No free tier

### 3. Backup Strategy
- Supabase: Auto-backup daily (7 days retention)
- Neon: Point-in-time restore (up to 24h)
- Railway: Manual backups via pg_dump

---

## ❓ Troubleshooting

### Error: "Connection refused"
**Solution**: Check if IP is whitelisted in Supabase dashboard

### Error: "SSL required"
**Solution**: Add `?sslmode=require` to connection string

### Error: "Too many connections"
**Solution**: Use pooled connection string (port 6543)

---

## 🚀 Quick Start (Copy-Paste)

```bash
# 1. Install PostgreSQL locally (optional)
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use Docker:
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15-alpine

# 2. Update .env
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/osnovci"' >> .env

# 3. Test connection
npx prisma db execute --stdin <<< "SELECT version()"

# 4. Ready for migration!
```

---

**Next**: After setup, run: `npm run migrate:postgres`

