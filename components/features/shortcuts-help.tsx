"use client";

/**
 * Keyboard Shortcuts Help Overlay
 *
 * Modal displaying all available keyboard shortcuts.
 * Triggered by Shift + ? key.
 *
 * Features:
 * - Categorized shortcuts
 * - Visual shortcut badges
 * - Search filter
 * - Customization link
 *
 * @module components/features/shortcuts-help
 */

import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, Search, X } from "lucide-react";
import { useState } from "react";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  DEFAULT_SHORTCUTS,
  getShortcutDisplay,
  getShortcutsByCategory,
  type ShortcutCategory,
} from "@/lib/shortcuts/config";

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter shortcuts
  const filteredShortcuts = searchQuery
    ? DEFAULT_SHORTCUTS.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getShortcutDisplay(s)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : DEFAULT_SHORTCUTS;

  // Group by category
  const categorized = getShortcutsByCategory(filteredShortcuts);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl overflow-hidden rounded-lg border bg-background shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Keyboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Prečice sa Tastature</h2>
                <p className="text-sm text-muted-foreground">
                  Sve dostupne prečice za brži rad
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-muted"
              aria-label="Zatvori"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pretražite prečice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
            {filteredShortcuts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nema rezultata za "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-8">
                {/* Command Shortcuts */}
                {categorized.command.length > 0 && (
                  <CategorySection
                    category="command"
                    shortcuts={categorized.command}
                  />
                )}

                {/* Navigation Shortcuts */}
                {categorized.navigation.length > 0 && (
                  <CategorySection
                    category="navigation"
                    shortcuts={categorized.navigation}
                  />
                )}

                {/* Action Shortcuts */}
                {categorized.actions.length > 0 && (
                  <CategorySection
                    category="actions"
                    shortcuts={categorized.actions}
                  />
                )}

                {/* Search Shortcuts */}
                {categorized.search.length > 0 && (
                  <CategorySection
                    category="search"
                    shortcuts={categorized.search}
                  />
                )}

                {/* Modal Shortcuts */}
                {categorized.modal.length > 0 && (
                  <CategorySection
                    category="modal"
                    shortcuts={categorized.modal}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Pritisnite{" "}
              <kbd className="rounded bg-background px-2 py-1 text-xs font-mono">
                Shift + ?
              </kbd>{" "}
              da otvorite ovu listu
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Zatvori
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Category Section Component
interface CategorySectionProps {
  category: ShortcutCategory;
  shortcuts: typeof DEFAULT_SHORTCUTS;
}

function CategorySection({ category, shortcuts }: CategorySectionProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h3>
        <p className="text-sm text-muted-foreground">
          {CATEGORY_DESCRIPTIONS[category]}
        </p>
      </div>

      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/50"
          >
            <div className="flex-1">
              <div className="font-medium">{shortcut.label}</div>
              <div className="text-sm text-muted-foreground">
                {shortcut.description}
              </div>
            </div>

            <kbd className="ml-4 rounded-lg border bg-muted px-3 py-2 text-sm font-mono font-semibold">
              {getShortcutDisplay(shortcut)}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
