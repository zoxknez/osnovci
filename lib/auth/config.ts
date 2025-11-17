// NextAuth.js v5 configuration

import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import {
  isAccountLocked,
  recordLoginAttempt,
} from "@/lib/auth/account-lockout";
import { createSession } from "@/lib/auth/session-manager";
import { validateSessionCached } from "@/lib/auth/session-cache";
import { prisma } from "@/lib/db/prisma";

// ✅ Validate NEXTAUTH_SECRET exists
if (!process.env["NEXTAUTH_SECRET"]) {
  throw new Error(
    "NEXTAUTH_SECRET is not defined! Please add it to your .env file. Generate one with: openssl rand -base64 32",
  );
}

if (process.env["NEXTAUTH_SECRET"].length < 32) {
  throw new Error(
    "NEXTAUTH_SECRET must be at least 32 characters long for security!",
  );
}

const loginSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(6),
  })
  .refine((data) => data.email || data.phone, {
    message: "Mora postojati email ili telefon",
  });

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Koristimo JWT sesije bez adaptera za jednostavnost
  trustHost: true,
  basePath: "/api/auth",
  secret: process.env["NEXTAUTH_SECRET"],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/prijava",
    error: "/prijava",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Telefon", type: "tel" },
        password: { label: "Lozinka", type: "password" },
      },
      async authorize(credentials, _request) {
        const validated = loginSchema.safeParse(credentials);

        if (!validated.success) {
          return null;
        }

        const { email, phone, password } = validated.data;
        const loginEmail = email || phone || "";

        // Check if account is locked
        const lockStatus = await isAccountLocked(loginEmail);
        if (lockStatus.locked) {
          // Return null but with message (NextAuth will show error)
          throw new Error(lockStatus.message || "Account locked");
        }

        // Pronađi korisnika po email-u ili telefonu
        const user = await prisma.user.findFirst({
          where: {
            OR: [email ? { email } : {}, phone ? { phone } : {}],
          },
          include: {
            student: true,
            guardian: true,
          },
        });

        if (!user || !user.password) {
          // Record failed attempt
          await recordLoginAttempt({ email: loginEmail, success: false });
          return null;
        }

        // Proveri lozinku
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          // Record failed attempt
          const lockResult = await recordLoginAttempt({
            email: loginEmail,
            success: false,
          });

          if (lockResult.locked) {
            throw new Error(lockResult.message || "Account locked");
          }

          return null;
        }

        // Successful login - clear failed attempts
        await recordLoginAttempt({ email: loginEmail, success: true });

        return {
          id: user.id,
          ...(user.email && { email: user.email }),
          role: user.role,
          locale: user.locale,
          theme: user.theme,
          emailVerified: user.emailVerified,
          ...(user.student && {
            student: {
              id: user.student.id,
              name: user.student.name,
              school: user.student.school,
              grade: user.student.grade,
              class: user.student.class,
              parentalConsentGiven: user.student.parentalConsentGiven,
              accountActive: user.student.accountActive,
            },
          }),
          ...(user.guardian && {
            guardian: {
              id: user.guardian.id,
              name: user.guardian.name,
            },
          }),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign in - store user data in token
        token.id = user.id;
        if (user.email !== undefined) token.email = user.email;
        token.role = user.role;
        token.locale = user.locale;
        token.theme = user.theme;
        if (user.emailVerified !== undefined) token.emailVerified = user.emailVerified;
        if (user.student !== undefined) token.student = user.student;
        if (user.guardian !== undefined) token.guardian = user.guardian;

        // Create session in database on login
        if (trigger === "signIn" && user.id) {
          try {
            const session = await createSession(user.id);
            token.sessionToken = session.sessionToken;
          } catch (error) {
            console.error("Failed to create session:", error);
            // Continue login even if session creation fails
          }
        }
      }

      // Validate session on every request (if sessionToken exists)
      // Uses Redis cache for performance - reduces DB load by ~90%
      if (token.sessionToken && trigger !== "signIn") {
        const sessionValid = await validateSessionCached(
          token.sessionToken as string,
        );

        if (!sessionValid.valid) {
          // Session invalidated - force logout
          throw new Error("Session invalidated");
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.email) {
          session.user.email = token.email as string;
        }
        session.user.role = token.role as string;
        session.user.locale = token.locale as string;
        session.user.theme = token.theme as string;
        session.user.emailVerified = token.emailVerified ?? null;
        session.user.student = token.student as any;
        session.user.guardian = token.guardian as any;
      }
      return session;
    },
  },
});
