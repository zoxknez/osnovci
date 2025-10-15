// NextAuth.js v5 configuration
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z
  .object({
    email: z.string().email().optional(),
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
        console.log("🔐 Authorize called with:", credentials);
        
        const validated = loginSchema.safeParse(credentials);

        if (!validated.success) {
          console.error("❌ Validation failed:", validated.error.flatten());
          return null;
        }

        console.log("✅ Validation passed:", validated.data);
        const { email, phone, password } = validated.data;

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
          return null;
        }

        // Proveri lozinku
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

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
