#!/usr/bin/env tsx

/**
 * Upload Database Backups to Cloud Storage
 * Supports: AWS S3, Google Cloud Storage, Azure Blob Storage
 * 
 * Usage:
 *   npm run backup:cloud -- s3
 *   npm run backup:cloud -- gcs
 *   npm run backup:cloud -- azure
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";

// Upload to AWS S3
async function uploadToS3(backupPath: string) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET not configured");
  }

  console.log(`☁️  Uploading to S3: ${bucket}`);

  const filename = backupPath.split("/").pop();
  const s3Path = `s3://${bucket}/backups/${filename}`;

  await execAsync(`aws s3 cp "${backupPath}" "${s3Path}" --region ${region}`);

  console.log(`✅ Uploaded to S3: ${s3Path}`);
}

// Upload to Google Cloud Storage
async function uploadToGCS(backupPath: string) {
  const bucket = process.env.GCS_BUCKET;

  if (!bucket) {
    throw new Error("GCS_BUCKET not configured");
  }

  console.log(`☁️  Uploading to GCS: ${bucket}`);

  const filename = backupPath.split("/").pop();
  const gcsPath = `gs://${bucket}/backups/${filename}`;

  await execAsync(`gsutil cp "${backupPath}" "${gcsPath}"`);

  console.log(`✅ Uploaded to GCS: ${gcsPath}`);
}

// Upload to Azure Blob Storage
async function uploadToAzure(backupPath: string) {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const container = process.env.AZURE_CONTAINER || "backups";

  if (!account) {
    throw new Error("AZURE_STORAGE_ACCOUNT not configured");
  }

  console.log(`☁️  Uploading to Azure: ${account}/${container}`);

  const filename = backupPath.split("/").pop();

  await execAsync(
    `az storage blob upload --account-name ${account} --container-name ${container} --name "backups/${filename}" --file "${backupPath}"`,
  );

  console.log(`✅ Uploaded to Azure: ${account}/${container}/${filename}`);
}

// Get latest backup
function getLatestBackup(): string {
  const files = readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith("backup_"))
    .map((file) => ({
      name: file,
      path: join(BACKUP_DIR, file),
      mtime: statSync(join(BACKUP_DIR, file)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length === 0) {
    throw new Error("No backups found");
  }

  return files[0].path;
}

// Main upload function
async function uploadToCloud(provider: "s3" | "gcs" | "azure") {
  try {
    console.log("☁️  Starting cloud upload...");

    const backupPath = getLatestBackup();
    console.log(`📦 Backup: ${backupPath}`);

    switch (provider) {
      case "s3":
        await uploadToS3(backupPath);
        break;
      case "gcs":
        await uploadToGCS(backupPath);
        break;
      case "azure":
        await uploadToAzure(backupPath);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    console.log("✅ Cloud upload completed!");
  } catch (error) {
    console.error("❌ Cloud upload failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const provider = process.argv[2] as "s3" | "gcs" | "azure";

  if (!provider || !["s3", "gcs", "azure"].includes(provider)) {
    console.error("❌ Usage: npm run backup:cloud -- [s3|gcs|azure]");
    process.exit(1);
  }

  uploadToCloud(provider);
}

export default uploadToCloud;

