// Dashboard Layout - child-friendly sidebar navigation
"use client";

import {
  BarChart3,
  BookOpen,
  Calendar,
  Home,
  LogOut,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

const navigation = [
  { name: "Danas", href: "/dashboard", icon: Home, emoji: "🏠" },
  { name: "Domaći", href: "/dashboard/domaci", icon: BookOpen, emoji: "📚" },
  {
    name: "Raspored",
    href: "/dashboard/raspored",
    icon: Calendar,
    emoji: "📅",
  },
  { name: "Ocene", href: "/dashboard/ocene", icon: BarChart3, emoji: "📊" },
  {
    name: "Porodica",
    href: "/dashboard/porodica",
    icon: Users,
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    name: "Profil",
    href: "/dashboard/profil",
    icon: Users,
    emoji: "👤",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Inovativna formatiranja za decu
  const dayOfWeek = currentDate.toLocaleDateString("sr-Latn-RS", { weekday: "short" }).toUpperCase();
  const dayNum = currentDate.getDate();
  const month = currentDate.toLocaleDateString("sr-Latn-RS", { month: "short" }).toUpperCase();
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  
  // Emoji za vreme
  const getTimeEmoji = () => {
    const hour = currentDate.getHours();
    if (hour >= 6 && hour < 12) return "🌅";
    if (hour >= 12 && hour < 17) return "☀️";
    if (hour >= 17 && hour < 21) return "🌆";
    return "🌙";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Mobile header - Enhanced & optimized for small screens */}
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
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <span className="block h-0.5 sm:h-0.75 w-4 sm:w-5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all group-hover:scale-110 group-hover:shadow-md"></span>
              <span className="block h-0.5 sm:h-0.75 w-4 sm:w-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all group-hover:scale-110 group-hover:shadow-md"></span>
              <span className="block h-0.5 sm:h-0.75 w-4 sm:w-5 bg-gradient-to-r from-pink-500 to-blue-600 rounded-full transition-all group-hover:scale-110 group-hover:shadow-md"></span>
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
              "/dashboard": { bg: "from-blue-500 to-blue-600", text: "text-blue-600" },
              "/dashboard/domaci": { bg: "from-amber-500 to-orange-600", text: "text-amber-600" },
              "/dashboard/raspored": { bg: "from-purple-500 to-purple-600", text: "text-purple-600" },
            };
            const colors = tabColors[item.href] || { bg: "from-gray-500 to-gray-600", text: "text-gray-600" };

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all touch-manipulation flex-1 sm:flex-none",
                  isActive
                    ? `bg-gradient-to-r ${colors.bg} text-white shadow-md font-semibold`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                )}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-base">{item.emoji}</span>
                <span className="text-xs sm:text-sm font-semibold truncate hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Osnovci Brand Bar - NOVI - sa satom i logoom */}
      <div className="sticky top-[calc(3.5rem+56px)] sm:top-[calc(4rem+56px)] z-25 bg-gradient-to-r from-white via-blue-50 to-white border-b border-gray-100 shadow-sm lg:hidden px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 border border-blue-200/40">
          {/* Sat */}
          <div className="flex items-baseline gap-1">
            <span className="text-xl">{getTimeEmoji()}</span>
            <span className="text-lg font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-mono">{hours}:{minutes}</span>
          </div>
          
          {/* Separator */}
          <div className="h-6 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300 rounded-full opacity-40"></div>
          
          {/* Logo i datum */}
          <div className="flex flex-col items-center">
            <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent leading-tight">
              Osnovci
            </h1>
            <p className="text-xs text-gray-500 font-medium">{dayOfWeek} {dayNum}.{month}</p>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          aria-label="Zatvori meni"
        />
      )}

      {/* Mobile sidebar */}
      <div
        id="mobile-sidebar"
        role="dialog"
        aria-label="Navigacioni meni"
        aria-modal="false"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-gradient-to-b from-blue-50/50 to-white/90 backdrop-blur-sm shadow-xl transition-transform duration-300 ease-in-out lg:hidden border-r border-gray-100",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Osnovci
          </h1>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Zatvori navigacioni meni"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Zatvori</span>
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col p-4"
          aria-label="Glavna navigacija"
        >
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100 active:scale-95",
                    )}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-4 border-t border-gray-200">
            <Link
              href="/dashboard/podesavanja"
              onClick={() => setSidebarOpen(false)}
              aria-label="Idi na podešavanja"
              className="group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
              <span>Podešavanja</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                /* Logout logic */
              }}
              aria-label="Odjavi se sa naloga"
              className="w-full group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 active:scale-95 transition-all mt-1 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span>Odjavi se</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-100 bg-gradient-to-b from-blue-50/50 to-white px-6 pb-4 backdrop-blur-sm">
          <div className="flex h-16 items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Osnovci
            </h1>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 active:scale-95",
                      )}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/podesavanja"
                aria-label="Idi na podešavanja"
                className="group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
                <span>Podešavanja</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  /* Logout logic */
                }}
                aria-label="Odjavi se sa naloga"
                className="w-full group flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 active:scale-95 transition-all mt-1 focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span>Odjavi se</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

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
