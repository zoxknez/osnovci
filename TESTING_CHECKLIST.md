# ✅ Manual Testing Checklist

**Server Running:** http://localhost:3000  
**Date:** October 21, 2025

---

## 🔐 Authentication & Security Tests

### Test 1: Dashboard Auth Protection
- [ ] Navigate to http://localhost:3000/dashboard (logged out)
- [ ] **Expected:** Redirect to `/prijava`
- [ ] **Status:** ___________

### Test 2: Login Flow
- [ ] Go to http://localhost:3000/prijava
- [ ] Login with valid credentials
- [ ] **Expected:** Redirect to `/dashboard` after successful login
- [ ] **Status:** ___________

### Test 3: Login Redirect Fix
- [ ] Verify page fully refreshes (not just client-side navigation)
- [ ] Check Network tab: window.location.href causes full page reload
- [ ] **Expected:** Dashboard loads with fresh session
- [ ] **Status:** ___________

### Test 4: Account Lockout
- [ ] Try logging in with wrong password 5 times
- [ ] **Expected:** Account locked for 15 minutes
- [ ] Try logging in with correct password
- [ ] **Expected:** Error "Account locked, try again in X minutes"
- [ ] **Status:** ___________

### Test 5: CSRF Protection
- [ ] Open DevTools → Console
- [ ] Run: `fetch('/api/csrf').then(r => r.json()).then(console.log)`
- [ ] **Expected:** JSON with `{token: "...", secret: "..."}`
- [ ] Verify sessionStorage has `csrf_token`
- [ ] **Status:** ___________

### Test 6: COPPA Compliance (if student without consent)
- [ ] Register as student without parental consent
- [ ] Try accessing dashboard
- [ ] **Expected:** Redirect to `/consent-required`
- [ ] **Status:** ___________

---

## 🚦 Rate Limiting Tests

