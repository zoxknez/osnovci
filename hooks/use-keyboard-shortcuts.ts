"use client";

/**
 * Keyboard Shortcuts Hook
 *
 * React hook for registering and handling keyboard shortcuts.
 * Provides automatic cleanup and scope management.
 *
 * Usage:
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'k', modifiers: { ctrl: true }, action: () => openCommandPalette() },
 *   { key: 'n', action: () => createNew() }
 * ], 'homework');
 * ```
 *
 * @module hooks/use-keyboard-shortcuts
 */

import { useEffect, useCallback, useRef } from "react";
import {
  type Shortcut,
  matchesShortcut,
  isEditableElement,
} from "@/lib/shortcuts/config";
import { log } from "@/lib/logger";

export interface ShortcutHandler {
  shortcut: Shortcut;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  /**
   * Scope of shortcuts (e.g., 'homework', 'grades')
   * Determines which shortcuts are active
   */
  scope?: string;

  /**
   * Whether to disable shortcuts when focus is in input/textarea
   * Default: true
   */
  disableInInputs?: boolean;

  /**
   * Whether to log shortcut usage for analytics
   * Default: true
   */
  enableLogging?: boolean;

  /**
   * Custom filter function to determine if shortcut should fire
   */
  shouldHandle?: (event: KeyboardEvent) => boolean;
}

/**
 * Register keyboard shortcuts with automatic cleanup
 */
export function useKeyboardShortcuts(
  handlers: ShortcutHandler[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    scope = "global",
    disableInInputs = true,
    enableLogging = true,
    shouldHandle,
  } = options;

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if custom filter says no
      if (shouldHandle && !shouldHandle(event)) {
        return;
      }

      // Skip if focus is in editable element (unless explicitly allowed)
      if (disableInInputs && isEditableElement(event.target as Element)) {
        return;
      }

      // Check each handler
      for (const { shortcut, handler, preventDefault = true } of handlersRef.current) {
        if (!shortcut.enabled) continue;

        // Check scope
        if (shortcut.scope !== "global" && shortcut.scope !== scope) {
          continue;
        }

        // Check if event matches shortcut
        if (matchesShortcut(event, shortcut)) {
          if (preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }

          // Log usage
          if (enableLogging) {
            log.info("Keyboard shortcut triggered", {
              shortcutId: shortcut.id,
              key: shortcut.key,
              scope,
            });
          }

          // Execute handler
          try {
            handler(event);
          } catch (error) {
            log.error("Keyboard shortcut handler error", error as Error, {
              shortcutId: shortcut.id,
            });
          }

          break; // Only trigger first matching shortcut
        }
      }
    },
    [scope, disableInInputs, enableLogging, shouldHandle]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Hook for single shortcut (convenience wrapper)
 */
export function useKeyboardShortcut(
  shortcut: Shortcut,
  handler: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutsOptions = {}
) {
  useKeyboardShortcuts(
    [{ shortcut, handler, preventDefault: true }],
    options
  );
}

/**
 * Hook for Escape key (common use case)
 */
export function useEscapeKey(handler: () => void) {
  useKeyboardShortcut(
    {
      id: "escape-key",
      key: "Escape",
      label: "Escape",
      description: "Close",
      category: "modal",
      action: "ESCAPE",
      enabled: true,
      customizable: false,
      scope: "global",
    },
    handler
  );
}

/**
 * Hook for Enter key with Ctrl modifier (common use case)
 */
export function useCtrlEnter(handler: () => void) {
  useKeyboardShortcut(
    {
      id: "ctrl-enter",
      key: "Enter",
      modifiers: { ctrl: true },
      label: "Ctrl + Enter",
      description: "Confirm",
      category: "modal",
      action: "CTRL_ENTER",
      enabled: true,
      customizable: false,
      scope: "global",
    },
    handler
  );
}
