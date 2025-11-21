import Link from "next/link";
import { X, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNavItems } from "./sidebar-nav-items";

interface MobileSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pathname: string;
}

export function MobileSidebar({ sidebarOpen, setSidebarOpen, pathname }: MobileSidebarProps) {
  return (
    <>
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
          <SidebarNavItems 
            pathname={pathname} 
            onItemClick={() => setSidebarOpen(false)} 
            variant="mobile"
          />

          <div className="mt-auto pt-4 border-t border-gray-200">
            <Link
              href="/dashboard/podesavanja"
              onClick={() => setSidebarOpen(false)}
              aria-label="Idi na podešavanja"
              className="group flex items-center gap-x-3 rounded-xl px-4 py-4 text-base font-medium text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
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
              className="w-full group flex items-center gap-x-3 rounded-xl px-4 py-4 text-base font-medium text-red-600 hover:bg-red-50 active:scale-95 transition-all mt-1 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <LogOut className="h-6 w-6" aria-hidden="true" />
              <span>Odjavi se</span>
            </button>
          </div>

          {/* Brand Section na dnu menija - Sat, Osnovci, Datum */}
          <div className="mt-auto pt-8 border-t border-gray-200"></div>
        </nav>
      </div>
    </>
  );
}
