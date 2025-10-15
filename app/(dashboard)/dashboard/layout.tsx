// Dashboard Layout - child-friendly sidebar navigation
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Calendar,
  BarChart3,
  Users,
  Settings,
  X,
  LogOut,
} from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header - Enhanced */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 shadow-sm lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Otvori navigacioni meni"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
            className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none active:scale-95 touch-manipulation"
          >
            {/* Hamburger sa boljom vidljivošću */}
            <div className="flex flex-col gap-1.5 w-6 h-6 justify-center">
              <span className="block h-0.5 w-full bg-gray-800 rounded-full"></span>
              <span className="block h-0.5 w-full bg-gray-800 rounded-full"></span>
              <span className="block h-0.5 w-full bg-gray-800 rounded-full"></span>
            </div>
            <span className="sr-only">Meni</span>
          </button>

          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Osnovci
          </h1>
        </div>

        {/* Quick Actions - Mobile shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/domaci"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all active:scale-95 touch-manipulation"
            aria-label="Domaći zadaci"
          >
            <BookOpen className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard/raspored"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all active:scale-95 touch-manipulation"
            aria-label="Raspored časova"
          >
            <Calendar className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard/ocene"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all active:scale-95 touch-manipulation"
            aria-label="Ocene"
          >
            <BarChart3 className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
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
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
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
        <main
          id="main-content"
          tabIndex={-1}
          className="py-8 px-4 sm:px-6 lg:px-8 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
