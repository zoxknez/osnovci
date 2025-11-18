// Registracija API - kreiranje novog korisnika (Security Enhanced!)

import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAge } from "@/lib/auth/age-verification";
import { createAndSendVerificationEmail } from "@/lib/auth/email-verification";
import { sendParentalConsentEmail } from "@/lib/email/parental-consent";
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
    dateOfBirth: z.string().optional(), // ISO date string
    // Za učenike
    school: safeStringSchema.max(200).optional(),
    grade: z.number().int().min(1).max(8).optional(),
    class: safeStringSchema.max(10).optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Mora postojati email ili telefon",
  })
  .refine((data) => {
    // Studenti MORAJU imati dateOfBirth (COPPA compliance)
    if (data.role === "STUDENT" && !data.dateOfBirth) {
      return false;
    }
    return true;
  }, {
    message: "Datum rođenja je obavezan za učenike (COPPA zakon)",
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
      dateOfBirth,
      school,
      grade,
      class: className,
    } = validated.data;

    // 🔒 COPPA COMPLIANCE - Age Verification
    let needsParentalConsent = false;
    let ageVerificationResult = null;

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      ageVerificationResult = verifyAge(dob);

      if (!ageVerificationResult.isValid) {
        return NextResponse.json(
          {
            error: "Nevažeći datum rođenja",
            message: ageVerificationResult.message,
          },
          { status: 400 },
        );
      }

      needsParentalConsent = ageVerificationResult.requiresConsent;

      // Log age verification for students
      if (role === "STUDENT") {
        log.info("Age verification for student registration", {
          age: ageVerificationResult.age,
          needsConsent: needsParentalConsent,
        });
      }
    }

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
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(role === "STUDENT" && {
          student: {
            create: {
              name,
              school: school || "",
              grade: grade || 1,
              class: className || "1",
              parentalConsentGiven: !needsParentalConsent, // Auto-approve if >13
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

    // 🎯 Email Verification - pošalji email verifikaciju ako je email dostupan
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

    // 🔒 COPPA Parental Consent - kreiraj consent request i pošalji email
    let parentalConsentEmailSent = false;
    
    if (needsParentalConsent && email && user.student) {
      try {
        // Import consent helper
        const { createConsentRequest } = await import("@/lib/auth/parental-consent");
        const { markEmailSent } = await import("@/lib/auth/parental-consent");
        
        // Create consent request in database
        const consentResult = await createConsentRequest({
          studentId: user.student.id,
          parentEmail: email, // TODO: Add separate parent email field in registration
          parentName: "Poštovani roditelju/staratelju", // TODO: Add parent name field
          expiresInHours: 6,
        });

        if (consentResult.success && consentResult.code) {
          // Send email with consent code
          await sendParentalConsentEmail({
            childName: name,
            childAge: ageVerificationResult?.age || 0,
            parentEmail: email,
            parentName: "Poštovani roditelju/staratelju",
            consentToken: consentResult.code,
            consentUrl: `${process.env["NEXT_PUBLIC_APP_URL"]}/consent-verify`,
          });
          
          // Mark email as sent
          if (consentResult.consentId) {
            await markEmailSent(consentResult.consentId);
          }
          
          parentalConsentEmailSent = true;
          log.info("Parental consent request created and email sent", {
            studentId: user.student.id,
            consentId: consentResult.consentId,
            parentEmail: email,
          });
        }
      } catch (emailError) {
        log.error("Failed to create consent request or send email", { emailError });
      }
    }

    // 🎯 Vrati success response sa svim potrebnim informacijama
    if (needsParentalConsent) {
      return NextResponse.json(
        {
          success: true,
          message: "Nalog kreiran! Čeka se roditeljska saglasnost.",
          email,
          needsVerification: emailVerificationSent,
          needsParentalConsent: true,
          consentEmailSent: parentalConsentEmailSent,
          user: {
            id: user.id,
            role: user.role,
          },
        },
        { status: 201 },
      );
    }

    if (email && emailVerificationSent) {
      return NextResponse.json(
        {
          success: true,
          message: "Nalog uspešno kreiran! Proveri email za verifikaciju.",
          email,
          needsVerification: true,
          needsParentalConsent: false,
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
        needsParentalConsent: false,
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
