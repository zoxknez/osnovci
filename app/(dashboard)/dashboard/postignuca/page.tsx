"use client";

import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { redirect } from "next/navigation";

// Lazy load Achievements Dashboard - heavy gamification component
const AchievementsDashboard = lazy(() => 
  import("@/components/gamification/achievements-dashboard").then((mod) => ({ 
    default: mod.default 
  }))
);

export default function AchievementsPage() {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user?.id) {
    redirect("/prijava");
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <AchievementsDashboard />
    </Suspense>
  );
}
