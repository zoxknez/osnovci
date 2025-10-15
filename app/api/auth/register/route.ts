// Registracija API - kreiranje novog korisnika

import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { log } from "@/lib/logger";

const registerSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
    role: z.enum(["STUDENT", "GUARDIAN"]),
    name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
    // Za učenike
    school: z.string().optional(),
    grade: z.number().min(1).max(8).optional(),
    class: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Mora postojati email ili telefon",
  });

export async function POST(request: NextRequest) {
  try {
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
        email,
        phone,
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
