# 🚀 OSNOVCI - Production Deployment Guide

**Kompletna uputstva za deployment na produkciju**

---

## 📋 Pre-Production Checklist

### 1. Code Quality ✅
- [x] TypeScript strict mode enabled
- [x] All tests passing
- [x] Linter passing
- [x] Build successful
- [x] No console errors

### 2. Security ✅
- [x] Environment variables validated
- [x] Auth middleware active
- [x] CSRF protection enabled
- [x] Input sanitization implemented
- [x] Security headers configured (CSP, HSTS)
- [x] Rate limiting setup
- [x] Content filtering for children

### 3. Performance ✅
- [x] Image compression enabled
- [x] Virtual scrolling for lists
- [x] React.memo optimizations
- [x] Service Worker configured
- [x] Static asset caching

### 4. Monitoring ✅
- [x] Health check endpoint (`/api/health`)
- [x] Structured logging (Pino)
- [x] Analytics (Vercel Analytics)
- [x] Error boundaries

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended) ⭐

#### Prednosti:
- ✅ Zero config
- ✅ Auto-scaling
- ✅ Edge Network (global CDN)
- ✅ Built-in analytics
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Git integration

#### Koraci:

**1. Priprema**
```bash
# Ensure code is committed
git add .
git commit -m "Production ready"
git push origin main
```

