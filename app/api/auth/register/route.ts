// Registracija API - kreiranje novog korisnika (Security Enhanced!)

import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAndSendVerificationEmail } from "@/lib/auth/email-verification";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";
import { csrfMiddleware } from "@/lib/security/csrf";
import {
  addRateLimitHeaders,
  RateLimitPresets,
  rateLimit,
} from "@/lib/security/rate-limit";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  phoneSchema,
  safeStringSchema,
} from "@/lib/security/validators";

const registerSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: passwordSchema, // Enhanced password validation
    role: z.enum(["STUDENT", "GUARDIAN"]),
    name: nameSchema,
    // Za učenike
    school: safeStringSchema.max(200).optional(),
    grade: z.number().int().min(1).max(8).optional(),
    class: safeStringSchema.max(10).optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Mora postojati email ili telefon",
  });

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting - Strict (10 requests per minute)
    const rateLimitResult = await rateLimit(request, {
      ...RateLimitPresets.strict,
      prefix: "register",
    });

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult);

      return NextResponse.json(
        {
          error: "Too Many Requests",
          message:
            "Previše pokušaja registracije. Pokušaj ponovo za par minuta.",
        },
        { status: 429, headers },
      );
    }

    // CSRF Protection (important for public registration!)
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: "Forbidden", message: csrfResult.error },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Nevažeći podaci", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const {
      email,
      phone,
      password,
      role,
      name,
      school,
      grade,
      class: className,
    } = validated.data;

    // Proveri da li korisnik već postoji
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Korisnik sa ovim email-om već postoji" },
          { status: 400 },
        );
      }
    }

    if (phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Korisnik sa ovim telefonom već postoji" },
          { status: 400 },
        );
      }
    }

    // Hash lozinke
    const hashedPassword = await bcrypt.hash(password, 12);

    // Kreiraj korisnika
    const user = await prisma.user.create({
      data: {
        ...(email && { email }),
        ...(phone && { phone }),
        password: hashedPassword,
        role,
        ...(role === "STUDENT" && {
          student: {
            create: {
              name,
              school: school || "",
              grade: grade || 1,
              class: className || "1",
            },
          },
        }),
        ...(role === "GUARDIAN" && {
          guardian: {
            create: {
              name,
            },
          },
        }),
      },
      include: {
        student: true,
        guardian: true,
      },
    });

    // 🎯 NOVO - Pošalji email verifikaciju ako je email dostupan
    let emailVerificationSent = false;
    if (email) {
      try {
        const emailResult = await createAndSendVerificationEmail(email, name);
        emailVerificationSent = emailResult.success;

        if (!emailResult.success) {
          log.warn("Failed to send verification email", {
            email,
          });
        }
      } catch (emailError) {
        log.error("Error sending verification email", { emailError });
      }
    }

    // 🎯 NOVO - Vrati success sa redirect na verify-pending ako je email
    if (email && emailVerificationSent) {
      return NextResponse.json(
        {
          success: true,
          message: "Nalog uspešno kreiran! Proveri email za verifikaciju.",
          email,
          needsVerification: true,
          user: {
            id: user.id,
            role: user.role,
          },
        },
        { status: 201 },
      );
    }

    // Ako nema email-a ili verifikacija nije poslana
    return NextResponse.json(
      {
        success: true,
        message: "Nalog uspešno kreiran!",
        user: {
          id: user.id,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("Registration failed", { error });
    return NextResponse.json(
      { error: "Greška pri kreiranju naloga" },
      { status: 500 },
    );
  }
}
