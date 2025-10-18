#!/usr/bin/env tsx

/**
 * Automated Database Backup Script
 * Supports SQLite, PostgreSQL, and MySQL
 * 
 * Usage:
 *   npm run backup        - Create backup
 *   npm run backup:auto   - Scheduled backup (cron)
 */

import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync, createReadStream, createWriteStream } from "fs";
import { join } from "path";
import { format } from "date-fns";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
const DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";
const MAX_BACKUPS = Number.parseInt(process.env.MAX_BACKUPS || "30", 10);
const COMPRESSION = process.env.BACKUP_COMPRESSION === "true";

// Database type detection
function detectDatabaseType(): "sqlite" | "postgresql" | "mysql" {
  if (DATABASE_URL.startsWith("file:") || DATABASE_URL.includes(".db")) {
    return "sqlite";
  }
  if (DATABASE_URL.startsWith("postgresql://") || DATABASE_URL.startsWith("postgres://")) {
    return "postgresql";
  }
  if (DATABASE_URL.startsWith("mysql://")) {
    return "mysql";
  }
  throw new Error("Unsupported database type");
}

// Create backup directory
function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

// Generate backup filename
function generateBackupFilename(dbType: string): string {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const extension = dbType === "sqlite" ? "db" : "sql";
  return `backup_${timestamp}.${extension}${COMPRESSION ? ".gz" : ""}`;
}

// Backup SQLite
async function backupSQLite(): Promise<string> {
  const sourcePath = DATABASE_URL.replace("file:", "");
  const backupPath = join(BACKUP_DIR, generateBackupFilename("sqlite"));

  console.log(`📦 Backing up SQLite database: ${sourcePath}`);

  if (!existsSync(sourcePath)) {
    throw new Error(`Database file not found: ${sourcePath}`);
  }

  // Copy database file (cross-platform)
  if (COMPRESSION) {
    // Compress using Node.js streams (cross-platform)
    await pipeline(
      createReadStream(sourcePath),
      createGzip(),
      createWriteStream(backupPath)
    );
  } else {
    // Simple copy (cross-platform)
    copyFileSync(sourcePath, backupPath);
  }

  console.log(`✅ Backup created: ${backupPath}`);
  return backupPath;
}

// Backup PostgreSQL
async function backupPostgreSQL(): Promise<string> {
  const backupPath = join(BACKUP_DIR, generateBackupFilename("postgresql"));

  console.log("📦 Backing up PostgreSQL database");

  const pgDumpCmd = COMPRESSION
    ? `pg_dump "${DATABASE_URL}" | gzip > "${backupPath}"`
    : `pg_dump "${DATABASE_URL}" > "${backupPath}"`;

  try {
    await execAsync(pgDumpCmd);
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    throw new Error(`PostgreSQL backup failed: ${error}`);
  }
}

// Backup MySQL
async function backupMySQL(): Promise<string> {
  const backupPath = join(BACKUP_DIR, generateBackupFilename("mysql"));

  console.log("📦 Backing up MySQL database");

  // Parse MySQL connection string
  const url = new URL(DATABASE_URL.replace("mysql://", "http://"));
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port || "3306";
  const database = url.pathname.slice(1);

  const mysqldumpCmd = COMPRESSION
    ? `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} | gzip > "${backupPath}"`
    : `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > "${backupPath}"`;

  try {
    await execAsync(mysqldumpCmd);
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    throw new Error(`MySQL backup failed: ${error}`);
  }
}

// Clean old backups
function cleanOldBackups() {
  console.log(`🧹 Cleaning old backups (keeping last ${MAX_BACKUPS})`);

  const files = readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith("backup_"))
    .map((file) => ({
      name: file,
      path: join(BACKUP_DIR, file),
      mtime: statSync(join(BACKUP_DIR, file)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  // Delete old backups
  const toDelete = files.slice(MAX_BACKUPS);
  for (const file of toDelete) {
    unlinkSync(file.path);
    console.log(`🗑️  Deleted old backup: ${file.name}`);
  }

  console.log(`✅ Kept ${Math.min(files.length, MAX_BACKUPS)} backups`);
}

// Get backup size
function getBackupSize(path: string): string {
  const stats = statSync(path);
  const sizeInMB = stats.size / (1024 * 1024);
  return `${sizeInMB.toFixed(2)} MB`;
}

// Main backup function
async function backup() {
  try {
    console.log("🚀 Starting database backup...");
    console.log(`📅 Date: ${new Date().toISOString()}`);

    ensureBackupDir();

    const dbType = detectDatabaseType();
    console.log(`🗄️  Database type: ${dbType.toUpperCase()}`);

    let backupPath: string;

    switch (dbType) {
      case "sqlite":
        backupPath = await backupSQLite();
        break;
      case "postgresql":
        backupPath = await backupPostgreSQL();
        break;
      case "mysql":
        backupPath = await backupMySQL();
        break;
    }

    const size = getBackupSize(backupPath);
    console.log(`📊 Backup size: ${size}`);

    cleanOldBackups();

    console.log("✅ Backup completed successfully!");
    return backupPath;
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
}

// Restore backup (optional)
export async function restore(backupPath: string) {
  console.log(`🔄 Restoring backup: ${backupPath}`);

  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const dbType = detectDatabaseType();

  switch (dbType) {
    case "sqlite": {
      const targetPath = DATABASE_URL.replace("file:", "");
      const restoreCmd = backupPath.endsWith(".gz")
        ? `gunzip -c "${backupPath}" > "${targetPath}"`
        : `cp "${backupPath}" "${targetPath}"`;
      await execAsync(restoreCmd);
      break;
    }
    case "postgresql": {
      const restoreCmd = backupPath.endsWith(".gz")
        ? `gunzip -c "${backupPath}" | psql "${DATABASE_URL}"`
        : `psql "${DATABASE_URL}" < "${backupPath}"`;
      await execAsync(restoreCmd);
      break;
    }
    case "mysql": {
      const url = new URL(DATABASE_URL.replace("mysql://", "http://"));
      const user = url.username;
      const password = url.password;
      const host = url.hostname;
      const port = url.port || "3306";
      const database = url.pathname.slice(1);
      const restoreCmd = backupPath.endsWith(".gz")
        ? `gunzip -c "${backupPath}" | mysql -h ${host} -P ${port} -u ${user} -p${password} ${database}`
        : `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < "${backupPath}"`;
      await execAsync(restoreCmd);
      break;
    }
  }

  console.log("✅ Restore completed successfully!");
}

// List backups
export function listBackups() {
  console.log("📋 Available backups:");

  const files = readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith("backup_"))
    .map((file) => {
      const path = join(BACKUP_DIR, file);
      const stats = statSync(path);
      return {
        name: file,
        size: getBackupSize(path),
        date: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const file of files) {
    console.log(`  📦 ${file.name} - ${file.size} - ${file.date}`);
  }

  console.log(`\n📊 Total: ${files.length} backups`);
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "list":
      listBackups();
      break;
    case "restore":
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.error("❌ Please provide backup path");
        process.exit(1);
      }
      restore(backupPath);
      break;
    default:
      backup();
  }
}

export default backup;

