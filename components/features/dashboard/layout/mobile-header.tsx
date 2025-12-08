import { Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { navigation } from "./navigation-config";

interface MobileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pathname: string;
  level: number;
  xp: number;
}

export function MobileHeader({
  sidebarOpen,
  setSidebarOpen,
  pathname,
  level,
  xp,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-auto sm:h-16 items-center justify-start gap-2 sm:gap-3 border-b border-gray-100 bg-gradient-to-r from-white via-blue-50/30 to-white backdrop-blur-lg px-2 sm:px-4 py-3 sm:py-0 shadow-md lg:hidden flex-wrap sm:flex-nowrap">
      {/* Left: Menu Button with animated icon - UOKVIRENO */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Otvori navigacioni meni"
        aria-expanded={sidebarOpen}
        aria-controls="mobile-sidebar"
        className="relative flex-shrink-0 group p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300"
      >
        {/* Animated Menu Icon - dinamičan za decu */}
        <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
          {/* Outer spinning circle */}
          <div className="absolute inset-0 rounded-full border-1.5 border-transparent border-t-blue-500 border-r-purple-500 group-hover:animate-spin"></div>

          {/* Inner animated hamburger */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <span className="block h-0.75 sm:h-1 w-5 sm:w-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all group-hover:scale-110 group-hover:shadow-md"></span>
            <span className="block h-0.75 sm:h-1 w-5 sm:w-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all group-hover:scale-110 group-hover:shadow-md"></span>
            <span className="block h-0.75 sm:h-1 w-5 sm:w-6 bg-gradient-to-r from-pink-500 to-blue-600 rounded-full transition-all group-hover:scale-110 group-hover:shadow-md"></span>
          </div>

          {/* Pulsing orb indicator */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50"></span>
          </span>
        </div>
        <span className="sr-only">Meni</span>
      </button>

      {/* 3 Main Navigation Buttons - Sada u header-u */}
      <div className="flex gap-1.5 sm:gap-2 flex-1">
        {navigation.slice(0, 3).map((item) => {
          const isActive = pathname === item.href;
          const tabColors: Record<string, { bg: string; text: string }> = {
            "/dashboard": {
              bg: "from-blue-500 to-blue-600",
              text: "text-blue-600",
            },
            "/dashboard/domaci": {
              bg: "from-amber-500 to-orange-600",
              text: "text-amber-600",
            },
            "/dashboard/raspored": {
              bg: "from-purple-500 to-purple-600",
              text: "text-purple-600",
            },
          };
          const colors = tabColors[item.href] || {
            bg: "from-gray-500 to-gray-600",
            text: "text-gray-600",
          };

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all touch-manipulation flex-1 sm:flex-none",
                isActive
                  ? `bg-gradient-to-r ${colors.bg} text-white shadow-md font-semibold`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium",
              )}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-3xl sm:text-4xl">{item.emoji}</span>
              <span className="text-xs sm:text-sm font-semibold truncate hidden sm:inline">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Mobile XP Indicator */}
      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200 ml-1">
        <Trophy className="w-4 h-4 text-yellow-600" />
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-bold text-yellow-800">
            LVL {level}
          </span>
          <span className="text-[10px] text-yellow-600">{xp} XP</span>
        </div>
      </div>
    </header>
  );
}
