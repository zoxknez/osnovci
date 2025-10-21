// Dashboard Route Group Layout - Server Component with Auth Protection
// This layout wraps ALL dashboard routes and ensures authentication

import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🎮 DEMO MODE - Skip auth checks
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "development";
  
  if (isDemoMode) {
    // Demo mode - skip all auth checks and render directly
    return <>{children}</>;
  }

  // 🔒 AUTH PROTECTION - Check if user is authenticated
  const session = await auth();

  if (!session?.user?.id) {
    // Not authenticated - redirect to login
    redirect("/prijava?callbackUrl=/dashboard");
  }

  // 🔒 COPPA COMPLIANCE - Check parental consent for students
  if (session.user.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
      select: {
        parentalConsentGiven: true,
        accountActive: true,
      },
    });

    if (!student) {
      // Student record not found - shouldn't happen, but handle gracefully
      redirect("/prijava?error=no-student-record");
    }

    if (!student.accountActive) {
      // Account is not active
      redirect("/account-inactive");
    }

    if (!student.parentalConsentGiven) {
      // No parental consent - redirect to consent flow
      redirect("/consent-required");
    }
  }

  // ✅ Authenticated and verified - render dashboard
  return <>{children}</>;
}
