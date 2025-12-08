/**
 * Generate VAPID Keys for Web Push Notifications
 * Run this script once to generate keys, then add them to .env.local
 *
 * Usage: node scripts/generate-vapid-keys.mjs
 */

import fs from "fs";
import path from "path";
import webpush from "web-push";

console.log("🔑 Generating VAPID keys for Web Push Notifications...\n");

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("✅ VAPID keys generated successfully!\n");
console.log("📋 Add these to your .env.local file:\n");
console.log("# Web Push Notifications (VAPID Keys)");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log(
  `VAPID_SUBJECT="mailto:your-email@example.com"  # Or your website URL`,
);
console.log("\n");

// Optionally save to file
const envPath = path.join(process.cwd(), ".env.vapid");
const envContent = `# Web Push Notifications (VAPID Keys)
# Generated on ${new Date().toISOString()}
NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"
VAPID_SUBJECT="mailto:kontakt@osnovci.app"

# Copy these values to your .env.local file
`;

fs.writeFileSync(envPath, envContent);

console.log(`💾 Keys also saved to: ${envPath}`);
console.log(
  "⚠️  IMPORTANT: Add these to .env.local and DO NOT commit .env.vapid to git!",
);
console.log("✅ Done!");
