# ⚡ Load Testing Guide

**Testiranje performansi pod opterećenjem**

---

## 🎯 Load Testing Goals

### Identify

- **Breaking Point:** Koliko korisnika može da podrži?
- **Bottlenecks:** Gde su uska grla?
- **Response Times:** Kako se ponaša pod opterećenjem?
- **Error Rates:** Kada počinju greške?

### Targets

| Metric | Target | Max Acceptable |
|--------|--------|----------------|
| Concurrent Users | 1000 | 5000 |
| Requests/sec | 100 | 500 |
| Response Time (p95) | <300ms | <1s |
| Error Rate | <0.1% | <1% |
| CPU Usage | <70% | <85% |
| Memory Usage | <80% | <90% |

---

## 🛠️ Load Testing Tools

### 1. Apache Bench (Simple)

**Install:**
```bash
# Ubuntu/Debian
apt-get install apache2-utils

# macOS
brew install ab

# Windows
# Download from Apache website
```

**Basic Test:**
```bash
# 1000 requests, 100 concurrent
ab -n 1000 -c 100 https://tvoj-domen.com/

# With authentication
ab -n 1000 -c 100 -H "Authorization: Bearer token" https://tvoj-domen.com/api/homework
```

**Results:**
```
Requests per second: 150 [#/sec]
Time per request: 6.67 [ms] (mean)
95% requests served within: 12ms
```

---

### 2. Artillery (Advanced)

**Install:**
```bash
npm install -g artillery
```

**Config:** `artillery.yml`
```yaml
config:
  target: "https://tvoj-domen.com"
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/sec
      name: "Warm up"
    - duration: 300
      arrivalRate: 50  # 50 users/sec
      name: "Peak load"
    - duration: 60
      arrivalRate: 5   # Cool down
      name: "Cool down"
  
scenarios:
  - name: "User Journey"
    flow:
      - get:
          url: "/"
      - post:
          url: "/api/auth/register"
          json:
            email: "test{{ $randomString() }}@test.com"
            password: "test123"
      - get:
          url: "/dashboard"
      - get:
          url: "/dashboard/domaci"
```

**Run:**
```bash
artillery run artillery.yml
```

---

### 3. k6 (Professional)

**Install:**
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Script:** `load-test.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 200 },  // Spike
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

export default function () {
  // Home page
  let res = http.get('https://tvoj-domen.com/');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'page loaded': (r) => r.body.includes('Osnovci'),
  });
  sleep(1);

  // Health check
  res = http.get('https://tvoj-domen.com/api/health');
  check(res, {
    'health is ok': (r) => r.json('status') === 'healthy',
  });
  sleep(1);
}
```

**Run:**
```bash
k6 run load-test.js
```

---

## 📋 Test Scenarios

### Scenario 1: Normal Load

**Users:** 100 concurrent  
**Duration:** 10 minutes  
**Pattern:** Steady

**Command:**
```bash
ab -n 6000 -c 100 -t 600 https://tvoj-domen.com/
```

**Expected:**
- Response time: <200ms (p95)
- Error rate: <0.1%
- CPU: <50%

---

### Scenario 2: Peak Load

**Users:** 500 concurrent  
**Duration:** 5 minutes  
**Pattern:** Steady

**Expected:**
- Response time: <500ms (p95)
- Error rate: <1%
- CPU: <70%

---

### Scenario 3: Stress Test

**Users:** Ramp 0 → 1000  
**Duration:** 20 minutes  
**Goal:** Find breaking point

**Expected:**
- Identify max capacity
- Graceful degradation
- No crashes

---

### Scenario 4: Spike Test

**Users:** 100 → 1000 → 100  
**Duration:** 10 minutes  
**Goal:** Test rapid scale-up

**Expected:**
- Handle sudden traffic
- Auto-scaling works
- Recovery time <2 min

---

### Scenario 5: Endurance Test

**Users:** 200 concurrent  
**Duration:** 24 hours  
**Goal:** Memory leaks, stability

**Expected:**
- No memory leaks
- Stable performance
- No degradation over time

---

## 🎯 Test Endpoints

### Priority 1 (Critical)

```bash
# Landing page
GET /

# Login
POST /api/auth/[...nextauth]

# Dashboard
GET /dashboard

# Homework list
GET /api/homework

# Add homework
POST /api/homework
```

### Priority 2 (Important)

```bash
# Schedule
GET /api/schedule

# Events
GET /api/events

# Profile
GET /api/profile

# Notifications
GET /api/notifications
```

---

## 📊 Results Analysis

### Good Results ✅

```
Requests per second: 150+
Response time (p95): <300ms
Error rate: <0.1%
CPU: <70%
Memory: <80%
```

### Warning Signs ⚠️

```
Response time (p95): 300-1000ms
Error rate: 0.1-1%
CPU: 70-85%
Memory: 80-90%
```

### Critical Issues 🚨

```
Response time (p95): >1000ms
Error rate: >1%
CPU: >85%
Memory: >90%
Server crashes
```

---

## 🔧 Performance Optimization

### If Results Are Bad

#### 1. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_homework_student ON homework(studentId);

-- Analyze queries
EXPLAIN ANALYZE SELECT * FROM homework WHERE ...;

-- Optimize slow queries
-- Add indexes, rewrite queries, denormalize
```

#### 2. Caching

```typescript
// Add Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache homework list
const cached = await redis.get(`homework:${userId}`);
if (cached) return JSON.parse(cached);

const homework = await prisma.homework.findMany(...);
await redis.set(`homework:${userId}`, JSON.stringify(homework), 'EX', 300);
```

#### 3. CDN

```typescript
// next.config.ts
images: {
  domains: ['cdn.tvoj-domen.com'],
}

// Serve static assets from CDN
```

#### 4. Horizontal Scaling

```bash
# Vercel: Auto-scales
# VPS: Add load balancer + multiple instances

# Nginx load balancer
upstream osnovci {
  server app1:3000;
  server app2:3000;
  server app3:3000;
}
```

---

## 📅 Testing Schedule

### Pre-Launch
- Week -2: Initial load test
- Week -1: Stress test
- Day -1: Final smoke test

### Post-Launch
- Week 1: Daily load tests
- Month 1: Weekly load tests
- Ongoing: Monthly load tests

### Before Major Changes
- Always run load tests
- Compare with baseline
- Document changes

---

## 🎓 Load Testing Checklist

### Pre-Test

- [ ] Define goals
- [ ] Choose tool
- [ ] Write test script
- [ ] Setup monitoring
- [ ] Notify team
- [ ] Use staging/test environment

### During Test

- [ ] Monitor dashboard
- [ ] Watch logs
- [ ] Check database
- [ ] Record metrics
- [ ] Take screenshots

### Post-Test

- [ ] Analyze results
- [ ] Identify bottlenecks
- [ ] Create tickets for issues
- [ ] Update documentation
- [ ] Share findings with team

---

## 📞 Load Testing Providers (Optional)

### Loader.io
- Free tier: 10,000 clients
- Cloud-based
- Easy setup

### BlazeMeter
- Professional
- JMeter compatible
- CI/CD integration

### K6 Cloud
- Official k6 cloud
- Global load generation
- Advanced analytics

**Cost:** $49-199/month

---

## 🎯 Success Criteria

**Pass Criteria:**
- ✅ 1000 concurrent users
- ✅ Response time <300ms (p95)
- ✅ Error rate <0.1%
- ✅ No crashes
- ✅ Graceful degradation

**If Failed:**
- Optimize code
- Scale infrastructure
- Add caching
- Retest

---

**Load testing je insurance - better safe than sorry! ⚡**

