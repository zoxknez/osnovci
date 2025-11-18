# 🧪 Testing Guide - Osnovci

Kompletan testing setup za aplikaciju Osnovci sa unit, integration i E2E testovima.

---

## 📊 Test Coverage Status

| Type | Coverage | Target | Status |
|------|----------|--------|--------|
| **Unit Tests** | ~15% | 70% | 🟡 In Progress |
| **E2E Tests** | 3 suites | 10+ suites | 🟡 In Progress |
| **Integration** | 0% | 40% | ⚠️ Planned |

---

## 🏗️ Test Infrastructure

### Unit Tests (Vitest)
- **Framework**: Vitest + Testing Library
- **Config**: `config/vitest.config.ts`
- **Location**: `__tests__/`
- **Mocking**: Vi mocks for Prisma, Redis, External APIs

### E2E Tests (Playwright)
- **Framework**: Playwright
- **Config**: `playwright.config.ts`
- **Location**: `e2e/`
- **Browsers**: Chromium, Mobile Chrome

---

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run once (CI mode)
npm run test:run
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

### All Tests

```bash
# Run both unit and E2E
npm run test:all
```

---

## 📁 Test Structure

```
__tests__/
├── api/
│   ├── homework.test.ts          ✅ Basic CRUD
│   ├── auth/
│   │   └── login.test.ts         ⚠️ Needs implementation
│   └── upload/
│       └── security.test.ts      ⚠️ Needs implementation
├── components/
│   ├── ui/
│   │   └── button.test.tsx       ⚠️ Needs implementation
│   └── features/
│       └── camera.test.tsx       ⚠️ Needs implementation
└── lib/
    ├── utils/
    │   └── cn.test.ts            ✅ Complete
    ├── safety/
    │   └── content-filter.test.ts ✅ Complete
    ├── auth/
    │   ├── account-lockout.test.ts ✅ Complete
    │   └── stranger-danger.test.ts ✅ Complete
    └── gamification/
        └── xp-calculator.test.ts  ✅ Complete

e2e/
├── auth/
│   └── login.spec.ts             ✅ Complete (8 tests)
├── homework/
│   └── crud.spec.ts              ✅ Complete (7 tests)
└── upload/
    └── file-security.spec.ts     ✅ Complete (6 tests)
```

---

## ✅ Implemented Tests

### Unit Tests (5 files)

1. **`lib/utils/cn.test.ts`**
   - Class name merging utility
   - Tailwind class deduplication

2. **`lib/safety/content-filter.test.ts`**
   - Profanity detection
   - Age-appropriate content
   - PII detection (email, phone, JMBG)

3. **`lib/auth/account-lockout.test.ts`**
   - Brute force protection
   - 5 failed attempts → lockout
   - Automatic unlock after 15min

4. **`lib/auth/stranger-danger.test.ts`**
   - Multi-step QR verification
   - Child approval flow
   - Email verification

5. **`lib/gamification/xp-calculator.test.ts`**
   - XP calculation logic
   - Level progression
   - Bonus multipliers

### E2E Tests (3 files, 21 total tests)

1. **`e2e/auth/login.spec.ts`** (8 tests)
   - Login/logout flow
   - Session persistence
   - Account lockout
   - Registration navigation

2. **`e2e/homework/crud.spec.ts`** (7 tests)
   - Create, read, update, delete
   - Filtering and search
   - Offline support

3. **`e2e/upload/file-security.spec.ts`** (6 tests)
   - Valid file acceptance
   - Malicious file rejection
   - Size limit enforcement
   - Camera permission handling

---

## 🎯 Testing Best Practices

### Unit Tests

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("MyComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clean state
  });

  it("should render correctly", () => {
    // Arrange
    const props = { name: "Test" };
    
    // Act
    render(<MyComponent {...props} />);
    
    // Assert
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  // Navigate
  await page.goto('/');
  
  // Interact
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Assert
  await expect(page).toHaveURL(/dashboard/);
});
```

---

## 🔧 Troubleshooting

### Vitest Issues

**Problem**: Tests fail with module resolution errors
```bash
# Solution: Check vitest.config.ts alias configuration
```

**Problem**: Mock not working
```bash
# Solution: Use vi.mock() at the top of the file
vi.mock('@/lib/prisma', () => ({
  prisma: { /* mock */ }
}));
```

### Playwright Issues

**Problem**: Tests timeout
```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60 * 1000, // 60 seconds
```

**Problem**: Browser not found
```bash
# Solution: Install browsers
npx playwright install chromium
```

**Problem**: Server not starting
```bash
# Solution: Check if port 3000 is available
# Or change baseURL in playwright.config.ts
```

---

## 📈 Coverage Goals

### Phase 1 (Current)
- ✅ Basic unit tests (5 files)
- ✅ Core E2E flows (3 files)
- **Target: 20% coverage**

### Phase 2 (Next 2 weeks)
- [ ] API route tests (15 files)
- [ ] Component tests (10 files)
- [ ] Integration tests (5 files)
- **Target: 40% coverage**

### Phase 3 (4 weeks)
- [ ] Complete unit coverage (50 files)
- [ ] Complete E2E coverage (10 files)
- [ ] Visual regression tests
- **Target: 70% coverage**

---

## 🤖 CI/CD Integration

### GitHub Actions (Example)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Writing New Tests

### 1. Unit Test Template

```typescript
// __tests__/lib/my-module.test.ts
import { describe, expect, it } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

### 2. E2E Test Template

```typescript
// e2e/feature/my-test.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/feature');
    // ... test steps
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

## 🎓 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Last Updated**: November 17, 2025  
**Maintained By**: Development Team  
**Status**: ✅ Testing Infrastructure Complete, Coverage In Progress
