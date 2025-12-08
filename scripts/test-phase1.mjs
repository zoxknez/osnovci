#!/usr/bin/env node
/**
 * Phase 1 Security Fixes - Manual Test Script
 * Direct Node.js testing without vitest
 */

console.log("\n🛡️  PHASE 1: CRITICAL SECURITY FIXES - TEST SUITE\n");
console.log("═══════════════════════════════════════════════════\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Assertion failed"}: expected "${expected}", got "${actual}"`,
    );
  }
}

function assertContains(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(
      `${message || "Assertion failed"}: expected to contain "${substring}"`,
    );
  }
}

function assertNotContains(text, substring, message) {
  if (text.includes(substring)) {
    throw new Error(
      `${message || "Assertion failed"}: expected NOT to contain "${substring}"`,
    );
  }
}

// ============================================
// TEST #3: Leaderboard Name Masking
// ============================================
(async () => {
  console.log("📋 Testing Issue #3: Leaderboard Name Masking\n");

  const { maskLeaderboardName } = await import("../lib/utils/privacy.ts");

  test("Should mask surname to initial", () => {
    const result = maskLeaderboardName("Marko Petrović", false);
    assertEqual(result, "Marko P.", "Name masking");
  });

  test("Should show full name for current user", () => {
    const result = maskLeaderboardName("Ana Jovanović", true);
    assertEqual(result, "Ana Jovanović", "Current user name");
  });

  test("Should handle multiple surnames", () => {
    const result = maskLeaderboardName("Stefan Milanović Đurić", false);
    assertEqual(result, "Stefan M. Đ.", "Multiple surnames");
  });

  test("Should handle single name", () => {
    const result = maskLeaderboardName("Marko", false);
    assertEqual(result, "Marko", "Single name");
  });

  test("Should preserve special characters", () => {
    const result = maskLeaderboardName("Petar Šešelj", false);
    assertEqual(result, "Petar Š.", "Special characters");
  });

  console.log("");

  // ============================================
  // TEST #5: XSS Protection
  // ============================================
  console.log("📋 Testing Issue #5: XSS Protection\n");

  const { sanitizeHtml, containsXssPatterns } = await import(
    "../lib/security/xss-protection.ts"
  );

  test("Should remove script tags", () => {
    const result = sanitizeHtml('<script>alert("XSS")</script>Hello', "strict");
    assertNotContains(result, "<script>", "Script removed");
    assertEqual(result, "Hello", "Clean output");
  });

  test("Should remove event handlers", () => {
    const result = sanitizeHtml(
      "<img src=x onerror=\"alert('XSS')\">",
      "strict",
    );
    assertNotContains(result, "onerror", "Event handler removed");
  });

  test("Should allow safe HTML", () => {
    const result = sanitizeHtml(
      "<p><b>Bold</b> and <i>italic</i></p>",
      "strict",
    );
    assertEqual(
      result,
      "<p><b>Bold</b> and <i>italic</i></p>",
      "Safe HTML preserved",
    );
  });

  test("Should remove javascript: protocol", () => {
    const result = sanitizeHtml(
      "<a href=\"javascript:alert('XSS')\">Click</a>",
      "strict",
    );
    assertNotContains(result, "javascript:", "JavaScript protocol removed");
    assertContains(result, "Click", "Text preserved");
  });

  test("Should detect XSS patterns", () => {
    const xssTests = [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      "javascript:void(0)",
    ];

    for (const xss of xssTests) {
      if (!containsXssPatterns(xss)) {
        throw new Error(`Failed to detect XSS: ${xss}`);
      }
    }
  });

  test("Should not flag safe content", () => {
    const safeTests = [
      "<p>Normal text</p>",
      '<a href="https://google.com">Link</a>',
    ];

    for (const safe of safeTests) {
      if (containsXssPatterns(safe)) {
        throw new Error(`False positive XSS detection: ${safe}`);
      }
    }
  });

  test("Should strip all HTML in minimal mode", () => {
    const result = sanitizeHtml("<b>Bold</b> text", "minimal");
    assertEqual(result, "Bold text", "Minimal mode");
  });

  test("Should handle empty input", () => {
    const result = sanitizeHtml("", "strict");
    assertEqual(result, "", "Empty input");
  });

  console.log("");

  // ============================================
  // SUMMARY
  // ============================================
  console.log("═══════════════════════════════════════════════════");
  console.log(`\n📊 TEST RESULTS: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log("🎉 ALL TESTS PASSED! ✅\n");
    console.log("Phase 1 Core Security Functions Verified:");
    console.log("  ✅ Leaderboard Name Masking (Privacy)");
    console.log("  ✅ XSS Protection (DOMPurify)");
    console.log("");
    console.log("Integration Tests (Manual verification required):");
    console.log("  ⚠️  JWT Token Blacklist (Redis)");
    console.log("  ⚠️  Parental Consent Rate Limiting (Redis)");
    console.log("  ⚠️  Advanced File Scanner (VirusTotal API)");
    console.log("  ⚠️  Database Indexes (Prisma)");
    console.log("  ⚠️  Redis Connection Pooling");
    console.log("");
    console.log("Run manual integration tests via:");
    console.log("  • http://localhost:3000/api/health/redis");
    console.log("  • Upload test files in app");
    console.log("  • Check leaderboard API endpoints");
    console.log("");
  } else {
    console.log("❌ SOME TESTS FAILED\n");
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════\n");
})();
