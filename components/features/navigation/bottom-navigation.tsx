/**
 * Bottom Navigation - Mobilna Navigacija za Učenike
 *
 * Optimizovana navigacija za mobilne uređaje:
 * - Pristupačna (WCAG 2.1 AAA)
 * - Haptic feedback
 * - Aktivni indikatori
 * - Notifikacija badge
 */

"use client";

import {
  Bell,
  BookOpen,
  Calendar,
  Home,
  Plus,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface BottomNavigationProps {
  unreadNotifications?: number;
  className?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Početna", icon: Home },
  { href: "/dashboard/domaci", label: "Domaći", icon: BookOpen },
  { href: "/dashboard/raspored", label: "Raspored", icon: Calendar },
  { href: "/dashboard/postignuca", label: "Postignuća", icon: Trophy },
  { href: "/dashboard/profil", label: "Profil", icon: User },
];

// Haptic feedback (ako je dostupno)
function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function BottomNavigation({
  unreadNotifications = 0,
  className,
}: BottomNavigationProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      // Only react to significant scrolls
      if (scrollDelta > 10) {
        setIsVisible(!scrollingDown || currentScrollY < 100);
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Check if current path matches nav item
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Safe area spacer */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      {/* Navigation bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg",
          "border-t border-gray-200 dark:border-gray-800",
          "pb-safe transition-transform duration-300",
          !isVisible && "translate-y-full",
          className,
        )}
        role="navigation"
        aria-label="Glavna navigacija"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const showBadge =
              item.href === "/dashboard/profil" && unreadNotifications > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center",
                  "w-16 h-14 rounded-xl transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                )}
                onClick={() => triggerHaptic()}
                aria-current={active ? "page" : undefined}
              >
                {/* Active indicator */}
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                    aria-hidden="true"
                  />
                )}

                {/* Icon container */}
                <span
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                    active && "bg-blue-50 dark:bg-blue-900/30",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform",
                      active && "scale-110",
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />

                  {/* Notification badge */}
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full"
                      aria-label={`${unreadNotifications} nepročitanih obavještenja`}
                    >
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium mt-0.5 transition-colors",
                    active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button for new homework */}
      <button
        type="button"
        className={cn(
          "fixed right-4 z-50 md:hidden",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-r from-blue-600 to-indigo-600",
          "text-white shadow-lg shadow-blue-500/30",
          "flex items-center justify-center",
          "hover:shadow-xl hover:shadow-blue-500/40 active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "transition-all duration-300",
          isVisible ? "bottom-24" : "bottom-6",
        )}
        aria-label="Dodaj novi domaći zadatak"
        onClick={() => {
          triggerHaptic();
          // Navigate to add homework page
          window.location.href = "/dashboard/domaci/novi";
        }}
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}

/**
 * Desktop Sidebar Navigation
 */
export function SidebarNavigation({
  unreadNotifications = 0,
  className,
}: BottomNavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:w-64 lg:w-72",
        "fixed left-0 top-0 bottom-0 z-40",
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
        className,
      )}
      role="navigation"
      aria-label="Glavna navigacija"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl">
          📚
        </div>
        <span className="font-bold text-xl text-gray-800 dark:text-white">
          Osnovci
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const showBadge =
            item.href === "/dashboard/profil" && unreadNotifications > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                active
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />

                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>

              <span className={cn("font-medium", active && "font-semibold")}>
                {item.label}
              </span>

              {showBadge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-bold text-red-600 bg-red-100 rounded-full">
                  {unreadNotifications}
                </span>
              )}

              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
        <Link
          href="/dashboard/domaci/novi"
          className={cn(
            "flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl",
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
            "hover:shadow-lg hover:shadow-blue-500/30 transition-all",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Novi domaći</span>
        </Link>
      </div>

      {/* Notifications Bell */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          className={cn(
            "relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all",
            "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          <Bell className="w-5 h-5" />
          <span className="font-medium">Obavještenja</span>

          {unreadNotifications > 0 && (
            <span className="ml-auto px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