**2. Create Vercel Project**
- Idi na [vercel.com](https://vercel.com)
- Click "New Project"
- Import GitHub repo
- Izaberi "osnovci"

**3. Configure Environment Variables**

U Vercel Dashboard → Settings → Environment Variables:

```env
# Required
DATABASE_URL="postgresql://user:pass@host:5432/osnovci?sslmode=require"
NEXTAUTH_SECRET="[generiši novi - 32+ chars]"
NEXTAUTH_URL="[auto-popunjava se]"

# Optional
NEXT_PUBLIC_APP_URL="https://tvoj-domen.com"
LOG_LEVEL="info"
```

**Generiši NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**4. Deploy**
- Click "Deploy"
- Wait 2-3 minutes
- Done! 🎉

**5. Custom Domain (Optional)**
- Settings → Domains
- Add custom domain
- Update DNS records

**Cena:** $20/mesec (Pro plan)

---

### Option 2: Docker + VPS

#### Za:
- Self-hosting
- Full control
- Lower cost (long-term)

#### Koraci:

**1. Setup VPS**
```bash
# Kupi VPS (DigitalOcean, Linode, Hetzner)
# Minimum: 2GB RAM, 1 vCPU, 50GB disk

# SSH into VPS
ssh root@your-vps-ip
```

**2. Install Docker**
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install docker-compose-plugin
```

**3. Clone & Configure**
```bash
# Clone repository
git clone <your-repo> /opt/osnovci
cd /opt/osnovci

# Create .env
nano .env

# Add:
DATABASE_URL=postgresql://osnovci:strongpass@db:5432/osnovci?schema=public
NEXTAUTH_SECRET=[generiši sa: openssl rand -base64 32]
NEXTAUTH_URL=https://tvoj-domen.com
NODE_ENV=production
```

**4. Deploy**
```bash
# Build & Start
docker-compose up -d

# Check logs
docker-compose logs -f app

# Migrate database
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

**5. Setup Nginx Reverse Proxy**
```bash
# Install Nginx
apt-get install nginx

# Configure
nano /etc/nginx/sites-available/osnovci
```

```nginx
server {
    listen 80;
    server_name tvoj-domen.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/osnovci /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup SSL (Let's Encrypt)
apt-get install certbot python3-certbot-nginx
certbot --nginx -d tvoj-domen.com
```

**Cena:** ~$10-20/mesec (VPS only)

---

### Option 3: Railway

#### Prednosti:
- Simple deployment
- Free tier
- PostgreSQL included
- GitHub integration

#### Koraci:

1. Sign up: [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add PostgreSQL service
4. Add environment variables
5. Deploy!

**Cena:** $5-15/mesec

---

## 🗄️ Database Setup

### Option 1: Supabase (Recommended za Vercel)

**Free Tier:**
- 500MB database
- 1GB bandwidth
- 50,000 MAU

**Steps:**
1. [supabase.com](https://supabase.com) → New Project
2. Copy Connection String (Direct Connection)
3. Add to Vercel env vars
4. Done!

**Connection String:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

---

### Option 2: Neon

**Free Tier:**
- 512MB storage
- 1 project
- Auto-suspend after 5 min inactivity

**Steps:**
1. [neon.tech](https://neon.tech) → New Project
2. Copy connection string
3. Add to env vars

---

### Option 3: Self-Hosted PostgreSQL

**Docker Compose:**
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: osnovci
      POSTGRES_USER: osnovci
      POSTGRES_PASSWORD: strongpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

---

## 🔐 Security Checklist

### Pre-Production

- [ ] **Strong Secrets**
  - NEXTAUTH_SECRET: 32+ characters
  - Database password: 16+ characters
  - Različiti secrets za dev/prod

- [ ] **Environment Variables**
  - Nikad u git
  - Stored in platform (Vercel/Railway)
  - Validated at build time

- [ ] **Database**
  - SSL enabled (`?sslmode=require`)
  - Firewall rules (only app access)
  - Regular backups

- [ ] **Application**
  - Auth middleware active
  - Rate limiting configured
  - Input sanitization
  - Error boundaries

- [ ] **Monitoring**
  - Health checks setup
  - Error tracking (Sentry optional)
  - Uptime monitoring
  - Log aggregation

---

## 📊 Post-Deployment

### 1. Smoke Test

```bash
# Check health
curl https://tvoj-domen.com/api/health

# Expected response:
{
  "status": "healthy",
  "uptime": 123,
  "services": {
    "database": { "status": "up" }
  }
}
```

### 2. Test Features

- [ ] Registration works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Add homework works
- [ ] Camera works
- [ ] Dark mode works
- [ ] Offline mode works
- [ ] Push notifications work

### 3. Performance Check

```bash
# Run Lighthouse
npm install -g lighthouse
lighthouse https://tvoj-domen.com --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+
- PWA: 100

### 4. Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test 100 concurrent users
ab -n 1000 -c 100 https://tvoj-domen.com/api/health

# Expected: <200ms average
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Automatski se pokreće na svaki push/PR:

**Jobs:**
1. **Quality Check**
   - Lint
   - Type check
   - Tests
   - Coverage report

2. **Build Test**
   - Test production build
   - Upload artifacts

3. **Security Scan**
   - npm audit
   - Snyk scan (optional)

4. **Deploy**
   - Auto-deploy to Vercel (main branch)

**Setup:**
```bash
# Already added to .github/workflows/
# Just add secrets in GitHub:
# - VERCEL_TOKEN
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
```

---

## 📈 Monitoring Setup

### 1. Health Check Monitoring

**Recommended Services:**
- UptimeRobot (free)
- StatusCake (free tier)
- Pingdom (paid)

**Setup:**
```
Monitor URL: https://tvoj-domen.com/api/health
Interval: 5 minutes
Expected: HTTP 200
Alert: Email/SMS if down
```

### 2. Error Tracking (Optional)

**Sentry:**
```bash
npm install @sentry/nextjs

# Configure
npx @sentry/wizard@latest -i nextjs

# Add to .env
NEXT_PUBLIC_SENTRY_DSN="https://..."
```

### 3. Log Aggregation (Optional)

**Options:**
- Logtail
- Papertrail
- Datadog

---

## 💾 Backup Strategy

### Database Backups

**Automated (Daily):**
```bash
# Cron job za backup
0 2 * * * pg_dump $DATABASE_URL > /backups/osnovci-$(date +\%Y\%m\%d).sql
```

**Vercel Postgres:**
- Auto-backups (daily)
- Point-in-time recovery
- 7-day retention

**Supabase:**
- Daily backups
- Download from dashboard

### Application Backup

**Git:**
```bash
# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

**Files/Uploads:**
- Use object storage (R2, S3)
- Configure automatic backups

---

## 🚨 Rollback Plan

### Quick Rollback (Vercel)

```bash
# Via Dashboard
# Deployments → Previous Deployment → Promote

# Via CLI
vercel rollback [deployment-url]
```

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout previous version
git checkout v1.0.0
git push origin main --force  # ⚠️ Use with caution
```

---

## 📞 Support & Maintenance

### Daily Tasks
- Check health endpoint
- Monitor error rates
- Review user feedback

### Weekly Tasks
- Review analytics
- Check disk usage
- Update dependencies (security)

### Monthly Tasks
- Database optimization
- Performance audit
- Security audit
- Backup testing

---

## 🎯 Success Metrics

### Week 1
- [ ] 50+ registrations
- [ ] 0 critical bugs
- [ ] 99% uptime
- [ ] <2s load time

### Month 1
- [ ] 500+ active users
- [ ] <0.5% error rate
- [ ] 90+ Lighthouse score
- [ ] Positive feedback

---

## 📞 Emergency Contacts

**Critical Issues:**
1. Check health endpoint
2. Review logs
3. Check database
4. Rollback if needed

**Contact:**
- Developer: [Tvoj email/telefon]
- Hosting: support@vercel.com
- Database: support@supabase.com

---

**Deployment je spreman! Srećno! 🚀**

