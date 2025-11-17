# 🔒 Security Hardening - Implementation Guide

**Status**: ✅ Implemented  
**Date**: October 2025

---

## 📋 Overview

Security hardening je već implementiran u Osnovci aplikaciji sa sledećim komponentama:
- ✅ Rate Limiting (Upstash Redis)
- ✅ Input Validation (Zod schemas)
- ✅ CSRF Protection
- ✅ File Upload Security
- ✅ Content Sanitization

---

## 🚦 Rate Limiting

### Implementation

**Location**: `lib/security/rate-limit.ts`

**Features**:
- Sliding window algorithm
- Redis-backed (Upstash)
- IP + User ID identification
- Automatic cleanup
- Fail-open strategy (allows requests if Redis down)

### Usage in API Routes

```typescript
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Apply rate limiting
  const result = await rateLimit(request, RateLimitPresets.moderate);
  
  if (!result.success) {
    const headers = new Headers();
    addRateLimitHeaders(headers, result);
    
    return NextResponse.json(
      { message: "Previše zahteva. Pokušajte ponovo kasnije." },
      { status: 429, headers }
    );
  }
  
  // Process request...
  const response = NextResponse.json({ success: true });
  addRateLimitHeaders(response.headers, result);
  return response;
}
```

### Rate Limit Presets

| Preset | Limit | Window | Use Case |
|--------|-------|--------|----------|
| **strict** | 10 req | 60s | Login, Register, Password Reset |
| **moderate** | 30 req | 60s | API Endpoints (Homework, Grades) |
| **relaxed** | 100 req | 60s | Read-only endpoints |
| **upload** | 5 req | 300s | File uploads |

### Custom Rate Limits

```typescript
const customLimit = await rateLimit(request, {
  limit: 50,
  window: 120, // 50 requests per 2 minutes
  prefix: "custom-endpoint",
});
```

---

## ✅ Input Validation

### Implementation

**Location**: `lib/security/validators.ts`

**Available Schemas**:
- `idSchema` - Alphanumeric IDs (prevents SQL injection)
- `emailSchema` - RFC 5322 compliant
- `phoneSchema` - Serbian format (+381 or 06)
- `nameSchema` - Names with Serbian characters
- `passwordSchema` - Min 8 chars, mixed case, numbers
- `safeStringSchema` - General text (max 10,000 chars)
- `urlSchema` - HTTPS only in production
- `gradeSchema` - 1-5 grades
- `classGradeSchema` - 1-8 classes
- `fileNameSchema` - Safe filenames (no path traversal)
- `paginationSchema` - Page/limit validation
- `sortOrderSchema` - asc/desc

### Usage in API Routes

```typescript
import { idSchema, emailSchema, safeStringSchema } from "@/lib/security/validators";
import { z } from "zod";

// Define request body schema
const requestSchema = z.object({
  studentId: idSchema,
  email: emailSchema,
  notes: safeStringSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = requestSchema.parse(body);
    
    // Use validated data
    const { studentId, email, notes } = validated;
    
    // Process...
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: "Neispravni podaci",
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### Search Query Sanitization

```typescript
import { sanitizeSearchQuery } from "@/lib/security/validators";

const { searchParams } = new URL(request.url);
const rawQuery = searchParams.get("q") || "";
const safeQuery = sanitizeSearchQuery(rawQuery); // Removes special chars, limits length
```

---

## 🛡️ CSRF Protection

### Implementation

**Location**: `lib/security/csrf.ts`

**Provider**: `lib/security/csrf-provider.tsx`

### Server-Side Usage

```typescript
import { generateCsrfToken, verifyCsrfToken } from "@/lib/security/csrf";

// Generate token (in page/form handler)
const { token, secret } = generateCsrfToken();
// Store secret in session/cookie
// Send token to client

// Verify token (in API route)
export async function POST(request: Request) {
  const { csrfToken } = await request.json();
  const secret = request.cookies.get("csrf-secret")?.value;
  
  if (!verifyCsrfToken(csrfToken, secret)) {
    return NextResponse.json(
      { message: "Invalid CSRF token" },
      { status: 403 }
    );
  }
  
  // Process request...
}
```

### Client-Side Usage (with Provider)

```tsx
"use client";

