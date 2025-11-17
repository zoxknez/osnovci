#!/usr/bin/env tsx

/**
 * Lighthouse Performance Audit Script
 * Runs Lighthouse audits on key pages and generates reports
 *
 * Usage:
 *   npm run lighthouse        - Run audit on all pages
 *   npm run lighthouse:single - Run audit on single page
 */

import { exec } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const REPORTS_DIR = "./lighthouse-reports";
const BASE_URL = process.env["LIGHTHOUSE_URL"] || "http://localhost:3000";

// Pages to audit
const PAGES = [
  { name: "home", url: "/" },
  { name: "login", url: "/prijava" },
  { name: "dashboard", url: "/dashboard" },
  { name: "homework", url: "/dashboard/domaci" },
  { name: "schedule", url: "/dashboard/raspored" },
  { name: "grades", url: "/dashboard/ocene" },
];

interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

interface LighthouseMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  speedIndex: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

interface PageResult {
  name: string;
  url: string;
  scores: LighthouseScore;
  metrics: LighthouseMetrics;
  report: string;
}

// Ensure reports directory exists
function ensureReportsDir() {
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
    console.log(`✅ Created reports directory: ${REPORTS_DIR}`);
  }
}

// Run Lighthouse audit on a page
async function auditPage(name: string, url: string): Promise<PageResult> {
  console.log(`\n🔍 Auditing: ${name} (${url})`);

  const fullUrl = `${BASE_URL}${url}`;

  // Run Lighthouse
  const lighthouseCmd = `npx lighthouse "${fullUrl}" --output=json --output=html --output-path="${join(REPORTS_DIR, name)}" --chrome-flags="--headless --no-sandbox" --preset=desktop --only-categories=performance,accessibility,best-practices,seo,pwa --quiet`;

  try {
    await execAsync(lighthouseCmd);

    // Read JSON report
    const reportJson = JSON.parse(
      require("node:fs").readFileSync(
        `${join(REPORTS_DIR, name)}.report.json`,
        "utf-8",
      ),
    );

    // Extract scores
    const scores: LighthouseScore = {
      performance: reportJson.categories.performance.score * 100,
      accessibility: reportJson.categories.accessibility.score * 100,
      bestPractices: reportJson.categories["best-practices"].score * 100,
      seo: reportJson.categories.seo.score * 100,
      pwa: reportJson.categories.pwa.score * 100,
    };

    // Extract metrics
    const audits = reportJson.audits;
    const metrics: LighthouseMetrics = {
      firstContentfulPaint: audits["first-contentful-paint"].numericValue,
      largestContentfulPaint: audits["largest-contentful-paint"].numericValue,
      speedIndex: audits["speed-index"].numericValue,
      totalBlockingTime: audits["total-blocking-time"].numericValue,
      cumulativeLayoutShift: audits["cumulative-layout-shift"].numericValue,
    };

    console.log(`  ✅ Performance: ${scores.performance.toFixed(0)}`);
    console.log(`  ✅ Accessibility: ${scores.accessibility.toFixed(0)}`);
    console.log(`  ✅ Best Practices: ${scores.bestPractices.toFixed(0)}`);
    console.log(`  ✅ SEO: ${scores.seo.toFixed(0)}`);

    return {
      name,
      url: fullUrl,
      scores,
      metrics,
      report: `${join(REPORTS_DIR, name)}.report.html`,
    };
  } catch (error) {
    console.error(`  ❌ Failed to audit ${name}:`, error);
    throw error;
  }
}

