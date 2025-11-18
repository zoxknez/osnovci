import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import AchievementsDashboard from "@/components/gamification/achievements-dashboard";

export default async function AchievementsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <AchievementsDashboard />;
}
