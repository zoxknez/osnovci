"use client";

/**
 * Global Shortcuts Provider
 *
 * Wraps the application with global keyboard shortcut handlers.
 * Manages command palette and shortcuts help overlay.
 *
 * Features:
 * - Global Ctrl+K for command palette
 * - Global Shift+? for shortcuts help
 * - Navigation shortcuts (Ctrl+1-6)
 * - Action shortcuts
 * - Accessibility announcements
 *
 * @module components/providers/shortcuts-provider
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CommandPalette } from "@/components/features/command-palette";
import { ShortcutsHelp } from "@/components/features/shortcuts-help";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { log } from "@/lib/logger";
import { DEFAULT_SHORTCUTS } from "@/lib/shortcuts/config";

interface ShortcutsProviderProps {
  children: React.ReactNode;
}

export function ShortcutsProvider({ children }: ShortcutsProviderProps) {
  const router = useRouter();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Command palette handlers
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
    log.info("Command palette opened");
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  // Shortcuts help handlers
  const openShortcutsHelp = useCallback(() => {
    setIsShortcutsHelpOpen(true);
    log.info("Shortcuts help opened");
  }, []);

  const closeShortcutsHelp = useCallback(() => {
    setIsShortcutsHelpOpen(false);
  }, []);

  // Navigation handlers
  const navigateTo = useCallback(
    (path: string, label: string) => {
      router.push(path);
      toast.success(`Navigacija: ${label}`);
    },
    [router],
  );

  // Refresh handler
  const refreshData = useCallback(() => {
    window.location.reload();
    toast.info("Osvežavanje podataka...");
  }, []);

  // Register global shortcuts
  useKeyboardShortcuts(
    [
      // Command Palette (Ctrl+K)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "command-palette")!,
        handler: openCommandPalette,
        preventDefault: true,
      },

      // Shortcuts Help (Shift+?)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "show-shortcuts")!,
        handler: openShortcutsHelp,
        preventDefault: true,
      },

      // Navigation: Dashboard (Ctrl+1)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "nav-dashboard")!,
        handler: () => navigateTo("/dashboard", "Kontrolna Tabla"),
        preventDefault: true,
      },

      // Navigation: Homework (Ctrl+2)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "nav-homework")!,
        handler: () => navigateTo("/dashboard/domaci", "Domaći Zadaci"),
        preventDefault: true,
      },

      // Navigation: Grades (Ctrl+3)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "nav-grades")!,
        handler: () => navigateTo("/dashboard/ocene", "Ocene"),
        preventDefault: true,
      },

      // Navigation: Schedule (Ctrl+4)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "nav-schedule")!,
        handler: () => navigateTo("/dashboard/raspored", "Raspored"),
        preventDefault: true,
      },

      // Navigation: Calendar (Ctrl+5)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "nav-calendar")!,
        handler: () => navigateTo("/dashboard/kalendar", "Kalendar"),
        preventDefault: true,
      },

      // Navigation: Settings (Ctrl+6)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "nav-settings")!,
        handler: () => navigateTo("/dashboard/podesavanja", "Podešavanja"),
        preventDefault: true,
      },

      // Action: Refresh (Ctrl+R)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "refresh-data")!,
        handler: refreshData,
        preventDefault: true,
      },

      // Action: Focus Search (/)
      {
        shortcut: DEFAULT_SHORTCUTS.find((s) => s.id === "focus-search")!,
        handler: (e) => {
          // Find search input and focus it
          const searchInput = document.querySelector(
            'input[type="search"], input[placeholder*="pretraga" i], input[placeholder*="search" i]',
          ) as HTMLInputElement;

          if (searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
            toast.info("Fokus na pretragu");
          }
        },
        preventDefault: false, // Only prevent if search input found
      },
    ],
    {
      scope: "global",
      disableInInputs: true,
      enableLogging: true,
    },
  );

  return (
    <>
      {children}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        onCommand={(commandId) => {
          log.info("Command executed", { commandId });
        }}
      />

      {/* Shortcuts Help */}
      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={closeShortcutsHelp}
      />
    </>
  );
}