import { useCsrf } from "@/lib/security/csrf-provider";

export function MyForm() {
  const { token } = useCsrf();
  
  const handleSubmit = async (data: FormData) => {
    await fetch("/api/endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token, // Include token
      },
      body: JSON.stringify({ ...data }),
    });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## 📁 File Upload Security

### Implementation

**Location**: `lib/security/file-upload.ts`

**Features**:
- File type validation (whitelist)
- File size limits
- Malicious file detection
- Safe filename generation
- Content-Type verification

### Usage

```typescript
import { validateFileUpload, generateSafeFileName } from "@/lib/security/file-upload";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  // Validate file
  const validation = await validateFileUpload(file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
  });
  
  if (!validation.valid) {
    return NextResponse.json(
      { message: validation.error },
      { status: 400 }
    );
  }
  
  // Generate safe filename
  const safeFileName = generateSafeFileName(file.name);
  
  // Save file...
}
```

---

## 🧹 Content Sanitization

### Implementation

**Location**: `lib/security/sanitize.ts`

**Features**:
- HTML sanitization (XSS prevention)
- Script tag removal
- Attribute whitelist
- URL validation

### Usage

```typescript
import { sanitizeHtml, sanitizeUserInput } from "@/lib/security/sanitize";

// Sanitize HTML content
const userHtml = "<script>alert('xss')</script><p>Safe content</p>";
const safe = sanitizeHtml(userHtml); // "<p>Safe content</p>"

// Sanitize general user input
const userInput = "Normal text with <dangerous> tags";
const cleaned = sanitizeUserInput(userInput); // Escapes HTML
```

---

## 🔐 Combined Security Pattern

### Complete Secure API Route Example

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from "@/lib/security/rate-limit";
import { idSchema, safeStringSchema } from "@/lib/security/validators";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { sanitizeUserInput } from "@/lib/security/sanitize";
import { z } from "zod";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/db/prisma";

