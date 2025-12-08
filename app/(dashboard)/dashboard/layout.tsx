// Dashboard Layout - child-friendly sidebar navigation
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DesktopSidebar } from "@/components/features/dashboard/layout/desktop-sidebar";
import { MobileHeader } from "@/components/features/dashboard/layout/mobile-header";
import { MobileSidebar } from "@/components/features/dashboard/layout/mobile-sidebar";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: profileData } = useProfile();
  const xp = profileData?.profile?.xp || 0;
  const level = profileData?.profile?.level || 1;

  useEffect(() => {
    if (sidebarOpen) {
      document.documentElement.classList.add("overflow-hidden");
      document.body.classList.add("overflow-hidden");
    } else {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("overflow-hidden");
    }
  }, [sidebarOpen]);

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30",
        sidebarOpen && "overflow-hidden",
      )}
    >
      <MobileHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        pathname={pathname}
        level={level}
        xp={xp}
      />

      <MobileSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        pathname={pathname}
      />

      <DesktopSidebar pathname={pathname} level={level} xp={xp} />

      {/* Main content */}
      <div className="lg:pl-72">
        <div
          tabIndex={-1}
          className="min-h-screen py-4 px-3 sm:py-8 sm:px-6 lg:px-8 lg:py-10 focus:outline-none"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
