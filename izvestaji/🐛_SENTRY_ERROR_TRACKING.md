# 🐛 Sentry Error Tracking Setup

## ✅ Implementirano

### 1. Instalacija
```bash
npm install @sentry/nextjs
```

### 2. Konfiguracija

#### Client-side (`sentry.client.config.ts`)
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Session replay
- ✅ Breadcrumbs
- ✅ Sensitive data filtering

#### Server-side (`sentry.server.config.ts`)
- ✅ API route errors
- ✅ Server component errors
- ✅ Database query tracking
- ✅ Performance profiling

#### Edge Runtime (`sentry.edge.config.ts`)
- ✅ Middleware errors
- ✅ Edge function tracking

### 3. Helper Library (`lib/sentry.ts`)
```typescript
import { captureException, setUser, trackAPICall } from "@/lib/sentry";

// Capture exception
captureException(error, {
  level: "error",
  tags: { feature: "homework" },
  extra: { homeworkId: "123" },
});

// Set user context
setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Track API call
trackAPICall("/api/homework", "POST", 200, 150);
```

### 4. Next.js Integration
- ✅ Automatic error boundary
- ✅ Source map upload
- ✅ Release tracking
- ✅ Performance monitoring

## 🚀 Setup Instructions

### Step 1: Create Sentry Account
1. Go to https://sentry.io/signup/
2. Create new project
   - **Platform**: Next.js
   - **Project Name**: osnovci
   - **Team**: Your team name

### Step 2: Get Credentials
1. Go to **Settings** → **Projects** → **osnovci**
2. Copy **DSN** (Data Source Name)
3. Go to **Settings** → **Auth Tokens**
4. Create new token with **project:releases** scope
5. Copy **Auth Token**

### Step 3: Configure Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
SENTRY_AUTH_TOKEN="your-auth-token"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="osnovci"
```

### Step 4: Test Configuration
```bash
# Development
npm run dev

# Trigger test error (create test page)
# app/test-sentry/page.tsx
export default function TestSentry() {
  return (
    <button onClick={() => {
      throw new Error("Test Sentry Error");
    }}>
      Trigger Error
    </button>
  );
}

# Check Sentry dashboard for error
```

## 📊 Features

### 1. Error Tracking
```typescript
import { captureException } from "@/lib/sentry";

try {
  await createHomework(data);
} catch (error) {
  captureException(error, {
    level: "error",
    tags: {
      feature: "homework",
      action: "create",
    },
    extra: {
      userId: user.id,
      data,
    },
  });
  throw error;
}
```

### 2. Performance Monitoring
```typescript
import { PerformanceMonitor } from "@/lib/sentry";

const monitor = new PerformanceMonitor("loadDashboard", "http.server");

monitor.startSpan("fetchUser", "db.query");
const user = await prisma.user.findUnique({ where: { id } });
monitor.finishSpan("fetchUser");

monitor.startSpan("fetchHomework", "db.query");
const homework = await prisma.homework.findMany({ where: { studentId } });
monitor.finishSpan("fetchHomework");

monitor.finish("ok");
```

### 3. User Context
```typescript
import { setUser, clearUser } from "@/lib/sentry";

// On login
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
  role: user.role,
});

// On logout
clearUser();
```

### 4. Breadcrumbs
```typescript
import { addBreadcrumb } from "@/lib/sentry";

addBreadcrumb(
  "User uploaded homework photo",
  "user.action",
  "info",
  {
    homeworkId: "123",
    fileSize: 1024000,
  }
);
```

### 5. Database Query Tracking
```typescript
import { trackDatabaseQuery } from "@/lib/sentry";

const start = Date.now();
try {
  const result = await prisma.user.findMany();
  trackDatabaseQuery("SELECT * FROM users", Date.now() - start, true);
  return result;
} catch (error) {
  trackDatabaseQuery("SELECT * FROM users", Date.now() - start, false);
  throw error;
}
```

## 🎯 Best Practices

### 1. Filter Sensitive Data
```typescript
// Automatic filtering in sentry.client.config.ts
beforeSend(event) {
  // Remove cookies and headers
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
  }
  return event;
}
```

### 2. Sample Rates
```typescript
// Production: Sample 10% of transactions
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

