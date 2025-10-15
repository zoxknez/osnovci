# ⚡ OSNOVCI - Quick Start Guide

**Najbrži način da pokreneš aplikaciju - 5 minuta!** ⏱️

---

## 🚀 3-Step Setup

### Step 1: Install (2 min)

```bash
# Clone repo
git clone <your-repo-url>
cd osnovci

# Install dependencies
npm install
```

### Step 2: Configure (2 min)

**Kreiraj `.env` fajl:**

```env
DATABASE_URL="postgresql://localhost:5432/osnovci?schema=public"
NEXTAUTH_SECRET="test-secret-minimum-32-characters-long-CHANGE-THIS"
NEXTAUTH_URL="http://localhost:3000"
```

**Generiši secret:**
```bash
openssl rand -base64 32
```

### Step 3: Run (1 min)

```bash
# Setup database
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

**Open:** http://localhost:3000 🎉

---

## 🔑 Demo Nalog

**Email:** `demo@osnovci.rs`  
**Password:** `demo123`

Click "Probaj Demo" na login stranici!

---

## 📁 Struktura Projekta

```
osnovci/
├── app/              # Pages & API routes
├── components/       # React components
├── lib/              # Utilities & helpers
├── prisma/           # Database schema
├── public/           # Static files
└── __tests__/        # Test files
```

---

## 🛠️ Korisne Komande

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build za production
npm run start         # Start production

# Database
npm run db:push       # Sync schema
npm run db:seed       # Add demo data
npm run db:studio     # Open Prisma Studio

# Quality
npm run lint          # Run linter
npm run type-check    # Check TypeScript
npm run test          # Run tests
npm run test:ui       # Visual test runner
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Install PostgreSQL locally ili koristi:
# - Supabase (free)
# - Neon (free)
# - Docker: docker-compose up db
```

### "NEXTAUTH_SECRET is required"
```bash
# Generiši secret:
openssl rand -base64 32

# Dodaj u .env
```

### "Port 3000 already in use"
```bash
# Promeni port:
PORT=3001 npm run dev
```

---

## 📚 Dalje Čitanje

1. **README.md** - Full documentation
2. **ENV_SETUP.md** - Detailed env setup
3. **PRODUCTION_DEPLOYMENT.md** - Deploy guide

---

## 🎯 Sledeći Koraci

1. ✅ Pokreni aplikaciju lokalno
2. 📝 Testiraj sve feature
3. 🎨 Prilagodi design (optional)
4. 🚀 Deploy na Vercel
5. 👥 Pozovi beta korisnike

---

**Gotovo! Happy coding! 🎉**

