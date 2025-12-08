/**
 * Keyboard Shortcuts Configuration
 *
 * Centralized keyboard shortcuts for power users.
 * Provides quick navigation, actions, and command palette.
 *
 * Features:
 * - Global shortcuts (Ctrl+K, Esc, /)
 * - Navigation shortcuts (Ctrl+1-6)
 * - Action shortcuts (N for New, S for Save)
 * - Help overlay (? key)
 * - Customizable shortcuts per user
 * - Accessibility announcements
 *
 * @module lib/shortcuts/config
 */

export type ShortcutCategory =
  | "navigation"
  | "actions"
  | "search"
  | "modal"
  | "command";

export interface Shortcut {
  id: string;
  key: string; // e.g., "k", "1", "n"
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean; // Cmd on Mac
  };
  label: string; // Serbian label
  description: string; // What it does
  category: ShortcutCategory;
  action: string; // Action identifier for handlers
  enabled: boolean; // Can be disabled by user
  customizable: boolean; // Can user change this shortcut?
  scope?: "global" | "homework" | "grades" | "schedule"; // Where shortcut is active
}

// ============================================
// Default Shortcuts Configuration
// ============================================

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  // Command Palette
  {
    id: "command-palette",
    key: "k",
    modifiers: { ctrl: true },
    label: "Komandna Paleta",
    description: "Otvori komandnu paletu za brzi pristup funkcijama",
    category: "command",
    action: "OPEN_COMMAND_PALETTE",
    enabled: true,
    customizable: false,
    scope: "global",
  },

  // Navigation
  {
    id: "nav-dashboard",
    key: "1",
    modifiers: { ctrl: true },
    label: "Kontrolna Tabla",
    description: "Idi na početnu stranicu",
    category: "navigation",
    action: "NAVIGATE_DASHBOARD",
    enabled: true,
    customizable: true,
    scope: "global",
  },
  {
    id: "nav-homework",
    key: "2",
    modifiers: { ctrl: true },
    label: "Domaći Zadaci",
    description: "Idi na stranicu domaćih zadataka",
    category: "navigation",
    action: "NAVIGATE_HOMEWORK",
    enabled: true,
    customizable: true,
    scope: "global",
  },
  {
    id: "nav-grades",
    key: "3",
    modifiers: { ctrl: true },
    label: "Ocene",
    description: "Idi na stranicu ocena",
    category: "navigation",
    action: "NAVIGATE_GRADES",
    enabled: true,
    customizable: true,
    scope: "global",
  },
  {
    id: "nav-schedule",
    key: "4",
    modifiers: { ctrl: true },
    label: "Raspored",
    description: "Idi na stranicu rasporeda",
    category: "navigation",
    action: "NAVIGATE_SCHEDULE",
    enabled: true,
    customizable: true,
    scope: "global",
  },
  {
    id: "nav-calendar",
    key: "5",
    modifiers: { ctrl: true },
    label: "Kalendar",
    description: "Idi na stranicu kalendara",
    category: "navigation",
    action: "NAVIGATE_CALENDAR",
    enabled: true,
    customizable: true,
    scope: "global",
  },
  {
    id: "nav-settings",
    key: "6",
    modifiers: { ctrl: true },
    label: "Podešavanja",
    description: "Idi na stranicu podešavanja",
    category: "navigation",
    action: "NAVIGATE_SETTINGS",
    enabled: true,
    customizable: true,
    scope: "global",
  },

  // Actions
  {
    id: "new-homework",
    key: "n",
    modifiers: {},
    label: "Novi Domaći",
    description: "Kreiraj novi domaći zadatak",
    category: "actions",
    action: "CREATE_HOMEWORK",
    enabled: true,
    customizable: true,
    scope: "homework",
  },
  {
    id: "save-form",
    key: "s",
    modifiers: { ctrl: true },
    label: "Sačuvaj",
    description: "Sačuvaj trenutni formular",
    category: "actions",
    action: "SAVE_FORM",
    enabled: true,
    customizable: false,
    scope: "global",
  },
  {
    id: "delete-item",
    key: "Delete",
    modifiers: { shift: true },
    label: "Obriši",
    description: "Obriši izabranu stavku",
    category: "actions",
    action: "DELETE_ITEM",
    enabled: true,
    customizable: true,
    scope: "global",
  },
  {
    id: "refresh-data",
    key: "r",
    modifiers: { ctrl: true },
    label: "Osveži",
    description: "Osveži podatke sa servera",
    category: "actions",
    action: "REFRESH_DATA",
    enabled: true,
    customizable: true,
    scope: "global",
  },

  // Search
  {
    id: "focus-search",
    key: "/",
    modifiers: {},
    label: "Pretraga",
    description: "Fokusiraj polje za pretragu",
    category: "search",
    action: "FOCUS_SEARCH",
    enabled: true,
    customizable: false,
    scope: "global",
  },

  // Modal Controls
  {
    id: "close-modal",
    key: "Escape",
    modifiers: {},
    label: "Zatvori",
    description: "Zatvori trenutni modal ili overlay",
    category: "modal",
    action: "CLOSE_MODAL",
    enabled: true,
    customizable: false,
    scope: "global",
  },
  {
    id: "confirm-action",
    key: "Enter",
    modifiers: { ctrl: true },
    label: "Potvrdi",
    description: "Potvrdi akciju u modalu",
    category: "modal",
    action: "CONFIRM_ACTION",
    enabled: true,
    customizable: false,
    scope: "global",
  },

  // Help
  {
    id: "show-shortcuts",
    key: "?",
    modifiers: { shift: true },
    label: "Pomoć",
    description: "Prikaži listu svih prečica",
    category: "command",
    action: "SHOW_SHORTCUTS_HELP",
    enabled: true,
    customizable: false,
    scope: "global",
  },
];