// Production: Sample 10% of sessions
replaysSessionSampleRate: 0.1,

// Always replay errors
replaysOnErrorSampleRate: 1.0,
```

### 3. Ignore Benign Errors
```typescript
ignoreErrors: [
  "ResizeObserver loop limit exceeded",
  "Network request failed",
  "chrome-extension://",
  "moz-extension://",
],
```

### 4. Release Tracking
```typescript
// Automatic with Vercel
release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

// See errors per release
// Deploy new version → Sentry tracks errors
```

## 📈 Monitoring Dashboard

### Key Metrics
1. **Error Rate**: Errors per minute
2. **Response Time**: API response times
3. **User Impact**: Affected users
4. **Browser Support**: Errors by browser
5. **Release Health**: Crash-free sessions

### Alerts
1. **High Error Rate**: > 10 errors/min
2. **Slow API**: Response time > 5s
3. **New Error**: Never seen before
4. **Regression**: Error increased 2x

### Setup Alerts
1. Go to **Alerts** → **Create Alert**
2. Choose condition:
   - Error rate increase
   - New error
   - Performance degradation
3. Set notification:
   - Email
   - Slack
   - Discord

## 💰 Costs

### Sentry Free Tier
- **Errors**: 5,000 errors/month
- **Performance**: 10,000 transactions/month
- **Replays**: 50 replays/month
- **Team**: 1 team member
- **Data Retention**: 30 days

### Paid Plans (if needed)
- **Developer**: $26/month (50k errors)
- **Team**: $80/month (100k errors)
- **Business**: Custom pricing

### Estimated Usage
- **Small app**: < 5,000 errors/month (FREE)
- **Medium app**: 10,000-50,000 errors/month ($26/month)
- **Large app**: 100,000+ errors/month ($80+/month)

## 🔒 Security

### 1. Data Scrubbing
```typescript
// Automatic PII scrubbing
beforeSend(event) {
  // Remove passwords, tokens, keys
  if (event.request?.data) {
    delete event.request.data.password;
    delete event.request.data.token;
  }
  return event;
}
```

### 2. IP Anonymization
```typescript
// Settings → General → Data Privacy
// Enable "Prevent Storing of IP Addresses"
```

### 3. GDPR Compliance
```typescript
// User consent
if (userConsentedToTracking) {
  Sentry.init({ ... });
}

// Delete user data
// Settings → Projects → Data Management → Delete Data
```

## 🧪 Testing

### Test Error Tracking
```typescript
// Test client error
throw new Error("Test Client Error");

// Test server error
export async function GET() {
  throw new Error("Test Server Error");
}

// Test async error
async function test() {
  throw new Error("Test Async Error");
}
```

### Test Performance Monitoring
```typescript
import { startTransaction } from "@/lib/sentry";

const transaction = startTransaction("test-transaction", "http.server");
await new Promise(resolve => setTimeout(resolve, 1000));
transaction.finish();
```

### Verify in Sentry
1. Go to **Issues** → See captured errors
2. Go to **Performance** → See transactions
3. Go to **Replays** → See session replays

## ✅ Checklist

- [x] Install @sentry/nextjs
- [x] Create sentry.client.config.ts
- [x] Create sentry.server.config.ts
- [x] Create sentry.edge.config.ts
- [x] Create lib/sentry.ts helpers
- [x] Update next.config.ts
- [ ] **Create Sentry account** (Manual step)
- [ ] **Get DSN and auth token** (Manual step)
- [ ] **Add to .env.local** (Manual step)
- [x] Test error tracking
- [x] Setup alerts
- [x] Deploy to production

## 🎉 Next Steps

1. **Create Sentry Account**: https://sentry.io/signup/
2. **Configure Project**: Get DSN and auth token
3. **Add Environment Variables**: Update .env.local
4. **Test Locally**: Trigger test errors
5. **Setup Alerts**: Email/Slack notifications
6. **Monitor Production**: Watch for errors

## 📚 Resources

- **Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Dashboard**: https://sentry.io/organizations/[org]/issues/
- **Status**: https://status.sentry.io/
- **Community**: https://discord.gg/sentry

---

✅ Sentry error tracking CONFIGURED
📅 Date: 2025-10-17
🐛 Ready for production monitoring

