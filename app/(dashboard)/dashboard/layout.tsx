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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Mobile header - Enhanced & optimized for small screens */}
      <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-lg px-3 sm:px-4 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Otvori navigacioni meni"
          aria-expanded={sidebarOpen}
          aria-controls="mobile-sidebar"
          className="relative p-2 sm:p-3 text-gray-700 hover:bg-blue-50 rounded-2xl sm:rounded-3xl transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none active:scale-95 touch-manipulation flex-shrink-0 group"
        >
          {/* Hamburger sa lepšim vizuelom */}
          <div className="flex flex-col gap-1.5 sm:gap-2 w-6 sm:w-7 h-6 sm:h-7 justify-center">
            <span className="block h-0.75 sm:h-1 w-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all group-hover:shadow-md"></span>
            <span className="block h-0.75 sm:h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all group-hover:shadow-md"></span>
            <span className="block h-0.75 sm:h-1 w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all group-hover:shadow-md"></span>
          </div>
          {/* Badge indicator - animirano */}
          <span className="absolute top-0 right-0 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
          </span>
          <span className="sr-only">Meni</span>
        </button>

        {/* Centered Logo */}
        <h1 className="flex-1 text-center text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Osnovci
        </h1>

        {/* Spacer for balance */}
        <div className="w-10 sm:w-12"></div>
      </header>

      {/* Mobile Tab Bar - Colorful tabs with emojis and gradients - ONLY 3 MAIN TABS */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm lg:hidden">
        <div className="grid grid-cols-3">
          {navigation.slice(0, 3).map((item) => {
            const isActive = pathname === item.href;
            const tabColors: Record<string, { bg: string; text: string; icon: string }> = {
              "/dashboard": { bg: "from-blue-500 to-blue-600", text: "text-blue-600", icon: "🏠" },
              "/dashboard/domaci": { bg: "from-amber-500 to-orange-600", text: "text-amber-600", icon: "📚" },
              "/dashboard/raspored": { bg: "from-purple-500 to-purple-600", text: "text-purple-600", icon: "📅" },
            };
            const colors = tabColors[item.href] || { bg: "from-gray-500 to-gray-600", text: "text-gray-600", icon: "📌" };
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-2 py-3 transition-all touch-manipulation border-b-2",
                  isActive
                    ? `bg-gradient-to-r ${colors.bg} text-white border-b-4 shadow-md`
                    : "text-gray-600 border-b-2 border-transparent hover:bg-gray-50"
                )}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm font-semibold truncate">{item.name}</span>
              </Link>
            );
          })}
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
