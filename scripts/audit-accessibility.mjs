/**
 * Accessibility Audit Tool
 * Scans components for WCAG AA compliance issues
 * 
 * Run: node scripts/audit-accessibility.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const issues = [];
let filesScanned = 0;

console.log('♿ Starting WCAG AA Accessibility Audit...\n');

// Patterns to check
const checks = [
  {
    name: 'Missing aria-label on icon buttons',
    pattern: /<Button[^>]*size="icon"(?![^>]*aria-label)/g,
    severity: 'high',
    fix: 'Add aria-label attribute to icon-only buttons',
  },
  {
    name: 'Image without alt text',
    pattern: /<img(?![^>]*alt=)/gi,
    severity: 'high',
    fix: 'Add alt attribute to all images',
  },
  {
    name: 'Input without label',
    pattern: /<input(?![^>]*aria-label)(?![^>]*id=)/gi,
    severity: 'medium',
    fix: 'Add aria-label or associate with a <label> using id',
  },
  {
    name: 'Button without accessible text',
    pattern: /<button[^>]*>[\s]*<(?:svg|img)/gi,
    severity: 'high',
    fix: 'Add aria-label or visible text to button',
  },
  {
    name: 'Missing heading hierarchy',
    pattern: /<h(\d)[^>]*>/gi,
    severity: 'low',
    fix: 'Ensure proper heading order (h1 -> h2 -> h3)',
  },
];

// Scan directory recursively
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      scanFile(filePath);
    }
  }
}

function scanFile(filePath) {
  filesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  for (const check of checks) {
    const matches = content.match(check.pattern);
    if (matches) {
      issues.push({
        file: relativePath,
        issue: check.name,
        severity: check.severity,
        occurrences: matches.length,
        fix: check.fix,
        matches: matches.slice(0, 3), // First 3 examples
      });
    }
  }
}

// Run audit
const componentsDir = path.join(process.cwd(), 'components');
const appDir = path.join(process.cwd(), 'app');

console.log('📂 Scanning components/...');
scanDirectory(componentsDir);

console.log('📂 Scanning app/...');
scanDirectory(appDir);

// Generate report
console.log(`\n✅ Scanned ${filesScanned} files\n`);

if (issues.length === 0) {
  console.log('🎉 No accessibility issues found! Great job!\n');
} else {
  console.log(`⚠️  Found ${issues.length} potential accessibility issues:\n`);

  // Group by severity
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  const low = issues.filter(i => i.severity === 'low');

  if (high.length > 0) {
    console.log('🔴 HIGH PRIORITY:\n');
    high.forEach(issue => {
      console.log(`  ${issue.file}`);
      console.log(`  ├─ Issue: ${issue.issue}`);
      console.log(`  ├─ Occurrences: ${issue.occurrences}`);
      console.log(`  └─ Fix: ${issue.fix}\n`);
    });
  }

  if (medium.length > 0) {
    console.log('🟡 MEDIUM PRIORITY:\n');
    medium.forEach(issue => {
      console.log(`  ${issue.file}`);
      console.log(`  ├─ Issue: ${issue.issue}`);
      console.log(`  ├─ Occurrences: ${issue.occurrences}`);
      console.log(`  └─ Fix: ${issue.fix}\n`);
    });
  }

  if (low.length > 0) {
    console.log('🟢 LOW PRIORITY:\n');
    low.forEach(issue => {
      console.log(`  ${issue.file}`);
      console.log(`  ├─ Issue: ${issue.issue}`);
      console.log(`  └─ Occurrences: ${issue.occurrences}\n`);
    });
  }
}

// Save report to file
const report = {
  timestamp: new Date().toISOString(),
  filesScanned,
  totalIssues: issues.length,
  high: issues.filter(i => i.severity === 'high').length,
  medium: issues.filter(i => i.severity === 'medium').length,
  low: issues.filter(i => i.severity === 'low').length,
  issues,
};

const reportPath = path.join(process.cwd(), 'accessibility-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n📄 Full report saved to: accessibility-report.json`);
console.log('\n💡 Next steps:');
console.log('  1. Fix high priority issues first');
console.log('  2. Add aria-labels to all icon buttons');
console.log('  3. Ensure all images have alt text');
console.log('  4. Test with screen reader (NVDA/JAWS)');
console.log('  5. Run Lighthouse accessibility audit\n');