// Define request schema
const requestSchema = z.object({
  studentId: idSchema,
  title: z.string().min(3).max(100),
  description: safeStringSchema,
  csrfToken: z.string(),
});

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.moderate);
    
    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);
      
      return NextResponse.json(
        { message: "Previše zahteva. Pokušajte ponovo kasnije." },
        { status: 429, headers }
      );
    }
    
    // 2. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 401 }
      );
    }
    
    // 3. Parse and validate input
    const body = await request.json();
    const validated = requestSchema.parse(body);
    
    // 4. CSRF Protection
    const csrfSecret = request.cookies.get("csrf-secret")?.value;
    if (!verifyCsrfToken(validated.csrfToken, csrfSecret || "")) {
      return NextResponse.json(
        { message: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    
    // 5. Sanitize user input
    const sanitizedTitle = sanitizeUserInput(validated.title);
    const sanitizedDescription = sanitizeUserInput(validated.description);
    
    // 6. Authorization check
    const student = await prisma.student.findUnique({
      where: { id: validated.studentId },
    });
    
    if (!student || student.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Neautorizovan pristup" },
        { status: 403 }
      );
    }
    
    // 7. Process request
    // ... your business logic here
    
    // 8. Log success
    log.info("API request processed successfully", {
      userId: session.user.id,
      studentId: validated.studentId,
    });
    
    // 9. Return response with rate limit headers
    const response = NextResponse.json({ success: true });
    addRateLimitHeaders(response.headers, rateLimitResult);
    return response;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: "Neispravni podaci",
          errors: error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }
    
    log.error("API request failed", error);
    return NextResponse.json(
      { message: "Interna greška servera" },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing Security

### Rate Limit Testing

```bash
# Test rate limiting
for i in {1..35}; do
  curl http://localhost:3000/api/endpoint -H "X-User-Id: test-user"
  echo "Request $i"
done

# Should see 429 after 30 requests (moderate preset)
```

### Input Validation Testing

```typescript
// Test with invalid inputs
const invalidInputs = [
  { studentId: "../../../etc/passwd" }, // Path traversal
  { studentId: "'; DROP TABLE users; --" }, // SQL injection
  { email: "not-an-email" }, // Invalid email
  { grade: 10 }, // Out of range
];

for (const input of invalidInputs) {
  try {
    requestSchema.parse(input);
    console.error("FAILED: Should have thrown error");
  } catch (error) {
    console.log("PASSED: Validation caught malicious input");
  }
}
```

---

## 📊 Security Monitoring

### Key Metrics to Track

1. **Rate Limit Violations**
   - Track in logs: `log.warn("Rate limit exceeded")`
   - Alert threshold: >100 violations/hour

2. **Validation Failures**
   - Track Zod errors in API routes
   - Monitor patterns of invalid inputs

3. **CSRF Token Failures**
   - Indicates potential CSRF attack
   - Log and investigate source IPs

4. **File Upload Rejections**
   - Malicious file attempts
   - Track file types rejected

### Logging Examples

```typescript
// Rate limit violation
log.warn("Rate limit exceeded", {
  identifier: "user:abc123",
  endpoint: "/api/homework",
  limit: 30,
  window: 60,
});

// Validation failure
log.warn("Input validation failed", {
  userId: session.user.id,
  endpoint: "/api/students",
  errors: error.errors,
});

// CSRF failure
log.error("CSRF token verification failed", {
  userId: session.user.id,
  ip: request.ip,
  endpoint: "/api/settings",
});
```

---

## 🔧 Configuration

### Environment Variables

```env
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# CSRF Protection
CSRF_SECRET=your-secret-key-here
# OR use existing
NEXTAUTH_SECRET=your-nextauth-secret

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Node Environment
NODE_ENV=production  # Enforces HTTPS, stricter validation
```

---

## 📚 Best Practices

### 1. Always Apply Rate Limiting

```typescript
// ❌ Bad - No rate limiting
export async function POST(request: Request) {
  // Direct processing
}

// ✅ Good - Rate limit first
export async function POST(request: Request) {
  const result = await rateLimit(request, RateLimitPresets.moderate);
  if (!result.success) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }
  // Process...
}
```

### 2. Validate All Inputs

```typescript
// ❌ Bad - Direct use of user input
const { studentId } = await request.json();
const student = await prisma.student.findUnique({ where: { id: studentId } });

// ✅ Good - Validate first
const validated = idSchema.parse(studentId);
const student = await prisma.student.findUnique({ where: { id: validated } });
```

### 3. Sanitize User Content

```typescript
// ❌ Bad - Direct storage of HTML
const comment = await request.json();
await prisma.comment.create({ data: { content: comment.html } });

// ✅ Good - Sanitize first
const sanitized = sanitizeHtml(comment.html);
await prisma.comment.create({ data: { content: sanitized } });
```

### 4. Layer Security

Combine multiple security measures:
1. Rate Limiting (prevent abuse)
2. Authentication (verify identity)
3. Input Validation (prevent injection)
4. Authorization (check permissions)
5. Sanitization (clean data)
6. Logging (track activity)

---

## 🚨 Common Vulnerabilities Prevented

| Vulnerability | Protection | Implementation |
|---------------|------------|----------------|
| **SQL Injection** | Input validation | `idSchema`, parameterized queries |
| **XSS** | Content sanitization | `sanitizeHtml()`, `sanitizeUserInput()` |
| **CSRF** | Token verification | `verifyCsrfToken()` |
| **Path Traversal** | Filename validation | `fileNameSchema` |
| **DDoS** | Rate limiting | `rateLimit()` |
| **File Upload Attacks** | Type/size validation | `validateFileUpload()` |
| **Timing Attacks** | Constant-time comparison | `timingSafeEqual()` in CSRF |

---

## 📝 Checklist for New API Routes

- [ ] Apply rate limiting with appropriate preset
- [ ] Validate all input with Zod schemas
- [ ] Check authentication (session)
- [ ] Verify authorization (ownership/permissions)
- [ ] Sanitize user-generated content
- [ ] Add proper error handling
- [ ] Log security events
- [ ] Return appropriate HTTP status codes
- [ ] Add rate limit headers to response
- [ ] Test with malicious inputs

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Status**: ✅ Production Ready
