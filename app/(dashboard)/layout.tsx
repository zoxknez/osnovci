// Dashboard Route Group Layout - Server Component with Auth Protection
// This layout wraps ALL dashboard routes and ensures authentication

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { InactivityMonitor } from "@/components/features/inactivity-monitor-wrapper";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // ✅ Authenticated and verified - render dashboard with inactivity monitor
  return (
    <>
      <InactivityMonitor />
      {children}
    </>
  );
}
