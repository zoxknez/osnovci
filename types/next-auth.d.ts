// Extended NextAuth types
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string | undefined;
    role: string;
    locale: string;
    theme: string;
    emailVerified?: Date | null;
    student?: {
      id: string;
      name: string;
      school: string;
      grade: number;
      class: string;
      parentalConsentGiven: boolean;
      accountActive: boolean;
    };
    guardian?: {
      id: string;
      name: string;
    };
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    role: string;
    locale: string;
    theme: string;
    emailVerified?: Date | null;
    sessionToken?: string; // Database session token for invalidation
    student?: {
      id: string;
      name: string;
      school: string;
      grade: number;
      class: string;
      parentalConsentGiven: boolean;
      accountActive: boolean;
    };
    guardian?: {
      id: string;
      name: string;
    };
  }
}