// Generate summary report
function generateSummary(results: PageResult[]) {
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 LIGHTHOUSE AUDIT SUMMARY");
  console.log("=".repeat(80));

  // Calculate averages
  const avgScores = {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    pwa: 0,
  };

  for (const result of results) {
    avgScores.performance += result.scores.performance;
    avgScores.accessibility += result.scores.accessibility;
    avgScores.bestPractices += result.scores.bestPractices;
    avgScores.seo += result.scores.seo;
    avgScores.pwa += result.scores.pwa;
  }

  const count = results.length;
  avgScores.performance /= count;
  avgScores.accessibility /= count;
  avgScores.bestPractices /= count;
  avgScores.seo /= count;
  avgScores.pwa /= count;

  console.log("\n📈 Average Scores:");
  console.log(`  Performance:     ${avgScores.performance.toFixed(0)}/100`);
  console.log(`  Accessibility:   ${avgScores.accessibility.toFixed(0)}/100`);
  console.log(`  Best Practices:  ${avgScores.bestPractices.toFixed(0)}/100`);
  console.log(`  SEO:             ${avgScores.seo.toFixed(0)}/100`);
  console.log(`  PWA:             ${avgScores.pwa.toFixed(0)}/100`);

  console.log("\n📄 Page Scores:");
  for (const result of results) {
    console.log(`\n  ${result.name}:`);
    console.log(`    Performance:    ${result.scores.performance.toFixed(0)}`);
    console.log(
      `    Accessibility:  ${result.scores.accessibility.toFixed(0)}`,
    );
    console.log(
      `    Best Practices: ${result.scores.bestPractices.toFixed(0)}`,
    );
    console.log(`    SEO:            ${result.scores.seo.toFixed(0)}`);
    console.log(`    Report:         ${result.report}`);
  }

  // Generate markdown report
  const markdown = generateMarkdownReport(results, avgScores);
  const markdownPath = join(REPORTS_DIR, "summary.md");
  writeFileSync(markdownPath, markdown);
  console.log(`\n📝 Summary saved to: ${markdownPath}`);

  console.log(`\n${"=".repeat(80)}`);
}

// Generate markdown report
function generateMarkdownReport(
  results: PageResult[],
  avgScores: LighthouseScore,
): string {
  const date = new Date().toISOString();

  let md = `# 🚀 Lighthouse Performance Audit Report\n\n`;
  md += `**Date**: ${date}\n`;
  md += `**Base URL**: ${BASE_URL}\n`;
  md += `**Pages Audited**: ${results.length}\n\n`;

  md += `## 📊 Average Scores\n\n`;
  md += `| Category | Score |\n`;
  md += `|----------|-------|\n`;
  md += `| Performance | ${getScoreBadge(avgScores.performance)} ${avgScores.performance.toFixed(0)}/100 |\n`;
  md += `| Accessibility | ${getScoreBadge(avgScores.accessibility)} ${avgScores.accessibility.toFixed(0)}/100 |\n`;
  md += `| Best Practices | ${getScoreBadge(avgScores.bestPractices)} ${avgScores.bestPractices.toFixed(0)}/100 |\n`;
  md += `| SEO | ${getScoreBadge(avgScores.seo)} ${avgScores.seo.toFixed(0)}/100 |\n`;
  md += `| PWA | ${getScoreBadge(avgScores.pwa)} ${avgScores.pwa.toFixed(0)}/100 |\n\n`;

  md += `## 📄 Individual Page Scores\n\n`;

  for (const result of results) {
    md += `### ${result.name}\n\n`;
    md += `**URL**: ${result.url}\n\n`;
    md += `| Category | Score |\n`;
    md += `|----------|-------|\n`;
    md += `| Performance | ${getScoreBadge(result.scores.performance)} ${result.scores.performance.toFixed(0)}/100 |\n`;
    md += `| Accessibility | ${getScoreBadge(result.scores.accessibility)} ${result.scores.accessibility.toFixed(0)}/100 |\n`;
    md += `| Best Practices | ${getScoreBadge(result.scores.bestPractices)} ${result.scores.bestPractices.toFixed(0)}/100 |\n`;
    md += `| SEO | ${getScoreBadge(result.scores.seo)} ${result.scores.seo.toFixed(0)}/100 |\n\n`;

    md += `**Core Web Vitals**:\n`;
    md += `- FCP: ${(result.metrics.firstContentfulPaint / 1000).toFixed(2)}s\n`;
    md += `- LCP: ${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s\n`;
    md += `- CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)}\n`;
    md += `- TBT: ${result.metrics.totalBlockingTime.toFixed(0)}ms\n`;
    md += `- SI: ${(result.metrics.speedIndex / 1000).toFixed(2)}s\n\n`;
    md += `[View Full Report](${result.report})\n\n`;
  }

  return md;
}

// Get score badge
function getScoreBadge(score: number): string {
  if (score >= 90) return "🟢";
  if (score >= 50) return "🟡";
  return "🔴";
}

// Main audit function
async function runAudit() {
  try {
    console.log("🚀 Starting Lighthouse audit...");
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);

    ensureReportsDir();

    const results: PageResult[] = [];

    for (const page of PAGES) {
      try {
        const result = await auditPage(page.name, page.url);
        results.push(result);
      } catch (_error) {
        console.error(`Failed to audit ${page.name}, skipping...`);
      }
    }

    if (results.length === 0) {
      throw new Error("No pages were successfully audited");
    }

    generateSummary(results);

    console.log("\n✅ Lighthouse audit completed!");
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAudit();
}

export default runAudit;
