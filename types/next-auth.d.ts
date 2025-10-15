// Extended NextAuth types
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    locale: string;
    theme: string;
    student?: any;
    guardian?: any;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    locale: string;
    theme: string;
    student?: any;
    guardian?: any;
  }
}
