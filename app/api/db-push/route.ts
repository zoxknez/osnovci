// API endpoint za kreiranje database schema na produkciji
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { log } from "@/lib/logger";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for schema push

export async function GET() {
  try {
    log.info("Starting database schema push...");

    // Run prisma db push
    const { stdout, stderr } = await execAsync("npx prisma db push --skip-generate", {
      env: {
        ...process.env,
        DATABASE_URL: process.env["DATABASE_URL"],
        DATABASE_URL_UNPOOLED: process.env["DATABASE_URL_UNPOOLED"],
      },
    });

    log.info("Database schema push completed", { stdout, stderr });

    return NextResponse.json({
      success: true,
      message: "Database schema uspešno kreirana",
      stdout,
      stderr,
    });
  } catch (error: any) {
    log.error("Database schema push failed", error);
    return NextResponse.json(
      {
        error: "Failed to push database schema",
        details: error.message || String(error),
        stdout: error.stdout,
        stderr: error.stderr,
      },
      { status: 500 }
    );
  }
}
