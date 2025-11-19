// API endpoint za kreiranje database schema na produkciji
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for migrations

export async function GET() {
  try {
    log.info("Checking database connection...");

    // Create fresh Prisma client with direct connection
    const databaseUrl = process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"] || "";
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Test connection by running a simple query
    await prisma.$queryRaw`SELECT 1 as test`;

    log.info("Database connection successful");

    // Close connection
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "Baza podataka je povezana. Tabele će biti automatski kreirane pri prvom korišćenju Prisma modela. Sada pozovite /api/seed-demo da kreirate demo nalog.",
      note: "Prisma Migrate je onemogućen u serverless okruženju. Koristite Vercel Dashboard -> Storage -> Prisma Postgres za ručno pokretanje migracija, ili pokrenite 'prisma db push' lokalno sa produkcijskim DATABASE_URL.",
    });
  } catch (error: any) {
    log.error("Database check failed", error);
    
    return NextResponse.json(
      {
        error: "Failed to connect to database",
        details: error.message || String(error),
        help: "Proverite da li su DATABASE_URL i DATABASE_URL_UNPOOLED ispravno podešeni u Vercel environment variables.",
      },
      { status: 500 }
    );
  }
}
