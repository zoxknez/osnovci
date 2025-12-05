/**
 * API endpoint za proveru database konekcije na produkciji
 * Zaštićen ADMIN_SECRET-om
 */

import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for migrations

export async function GET(request: NextRequest) {
  const requestId = nanoid();

  try {
    // Zaštita: samo sa ADMIN_SECRET u development ili Vercel deploy
    const adminSecret = request.headers.get("x-admin-secret");
    const envSecret = process.env["ADMIN_SECRET"];

    if (!envSecret || adminSecret !== envSecret) {
      log.warn("Unauthorized db-push access attempt", { requestId });
      return NextResponse.json(
        { error: "Nemate pristup", requestId },
        { status: 403 },
      );
    }

    log.info("Checking database connection...", { requestId });

    // Create fresh Prisma client with direct connection
    const databaseUrl =
      process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"] || "";

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Test connection by running a simple query
    await prisma.$queryRaw`SELECT 1 as test`;

    log.info("Database connection successful", { requestId });

    // Close connection
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      requestId,
      message:
        "Baza podataka je povezana. Tabele će biti automatski kreirane pri prvom korišćenju Prisma modela. Sada pozovite /api/seed-demo da kreirate demo nalog.",
      note: "Prisma Migrate je onemogućen u serverless okruženju. Koristite Vercel Dashboard -> Storage -> Prisma Postgres za ručno pokretanje migracija, ili pokrenite 'prisma db push' lokalno sa produkcijskim DATABASE_URL.",
    });
  } catch (error) {
    log.error("Database check failed", { error, requestId });

    return NextResponse.json(
      {
        error: "Greška pri povezivanju sa bazom",
        details: error instanceof Error ? error.message : "Nepoznata greška",
        help: "Proverite da li su DATABASE_URL i DATABASE_URL_UNPOOLED ispravno podešeni u Vercel environment variables.",
        requestId,
      },
      { status: 500 },
    );
  }
}
