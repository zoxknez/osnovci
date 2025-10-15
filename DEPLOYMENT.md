# 🚀 Deployment Guide - Osnovci App

## GitHub Repository
✅ **Connected**: https://github.com/zoxknez/osnovci.git

---

## Vercel Deployment Steps

### 1. **Priprema projekta** ✅
- [x] Git repository inicijalizovan
- [x] Kod push-ovan na GitHub
- [x] `.env.example` kreiran
- [x] `vercel.json` konfigurisan

### 2. **Vercel Setup**

#### A. Kreiraj Vercel Account
1. Idi na: https://vercel.com
2. Klikni **"Sign Up"**
3. Izaberi **"Continue with GitHub"**
4. Autorizuj Vercel da pristupi GitHub accountu

#### B. Import Projekta
1. Na Vercel dashboard-u klikni **"Add New Project"**
2. Izaberi **"Import Git Repository"**
3. Pronađi **`osnovci`** repozitorijum
4. Klikni **"Import"**

#### C. Konfiguriši Environment Variables
U **Environment Variables** sekciji dodaj:

```env
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=generate-random-secret-here
NODE_ENV=production
```

**⚠️ VAŽNO**: Za `NEXTAUTH_SECRET` generiši random string:
```bash
openssl rand -base64 32
```

#### D. Deploy Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (automatski detektovano)
- **Output Directory**: `.next` (automatski detektovano)
- **Install Command**: `npm install` (automatski detektovano)
- **Development Command**: `npm run dev`

#### E. Deploy!
1. Klikni **"Deploy"**
2. Sačekaj 2-3 minuta dok Vercel build-uje projekat
3. Nakon uspešnog build-a dobijaš URL: `https://osnovci.vercel.app`

---

## Database Setup za Production

### Opcija 1: Vercel Postgres (Preporučeno)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add Vercel Postgres
vercel postgres create
```

### Opcija 2: PlanetScale (MySQL)
1. Kreiraj account na: https://planetscale.com
2. Kreiraj novu bazu: `osnovci-db`
3. Dobij connection string
4. Update `DATABASE_URL` u Vercel Environment Variables
5. Update `schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```
6. Run: `npx prisma db push`

### Opcija 3: Supabase (PostgreSQL)
1. Kreiraj account na: https://supabase.com
2. Kreiraj novi projekat
3. Dobij connection string iz Settings > Database
4. Update `DATABASE_URL` u Vercel Environment Variables
5. Update `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
6. Run: `npx prisma db push`

---

## Post-Deployment Checklist

### 1. **Test Full Functionality** ✅
- [ ] Homepage loading correctly
- [ ] Login/Register working
- [ ] Dashboard accessible
- [ ] Settings page instant feedback
- [ ] Schedule page day selector
- [ ] Mobile responsive design
- [ ] PWA install prompt

### 2. **Performance Optimization**
```bash
# Test Lighthouse score
https://pagespeed.web.dev/

# Check Core Web Vitals
- LCP < 2.5s ✅
- FID < 100ms ✅
- CLS < 0.1 ✅
```

### 3. **SEO Configuration**
Update `app/layout.tsx` metadata:
```tsx
export const metadata = {
  metadataBase: new URL('https://your-app-name.vercel.app'),
  title: 'Osnovci - Digitalni Dnevnik',
  description: 'Moderna mobilna aplikacija za učenike osnovnih škola',
}
```

### 4. **Custom Domain (Opciono)**
1. U Vercel dashboard: **Settings > Domains**
2. Dodaj custom domain (npr. `osnovci.rs`)
3. Podesi DNS records kod domain providera:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Continuous Deployment

### Automatski Deploy
- **Svaki push na `master` branch** → Automatski deploy na production
- **Pull requests** → Preview deployments

### Manual Deploy
```bash
# Deploy sa lokalnog računara
vercel

# Deploy na production
vercel --prod
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` ili Postgres URL |
| `NEXTAUTH_URL` | App URL | `https://osnovci.vercel.app` |
| `NEXTAUTH_SECRET` | Auth secret key | `random-32-char-string` |
| `NODE_ENV` | Environment | `production` |

---

## Troubleshooting

### Build Errors
```bash
# Lokalno testiraj production build
npm run build
npm run start
```

### Database Connection Issues
- Check `DATABASE_URL` format
- Verify Prisma schema provider matches database type
- Run `npx prisma generate` after schema changes

### Environment Variables Not Loading
- Redeploy after changing env vars
- Check spelling and syntax
- Verify no trailing spaces

---

## Monitoring & Analytics

### Vercel Analytics (Built-in)
- Real-time visitors
- Page views
- Core Web Vitals
- Deployment history

### Add Google Analytics (Opciono)
```tsx
// app/layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
```

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **GitHub Repo**: https://github.com/zoxknez/osnovci

---

**Status**: ✅ Ready for deployment!
**Last Updated**: October 15, 2025
