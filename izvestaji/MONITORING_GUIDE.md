# 📊 Monitoring & Observability Guide

**Kompletna strategija za praćenje aplikacije u produkciji**

---

## 🎯 Monitoring Layers

### 1. Application Performance Monitoring (APM)

**✅ Vercel Analytics** (Already Integrated)
- Page views
- Unique visitors
- Geographic data
- Device types
- Referrers

**✅ Speed Insights** (Already Integrated)
- Core Web Vitals
- Time to First Byte
- First Contentful Paint
- Largest Contentful Paint
- Cumulative Layout Shift
- First Input Delay

---

### 2. Health Monitoring

**✅ Health Check Endpoint** (`/api/health`)

```bash
# Test locally
curl http://localhost:3000/api/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-10-15T10:00:00Z",
  "uptime": 3600,
  "version": "0.1.0",
  "services": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "memory": {
      "used": 128,
      "total": 512,
      "percentage": 25
    }
  }
}
```

**Setup External Monitoring:**

#### UptimeRobot (Free)
1. [uptimerobot.com](https://uptimerobot.com)
2. Add Monitor
3. Type: HTTP(S)
4. URL: `https://tvoj-domen.com/api/health`
5. Interval: 5 minutes
6. Alert: Email/SMS

#### StatusCake (Free Tier)
1. [statuscake.com](https://statuscake.com)
2. New Test
3. URL: `/api/health`
4. Check: Every 5 minutes
5. Alert contacts

---

### 3. Error Tracking

**Option 1: Sentry (Recommended)**

```bash
npm install @sentry/nextjs

# Configure
npx @sentry/wizard@latest -i nextjs
```

**sentry.client.config.ts:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

**Features:**
- Real-time error tracking
- Stack traces
- User context
- Release tracking
- Performance monitoring
- Alerts

**Cost:** $26/month (Team plan)

---

### 4. Logging

**✅ Structured Logging** (Already Implemented)

```typescript
import { log } from "@/lib/logger";

// Log levels
log.info("User action", { userId, action });
log.warn("Slow query", { query, duration });
log.error("Failed to save", error, { context });
```

**Log Aggregation (Optional):**

#### Logtail
```bash
npm install @logtail/pino

# pino-logtail.js
import { Logtail } from "@logtail/pino";

const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
logger.addDestination(logtail);
```

#### Betterstack
- Real-time logs
- Search & filter
- Alerts
- Dashboards

**Cost:** $10-20/month

---

### 5. User Analytics

**✅ Vercel Analytics** (Already Active)

**Custom Events:**
```typescript
import { track } from "@vercel/analytics";

// Track custom events
track("homework_completed", {
  subject: "Matematika",
  grade: 5,
});

track("camera_used", {
  compressionRatio: 0.65,
});
```

**Metrics to Track:**
- Homework completion rate
- Camera usage
- Feature adoption
- User retention
- Session duration

---

## 📊 Key Metrics to Monitor

### Application Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Uptime | 99.9% | <99% |
| Response Time (p95) | <200ms | >500ms |
| Error Rate | <0.1% | >1% |
| CPU Usage | <70% | >85% |
| Memory Usage | <80% | >90% |
| Disk Usage | <70% | >85% |

### Database Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Connection Pool | <80% | >90% |
| Query Time (p95) | <100ms | >500ms |
| Slow Queries | 0 | >10/hour |
| Lock Waits | 0 | >5/hour |
| Deadlocks | 0 | >1/day |

### User Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Daily Active Users | Growth | -20% WoW |
| Session Duration | >5 min | <2 min |
| Bounce Rate | <40% | >60% |
| Homework Completion | >75% | <50% |
| Camera Success Rate | >95% | <80% |

---

## 🚨 Alert Configuration

### Critical Alerts (Immediate)

- ❗ Site down (>2 min)
- ❗ Database down
- ❗ Error rate >5%
- ❗ Response time >2s
- ❗ Disk space >95%

**Notification:** SMS + Phone Call + Slack

### High Priority (15 min)

- ⚠️ Error rate >1%
- ⚠️ Response time >500ms
- ⚠️ Memory >85%
- ⚠️ Failed jobs >10

**Notification:** Email + Slack

### Medium Priority (1 hour)

- ℹ️ Slow queries
- ℹ️ High CPU
- ℹ️ Backup failed

**Notification:** Email

---

## 📈 Dashboards

### Dashboard 1: Overview

**Metrics:**
- Uptime (7 days)
- Active users (real-time)
- Request rate
- Error rate
- Response time (p50, p95, p99)

**Tools:**
- Vercel Analytics Dashboard
- Grafana (self-hosted)
- Datadog (paid)

---

### Dashboard 2: User Behavior

**Metrics:**
- New registrations (daily)
- Homework completion rate
- Feature usage
- User retention (D1, D7, D30)
- Session duration

---

### Dashboard 3: Technical

**Metrics:**
- API endpoint latency
- Database query time
- Memory usage
- CPU usage
- Error breakdown by type

---

## 🔍 Log Analysis

### Common Queries

**Find errors in last hour:**
```bash
grep "ERROR" logs/*.log | grep "$(date +%Y-%m-%d\ %H:)"
```

**Top error types:**
```bash
grep "ERROR" logs/*.log | awk '{print $5}' | sort | uniq -c | sort -nr
```

**Slowest endpoints:**
```bash
grep "duration" logs/*.log | sort -t: -k3 -nr | head -20
```

**User actions:**
```bash
grep "User action" logs/*.log | tail -100
```

---

## 📱 Mobile Monitoring

### Service Worker Issues

**Check registration:**
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('SW Registrations:', registrations.length);
});
```

**Check sync status:**
```javascript
// Monitor pending syncs
const pending = await offlineStorage.getSyncQueue();
console.log('Pending syncs:', pending.length);
```

### PWA Install Rate

```typescript
// Track installation
track("pwa_installed", {
  platform: navigator.platform,
  ua: navigator.userAgent,
});
```

---

## 🎯 SLA (Service Level Agreement)

### Commitment

**Uptime:** 99.9% (8.76 hours downtime/year)

**Response Time:**
- P50: <150ms
- P95: <300ms
- P99: <500ms

**Support:**
- Critical: <1 hour
- High: <4 hours
- Medium: <24 hours
- Low: <72 hours

---

## 🔧 Troubleshooting Guide

### High CPU Usage

1. Check slow queries
2. Review recent changes
3. Check for loops
4. Scale horizontally

### High Memory Usage

1. Check for memory leaks
2. Review image uploads
3. Clear caches
4. Restart server

### Database Connection Issues

1. Check connection pool
2. Increase pool size
3. Check database health
4. Scale database

### Slow Response Times

1. Check database indexes
2. Review N+1 queries
3. Enable query caching
4. Use CDN for static assets

---

## 📞 On-Call Rotation

### Schedule

| Week | Primary | Secondary |
|------|---------|-----------|
| Week 1 | Dev A | Dev B |
| Week 2 | Dev B | Dev C |
| Week 3 | Dev C | Dev A |

### Responsibilities

**On-Call:**
- Respond to alerts <15 min
- Investigate issues
- Fix or escalate
- Document incidents

**Handoff:**
- Weekly meeting
- Review incidents
- Share learnings

---

## 🎓 Training

### New Team Member Checklist

- [ ] Access to monitoring tools
- [ ] Access to logs
- [ ] Access to production (read-only)
- [ ] Incident response training
- [ ] Runbook review
- [ ] Shadow on-call shift

---

**Monitoring je ključ za stabilan sistem! 👁️**

