// Focus Trap Hook - Za modale, drawers, dialogs
// Obavezno za accessibility!

import { useEffect, useRef } from "react";
import { focusManagement } from "@/lib/utils/accessibility";

interface UseFocusTrapOptions {
  /**
   * Da li je focus trap aktivan
   */
  active: boolean;

  /**
   * Auto-focus prvog elementa pri otvaranju
   */
  autoFocus?: boolean;

  /**
   * Callback pri zatvaranju (Escape key)
   */
  onClose?: () => void;

  /**
   * Vraća focus na prethodni element pri zatvaranju
   */
  restoreFocus?: boolean;
}

/**
 * Hook za focus trap - zadržava fokus unutar containera
 * Koristi se za modale, dialoge, side panels
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const containerRef = useFocusTrap({
 *     active: isOpen,
 *     onClose,
 *     autoFocus: true,
 *     restoreFocus: true,
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <h2>Modal Naslov</h2>
 *       <button onClick={onClose}>Zatvori</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions) {
  const { active, autoFocus = true, onClose, restoreFocus = true } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Zapamti prethodno fokusirani element
    previousActiveElement.current = document.activeElement;

    // Auto-focus prvog elementa
    if (autoFocus) {
      focusManagement.focusFirst(container);
    }

    // Handle Tab key - trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape closes
      if (event.key === "Escape" && onClose) {
        event.preventDefault();
        onClose();
        return;
      }

      // Tab traps focus
      if (event.key === "Tab") {
        focusManagement.trapFocus(container, event);
      }
    };

    // Prevent focus outside container
    const handleFocusOut = (event: FocusEvent) => {
      const target = event.relatedTarget as Node;
      if (target && !container.contains(target)) {
        // Focus ušao van containera, vrati ga nazad
        focusManagement.focusFirst(container);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    container.addEventListener("focusout", handleFocusOut);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("focusout", handleFocusOut);

      // Restore focus
      if (restoreFocus && previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus?.();
      }
    };
  }, [active, autoFocus, onClose, restoreFocus]);

  return containerRef;
}

/**
 * Hook za announce promene za screen readers
 */
export function useAnnouncer() {
  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    // Import dynamically da bi radio samo na clientu
    if (typeof window !== "undefined") {
      import("@/lib/utils/accessibility").then(({ LiveAnnouncer }) => {
        LiveAnnouncer.getInstance().announce(message, priority);
      });
    }
  };

  return { announce };
}
