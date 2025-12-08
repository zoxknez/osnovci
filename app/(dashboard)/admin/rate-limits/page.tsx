/**
 * Admin Rate Limit Monitoring Page
 * Route: /admin/rate-limits
 */

import { redirect } from "next/navigation";
import RateLimitDashboard from "@/components/admin/rate-limit-dashboard";
import { auth } from "@/lib/auth/config";

export default async function AdminRateLimitsPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/prijava");
  }

  // Check admin role
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <RateLimitDashboard />;
}
