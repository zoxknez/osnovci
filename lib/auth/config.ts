// NextAuth.js v5 configuration

import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { recordLoginAttempt, isAccountLocked } from "@/lib/auth/account-lockout";

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
  secret: process.env.NEXTAUTH_SECRET,
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
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);

        if (!validated.success) {
          return null;
        }

        const { email, phone, password } = validated.data;
        const loginEmail = email || phone || "";

        // Check if account is locked
        const lockStatus = isAccountLocked(loginEmail);
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
          email: user.email,
          role: user.role,
          locale: user.locale,
          theme: user.theme,
          student: user.student,
          guardian: user.guardian,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.locale = user.locale;
        token.theme = user.theme;
        token.student = user.student;
        token.guardian = user.guardian;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.locale = token.locale as string;
        session.user.theme = token.theme as string;
        session.user.student = token.student as any;
        session.user.guardian = token.guardian as any;
      }
      return session;
    },
  },
});
