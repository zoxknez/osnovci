/**
 * Admin Moderation Page
 * Main page for viewing and managing content moderation
 */

import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import AdminModerationDashboard from "@/components/admin/moderation-dashboard";

export default async function AdminModerationPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/prijava");
  }

  // Check admin role
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminModerationDashboard />;
}
