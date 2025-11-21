import Link from "next/link";
import { Trophy, Settings, LogOut } from "lucide-react";
import { SidebarNavItems } from "./sidebar-nav-items";

interface DesktopSidebarProps {
  pathname: string;
  level: number;
  xp: number;
}

export function DesktopSidebar({ pathname, level, xp }: DesktopSidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-100 bg-gradient-to-b from-blue-50/50 to-white px-6 pb-4 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Osnovci
            </h1>
          </div>

          {/* Desktop XP Widget */}
          <div className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-100">Tvoj Level</p>
                  <p className="text-xl font-bold">{level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-indigo-100">Ukupno XP</p>
                <p className="text-lg font-bold">{xp}</p>
              </div>
            </div>
            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden relative">
              <div 
                className="bg-yellow-400 h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${(xp % 1000) / 10}%` }} 
              >
                <div className="absolute inset-0 animate-shine" />
              </div>
            </div>
            <p className="text-[10px] text-center mt-1 text-indigo-100">
              {1000 - (xp % 1000)} XP do sledećeg levela
            </p>
          </div>

          <nav className="flex flex-1 flex-col mt-4">
            <SidebarNavItems pathname={pathname} variant="desktop" />

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
  );
}
