/**
 * Bundle Analysis Script
 * Analyzes Next.js bundle and generates optimization report
 * 
 * Run: npm run analyze
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Starting Bundle Analysis...\n');

// Build with bundle analysis
console.log('1️⃣  Building with bundle analyzer...');
try {
  execSync('cross-env ANALYZE=true npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('\n✅ Bundle analysis complete!');
console.log('\n📈 Next steps:');
console.log('  1. Open .next/analyze/client.html in browser');
console.log('  2. Look for large chunks (>200KB)');
console.log('  3. Identify heavy dependencies to lazy load');
console.log('\n💡 Common optimizations:');
console.log('  - Lazy load chart libraries (recharts, victory)');
console.log('  - Lazy load camera/video components');
console.log('  - Code split by route');
console.log('  - Use dynamic imports for modals');