### Test 7: Register Rate Limit (10/min)
Run in terminal:
```bash
for ($i=1; $i -le 12; $i++) {
  curl -X POST http://localhost:3000/api/auth/register `
    -H "Content-Type: application/json" `
    -d "{\"email\":\"test$i@test.com\",\"password\":\"Test123!\",\"role\":\"STUDENT\",\"name\":\"Test\"}" `
    -i | Select-String "X-RateLimit"
}
```

- [ ] First 10 requests: Status 200/201
- [ ] 11th request: Status 429 "Too Many Requests"
- [ ] Response includes headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After
- [ ] **Status:** ___________

### Test 8: Homework API Rate Limit (100/min for GET)
```bash
for ($i=1; $i -le 5; $i++) {
  curl http://localhost:3000/api/homework -i | Select-String "X-RateLimit"
}
```

- [ ] All requests succeed with rate limit headers
- [ ] X-RateLimit-Remaining decreases
- [ ] **Status:** ___________

---

## 🛡️ Security Headers Tests

### Test 9: CSP Headers
```bash
curl -I http://localhost:3000
```

- [ ] Response includes `Content-Security-Policy` header
- [ ] Header includes nonce reference (in production)
- [ ] Development mode: includes `unsafe-inline` and `unsafe-eval`
- [ ] **Status:** ___________

### Test 10: Security Headers
```bash
curl -I http://localhost:3000
```

Check for:
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `x-nonce: <random-base64>` (middleware injection)
- [ ] **Status:** ___________

---

## 🎯 Performance Tests

### Test 11: Database Indexes
Run in Prisma Studio or SQL:
```sql
EXPLAIN ANALYZE 
SELECT * FROM homework 
WHERE "studentId" = 'some-id' AND priority = 'HIGH' 
ORDER BY "dueDate";
```

- [ ] Query plan shows: Index Scan using `homework_studentId_priority_dueDate_idx`
- [ ] Execution time: <50ms
- [ ] **Status:** ___________

### Test 12: Connection Pool
Check logs for:
```
[Prisma] Connection pool: 20 connections
```

- [ ] No "connection timeout" errors
- [ ] Queries execute smoothly
- [ ] **Status:** ___________

---

## 🐛 Error Handling Tests

### Test 13: Camera Error Boundary
- [ ] Go to http://localhost:3000/dashboard/domaci
- [ ] Click "Fotografiši dokaz"
- [ ] Deny camera permission
- [ ] **Expected:** User-friendly error message (not blank screen)
- [ ] **Status:** ___________

### Test 14: API Error Handling
```bash
curl http://localhost:3000/api/homework/invalid-id
```

- [ ] **Expected:** JSON error response, not HTML
- [ ] Status 404 with proper error message
- [ ] **Status:** ___________

### Test 15: Sentry Integration (if configured)
- [ ] Trigger an error (e.g., invalid API call)
- [ ] Check browser console for Sentry capture
- [ ] **Expected:** Error logged to Sentry (if DSN configured)
- [ ] **Status:** ___________

---

## 📱 PWA & Offline Tests

### Test 16: Service Worker
- [ ] Open DevTools → Application → Service Workers
- [ ] **Expected:** Service worker registered and active
- [ ] Check manifest.json loads
- [ ] **Status:** ___________

### Test 17: Offline Mode (if implemented)
- [ ] Create homework while online
- [ ] Turn off network (DevTools → Network → Offline)
- [ ] Try creating homework
- [ ] **Expected:** Saved to IndexedDB
- [ ] Turn network back on
- [ ] **Expected:** Auto-sync
- [ ] **Status:** ___________

---

## 🎨 UI/UX Tests

### Test 18: Dark Mode
- [ ] Toggle dark mode in settings
- [ ] **Expected:** Smooth transition, all components styled
- [ ] **Status:** ___________

### Test 19: Responsive Design
- [ ] Open DevTools → Toggle device toolbar
- [ ] Test on: Mobile (375px), Tablet (768px), Desktop (1920px)
- [ ] **Expected:** All layouts responsive, no overflow
- [ ] **Status:** ___________

### Test 20: Accessibility
- [ ] Navigate with keyboard only (Tab, Enter, Escape)
- [ ] **Expected:** All interactive elements accessible
- [ ] Screen reader test (if available)
- [ ] **Status:** ___________

---

## 🔄 React Query & State Tests

### Test 21: Smart Retry Logic
- [ ] Kill development server
- [ ] Try loading dashboard
- [ ] **Expected:** Retry 2 times for 5xx errors
- [ ] **Expected:** Immediate redirect to /prijava for 401
- [ ] Restart server
- [ ] **Expected:** Auto-refetch on reconnect
- [ ] **Status:** ___________

### Test 22: CSRF Token Auto-Refresh
- [ ] Login and stay on page for 30+ minutes
- [ ] Make a mutation (e.g., create homework)
- [ ] **Expected:** CSRF token auto-refreshes, request succeeds
- [ ] **Status:** ___________

---

## 📊 Health Check

### Test 23: API Health Endpoint
```bash
curl http://localhost:3000/api/health
```

- [ ] **Expected:** `{"status":"ok"}`
- [ ] Status 200
- [ ] **Status:** ___________

---

## 🎯 SUMMARY

| Category | Tests | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| **Auth & Security** | 6 | ___ | ___ | ___ |
| **Rate Limiting** | 2 | ___ | ___ | ___ |
| **Security Headers** | 2 | ___ | ___ | ___ |
| **Performance** | 2 | ___ | ___ | ___ |
| **Error Handling** | 3 | ___ | ___ | ___ |
| **PWA & Offline** | 2 | ___ | ___ | ___ |
| **UI/UX** | 3 | ___ | ___ | ___ |
| **State Management** | 2 | ___ | ___ | ___ |
| **Health Check** | 1 | ___ | ___ | ___ |
| **TOTAL** | **23** | ___ | ___ | ___ |

---

## 🚀 PASS CRITERIA

**Minimum to pass:** 20/23 tests (87%)  
**Production ready:** 23/23 tests (100%)

---

## 📝 NOTES

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Recommendations:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

**Tested By:** _______________  
**Date:** October 21, 2025  
**Time:** _______________  
**Environment:** Development (localhost:3000)  
**Result:** ☐ PASS | ☐ FAIL | ☐ PARTIAL

---

## 🎉 After Testing

If all tests pass:
1. ✅ Commit all changes
2. ✅ Push to repository
3. ✅ Deploy to staging/production
4. ✅ Monitor Sentry for 24 hours
5. ✅ Celebrate! 🎊

**Server URL:** http://localhost:3000  
**Admin Panel:** http://localhost:3000/dashboard  
**API Docs:** _Not implemented (future enhancement)_
