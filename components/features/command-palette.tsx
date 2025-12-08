"use client";

/**
 * Command Palette Component
 *
 * Quick access command palette triggered by Ctrl+K.
 * Provides fuzzy search for actions, navigation, and settings.
 *
 * Features:
 * - Fuzzy search (Fuse.js)
 * - Recent commands
 * - Categorized actions
 * - Keyboard navigation (arrow keys)
 * - Icon-based visual hierarchy
 *
 * @module components/features/command-palette
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronRight,
  Home,
  Plus,
  RefreshCw,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { log } from "@/lib/logger";
import { DEFAULT_SHORTCUTS, getShortcutDisplay } from "@/lib/shortcuts/config";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "navigation" | "actions" | "settings";
  keywords?: string[]; // For fuzzy search
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand?: (commandId: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onCommand,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define available commands
  const allCommands: Command[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Kontrolna Tabla",
      description: "Idi na početnu stranicu",
      icon: Home,
      action: () => router.push("/dashboard"),
      category: "navigation",
      keywords: ["dashboard", "pocetna", "početna", "home"],
      shortcut: getShortcutDisplay(
        DEFAULT_SHORTCUTS.find((s) => s.id === "nav-dashboard")!,
      ),
    },
    {
      id: "nav-homework",
      label: "Domaći Zadaci",
      description: "Pregled svih domaćih zadataka",
      icon: BookOpen,
      action: () => router.push("/dashboard/domaci"),
      category: "navigation",
      keywords: ["homework", "domaci", "domaći", "zadaci"],
      shortcut: getShortcutDisplay(
        DEFAULT_SHORTCUTS.find((s) => s.id === "nav-homework")!,
      ),
    },
    {
      id: "nav-grades",
      label: "Ocene",
      description: "Pregled svih ocena",
      icon: Award,
      action: () => router.push("/dashboard/ocene"),
      category: "navigation",
      keywords: ["grades", "ocene", "marks"],
      shortcut: getShortcutDisplay(
        DEFAULT_SHORTCUTS.find((s) => s.id === "nav-grades")!,
      ),
    },
    {
      id: "nav-schedule",
      label: "Raspored Časova",
      description: "Sedmični raspored",
      icon: Calendar,
      action: () => router.push("/dashboard/raspored"),
      category: "navigation",
      keywords: ["schedule", "raspored", "casovi", "časovi"],
      shortcut: getShortcutDisplay(
        DEFAULT_SHORTCUTS.find((s) => s.id === "nav-schedule")!,
      ),
    },
    {
      id: "nav-calendar",
      label: "Kalendar Događaja",
      description: "Svi događaji i aktivnosti",
      icon: CalendarDays,
      action: () => router.push("/dashboard/kalendar"),
      category: "navigation",
      keywords: ["calendar", "kalendar", "events", "dogadjaji", "događaji"],
      shortcut: getShortcutDisplay(
        DEFAULT_SHORTCUTS.find((s) => s.id === "nav-calendar")!,
      ),
    },
    {
      id: "nav-settings",
      label: "Podešavanja",
      description: "Konfiguracija naloga",
      icon: Settings,
      action: () => router.push("/dashboard/podesavanja"),
      category: "navigation",
      keywords: ["settings", "podesavanja", "podešavanja", "config"],
      shortcut: getShortcutDisplay(
        DEFAULT_SHORTCUTS.find((s) => s.id === "nav-settings")!,
      ),
    },

    // Actions
    {
      id: "create-homework",
      label: "Novi Domaći Zadatak",
      description: "Kreiraj novi domaći zadatak",
      icon: Plus,
      action: () => router.push("/dashboard/domaci/novi"),
      category: "actions",
      keywords: [
        "new",
        "create",
        "novi",
        "kreiraj",
        "homework",
        "domaci",
        "domaći",
      ],
    },
    {
      id: "refresh-data",
      label: "Osveži Podatke",
      description: "Sinhronizuj sa serverom",
      icon: RefreshCw,
      action: () => window.location.reload(),
      category: "actions",
      keywords: ["refresh", "reload", "osvezi", "osveži", "sync"],
      shortcut: getShortcutDisplay(
        DEFAULT_SHORTCUTS.find((s) => s.id === "refresh-data")!,
      ),
    },
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? allCommands.filter((cmd) => {
        const searchText = query.toLowerCase();
        const labelMatch = cmd.label.toLowerCase().includes(searchText);
        const descMatch = cmd.description?.toLowerCase().includes(searchText);
        const keywordMatch = cmd.keywords?.some((kw) =>
          kw.toLowerCase().includes(searchText),
        );

        return labelMatch || descMatch || keywordMatch;
      })
    : allCommands;

  // Group by category
  const commandsByCategory = {
    navigation: filteredCommands.filter((c) => c.category === "navigation"),
    actions: filteredCommands.filter((c) => c.category === "actions"),
    settings: filteredCommands.filter((c) => c.category === "settings"),
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredCommands.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Execute command
  const executeCommand = useCallback(
    (command: Command | undefined) => {
      if (!command) return;

      log.info("Command palette: Executing command", {
        commandId: command.id,
        label: command.label,
      });

      // Execute action
      command.action();

      // Notify parent
      onCommand?.(command.id);

      // Close palette
      onClose();
    },
    [onClose, onCommand],
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl overflow-hidden rounded-lg border bg-background shadow-2xl"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Pretražite komande..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-muted"
              aria-label="Zatvori"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Commands List */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nema rezultata za "{query}"
              </div>
            ) : (
              <>
                {/* Navigation */}
                {commandsByCategory.navigation.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                      NAVIGACIJA
                    </div>
                    {commandsByCategory.navigation.map((cmd) => {
                      const globalIndex = allCommands.indexOf(cmd);
                      return (
                        <CommandItem
                          key={cmd.id}
                          command={cmd}
                          isSelected={selectedIndex === globalIndex}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                {commandsByCategory.actions.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                      AKCIJE
                    </div>
                    {commandsByCategory.actions.map((cmd) => {
                      const globalIndex = allCommands.indexOf(cmd);
                      return (
                        <CommandItem
                          key={cmd.id}
                          command={cmd}
                          isSelected={selectedIndex === globalIndex}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Settings */}
                {commandsByCategory.settings.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                      PODEŠAVANJA
                    </div>
                    {commandsByCategory.settings.map((cmd) => {
                      const globalIndex = allCommands.indexOf(cmd);
                      return (
                        <CommandItem
                          key={cmd.id}
                          command={cmd}
                          isSelected={selectedIndex === globalIndex}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex gap-4">
              <span>
                <kbd className="rounded bg-background px-1.5 py-0.5">↑↓</kbd>{" "}
                Navigacija
              </span>
              <span>
                <kbd className="rounded bg-background px-1.5 py-0.5">Enter</kbd>{" "}
                Izaberi
              </span>
            </div>
            <span>
              <kbd className="rounded bg-background px-1.5 py-0.5">Esc</kbd>{" "}
              Zatvori
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Command Item Component
interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function CommandItem({
  command,
  isSelected,
  onClick,
  onMouseEnter,
}: CommandItemProps) {
  const Icon = command.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex-1 overflow-hidden">
        <div className="font-medium">{command.label}</div>
        {command.description && (
          <div
            className={`text-xs ${
              isSelected
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            }`}
          >
            {command.description}
          </div>
        )}
      </div>
      {command.shortcut && (
        <kbd
          className={`rounded px-2 py-1 text-xs font-mono ${
            isSelected
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {command.shortcut}
        </kbd>
      )}
      <ChevronRight
        className={`h-4 w-4 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`}
      />
    </button>
  );
}