// ============================================
// Shortcut Utilities
// ============================================

/**
 * Get shortcut display string (e.g., "Ctrl + K", "Shift + ?")
 */
export function getShortcutDisplay(shortcut: Shortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.ctrl) parts.push("Ctrl");
  if (shortcut.modifiers?.shift) parts.push("Shift");
  if (shortcut.modifiers?.alt) parts.push("Alt");
  if (shortcut.modifiers?.meta) parts.push("Cmd");

  // Format key name
  let keyName = shortcut.key;
  if (keyName === "/") keyName = "/";
  else if (keyName === "?") keyName = "?";
  else if (keyName === "Escape") keyName = "Esc";
  else if (keyName === "Enter") keyName = "Enter";
  else if (keyName === "Delete") keyName = "Del";
  else keyName = keyName.toUpperCase();

  parts.push(keyName);

  return parts.join(" + ");
}

/**
 * Check if keyboard event matches shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: Shortcut,
): boolean {
  // Check modifiers
  const ctrlMatch = !!shortcut.modifiers?.ctrl === event.ctrlKey;
  const shiftMatch = !!shortcut.modifiers?.shift === event.shiftKey;
  const altMatch = !!shortcut.modifiers?.alt === event.altKey;
  const metaMatch = !!shortcut.modifiers?.meta === event.metaKey;

  if (!ctrlMatch || !shiftMatch || !altMatch || !metaMatch) {
    return false;
  }

  // Check key
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();

  return eventKey === shortcutKey;
}

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(
  shortcuts: Shortcut[],
): Record<ShortcutCategory, Shortcut[]> {
  const categorized: Record<ShortcutCategory, Shortcut[]> = {
    navigation: [],
    actions: [],
    search: [],
    modal: [],
    command: [],
  };

  for (const shortcut of shortcuts) {
    categorized[shortcut.category].push(shortcut);
  }

  return categorized;
}

/**
 * Get shortcuts by scope
 */
export function getShortcutsByScope(
  shortcuts: Shortcut[],
  scope: string,
): Shortcut[] {
  return shortcuts.filter(
    (s) => s.enabled && (s.scope === "global" || s.scope === scope),
  );
}

/**
 * Check if element is editable (input, textarea, contentEditable)
 */
export function isEditableElement(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea") return true;

  if (element.hasAttribute("contenteditable")) {
    return element.getAttribute("contenteditable") === "true";
  }

  return false;
}

/**
 * Category labels in Serbian
 */
export const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  navigation: "Navigacija",
  actions: "Akcije",
  search: "Pretraga",
  modal: "Modali",
  command: "Komande",
};

/**
 * Category descriptions
 */
export const CATEGORY_DESCRIPTIONS: Record<ShortcutCategory, string> = {
  navigation: "Brza navigacija između stranica",
  actions: "Akcije nad podacima",
  search: "Pretraga sadržaja",
  modal: "Kontrola prozora i dijaloga",
  command: "Sistemske komande",
};
