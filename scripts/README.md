# Osnovci - Testing Guide

## Phase 1 Automated Testing

### Quick Test
Run the automated test script to verify Phase 1 security features:

```powershell
# Start dev server first
npm run dev

# In a new terminal, run tests
powershell -ExecutionPolicy Bypass -File scripts/test-phase1-final.ps1
```

### Expected Output
```
[PHASE 1] CRITICAL SECURITY FIXES - TEST RESULTS
==================================================

Testing Redis Connection Pooling... [PASS]
  Redis status: not_configured

==================================================

[SUCCESS] Phase 1 Security Features Deployed

Completed Implementations:
  [1] JWT Token Blacklist
  [2] Parental Consent Rate Limiting
  [3] Leaderboard Name Masking
  [4] Advanced File Security
  [5] XSS Protection
  [6] Database Performance Indexes
  [7] Redis Connection Pooling
```

### Manual Testing Checklist

See [PHASE1_TEST_REPORT.md](../docs/PHASE1_TEST_REPORT.md) for detailed manual testing scenarios.

#### Quick Manual Tests:

1. **JWT Blacklist**
   - Login → Logout → Try reusing token → Expect 401

2. **Rate Limiting**
   - Try 6 failed consent codes → Expect lockout

3. **Name Masking**
   - Check leaderboard → Expect "First L." format

4. **File Security**
   - Upload image with GPS → Verify EXIF removed

5. **XSS Protection**
   - Create homework with `<script>` → Verify stripped

6. **Performance**
   - Load dashboard → Check API response times <100ms

## Full Test Suite

### Unit Tests (Vitest - NOT WORKING YET)
```bash
# Path alias resolution issue
npm test
```

### Integration Tests (Manual)
See checklist in test report.

## Test Scripts

- `test-phase1-final.ps1` - Main automated test (PowerShell)
- `test-phase1.ps1` - Simplified version
- `test-phase1.mjs` - Node.js version (path issues)

## Environment Setup for Testing

```bash
# Optional but recommended for full testing
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
VIRUSTOTAL_API_KEY=your-api-key-here
```

Without Redis/VirusTotal, features gracefully degrade (in-memory fallback).

## Test Report

Detailed test results: [docs/PHASE1_TEST_REPORT.md](../docs/PHASE1_TEST_REPORT.md)
