#!/usr/bin/env tsx

/**
 * Performance Load Testing Script
 * Tests API endpoints under load
 *
 * Usage:
 *   npm run perf:test        - Run performance tests
 */

import http from "node:http";
import https from "node:https";
import { performance } from "node:perf_hooks";

const BASE_URL = process.env["TEST_URL"] || "http://localhost:3000";
const CONCURRENT_REQUESTS = Number.parseInt(
  process.env["CONCURRENT"] || "10",
  10,
);
const TOTAL_REQUESTS = Number.parseInt(process.env["REQUESTS"] || "100", 10);
const TIMEOUT = Number.parseInt(process.env["TIMEOUT"] || "5000", 10);

interface RequestResult {
  url: string;
  duration: number;
  statusCode: number;
  success: boolean;
}

interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
}

// Test endpoints
const ENDPOINTS = [
  { name: "Home", url: "/" },
  { name: "Login", url: "/prijava" },
  { name: "Dashboard", url: "/dashboard" },
  { name: "API Health", url: "/api/health" },
];

// Make HTTP request
function makeRequest(url: string): Promise<RequestResult> {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}${url}`;
    const lib = fullUrl.startsWith("https") ? https : http;
    const start = performance.now();

    const req = lib.get(fullUrl, { timeout: TIMEOUT }, (res) => {
      let _data = "";
      res.on("data", (chunk) => {
        _data += chunk;
      });
      res.on("end", () => {
        const duration = performance.now() - start;
        resolve({
          url,
          duration,
          statusCode: res.statusCode || 0,
          success: res.statusCode === 200,
        });
      });
    });

    req.on("error", () => {
      const duration = performance.now() - start;
      resolve({
        url,
        duration,
        statusCode: 0,
        success: false,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      const duration = performance.now() - start;
      resolve({
        url,
        duration,
        statusCode: 0,
        success: false,
      });
    });
  });
}

// Calculate statistics
function calculateStats(results: RequestResult[]): TestSummary {
  const durations = results.map((r) => r.duration).sort((a, b) => a - b);
  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const min = durations[0] ?? 0;
  const max = durations[durations.length - 1] ?? 0;

  const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] ?? 0;

  const totalDuration = max;
  const rps = totalDuration > 0 ? (results.length / totalDuration) * 1000 : 0;

  return {
    totalRequests: results.length,
    successfulRequests: successful,
    failedRequests: failed,
    averageDuration: avg,
    minDuration: min,
    maxDuration: max,
    p50,
    p95,
    p99,
    requestsPerSecond: rps,
  };
}

// Run load test on endpoint
async function testEndpoint(name: string, url: string): Promise<TestSummary> {
  console.log(`\n🔥 Load testing: ${name} (${url})`);
  console.log(`  Requests: ${TOTAL_REQUESTS}`);
  console.log(`  Concurrency: ${CONCURRENT_REQUESTS}`);

  const results: RequestResult[] = [];
  let completed = 0;

  // Progress bar
  const progressBar = (current: number, total: number) => {
    const percent = Math.floor((current / total) * 100);
    const filled = Math.floor(percent / 2);
    const empty = 50 - filled;
    process.stdout.write(
      `\r  Progress: [${"█".repeat(filled)}${" ".repeat(empty)}] ${percent}% (${current}/${total})`,
    );
  };

  // Run requests in batches
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i);
    const promises = Array.from({ length: batch }, () => makeRequest(url));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    completed += batch;
    progressBar(completed, TOTAL_REQUESTS);
  }

  console.log("\n");

  const stats = calculateStats(results);

  console.log(
    `  ✅ Success: ${stats.successfulRequests}/${stats.totalRequests}`,
  );
  console.log(`  ❌ Failed: ${stats.failedRequests}`);
  console.log(`  ⏱️  Average: ${stats.averageDuration.toFixed(2)}ms`);
  console.log(`  🚀 Min: ${stats.minDuration.toFixed(2)}ms`);
  console.log(`  🐌 Max: ${stats.maxDuration.toFixed(2)}ms`);
  console.log(`  📊 P50: ${stats.p50.toFixed(2)}ms`);
  console.log(`  📊 P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`  📊 P99: ${stats.p99.toFixed(2)}ms`);
  console.log(`  🔥 RPS: ${stats.requestsPerSecond.toFixed(2)}`);

  return stats;
}

// Main test function
async function runPerformanceTests() {
  try {
    console.log("🚀 Starting performance tests...");
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);

    const results: { name: string; stats: TestSummary }[] = [];

    for (const endpoint of ENDPOINTS) {
      try {
        const stats = await testEndpoint(endpoint.name, endpoint.url);
        results.push({ name: endpoint.name, stats });
      } catch (error) {
        console.error(`  ❌ Failed to test ${endpoint.name}:`, error);
      }
    }

    // Summary
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 PERFORMANCE TEST SUMMARY");
    console.log("=".repeat(80));

    for (const result of results) {
      console.log(`\n${result.name}:`);
      console.log(
        `  Success Rate: ${((result.stats.successfulRequests / result.stats.totalRequests) * 100).toFixed(1)}%`,
      );
      console.log(
        `  Avg Response: ${result.stats.averageDuration.toFixed(2)}ms`,
      );
      console.log(`  P95: ${result.stats.p95.toFixed(2)}ms`);
      console.log(
        `  Throughput: ${result.stats.requestsPerSecond.toFixed(2)} req/s`,
      );
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log("✅ Performance tests completed!");
  } catch (error) {
    console.error("❌ Performance tests failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceTests();
}

export default runPerformanceTests;
