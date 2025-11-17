// Accessibility Utilities - WCAG 2.1 AA Compliant
// Za decu i osobe sa invaliditetom

/**
 * Proverava da li color contrast prolazi WCAG AA standard (4.5:1)
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns true ako prolazi WCAG AA
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA za normal text
}

/**
 * Izračunava contrast ratio između dve boje
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Izračunava relative luminance boje
 */
function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const values = [rgb.r, rgb.g, rgb.b].map((val) => {
    const channel = val / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  const r = values[0] ?? 0;
  const g = values[1] ?? 0;
  const b = values[2] ?? 0;

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Konvertuje hex u RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  const r = result[1];
  const g = result[2];
  const b = result[3];
  
  if (!r || !g || !b) return null;
  
  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16),
  };
}

/**
 * Announcer za screen readers - obaveštava o promenama bez fokusa
 */
export class LiveAnnouncer {
  private static instance: LiveAnnouncer;
  private container: HTMLDivElement | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.createContainer();
    }
  }

  static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer();
    }
    return LiveAnnouncer.instance;
  }

  private createContainer() {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.setAttribute("aria-live", "polite");
    this.container.setAttribute("aria-atomic", "true");
    this.container.setAttribute("aria-relevant", "additions text");
    this.container.className = "sr-only"; // Screen reader only
    document.body.appendChild(this.container);
  }

  /**
   * Objavljuje poruku za screen readers
   * @param message - Poruka koja će biti pročitana
   * @param priority - 'polite' ili 'assertive'
   */
  announce(message: string, priority: "polite" | "assertive" = "polite") {
    if (!this.container) return;

    this.container.setAttribute("aria-live", priority);
    this.container.textContent = message;

    // Clear nakon 1s da bi mogao ponovo da čita istu poruku
    setTimeout(() => {
      if (this.container) {
        this.container.textContent = "";
      }
    }, 1000);
  }
}

/**
 * Hook za keyboard navigation
 */
export function useKeyboardNavigation(options: {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}) {
  return (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        options.onEnter?.();
        break;
      case "Escape":
        options.onEscape?.();
        break;
      case "ArrowUp":
        event.preventDefault();
        options.onArrowUp?.();
        break;
      case "ArrowDown":
        event.preventDefault();
        options.onArrowDown?.();
        break;
      case "ArrowLeft":
        options.onArrowLeft?.();
        break;
      case "ArrowRight":
        options.onArrowRight?.();
        break;
    }
  };
}

/**
 * Generiše unique ID za accessibility labels
 * Uses module-level counter to ensure unique IDs across renders
 */
let idCounter = 0;
export function useA11yId(prefix = "a11y"): string {
  if (typeof window === "undefined") return `${prefix}-ssr`;

  // Increment module-level counter for unique IDs
  return `${prefix}-${++idCounter}`;
}

/**
 * ARIA role descriptions za decu - jednostavno objašnjenje
 */
export const ARIA_ROLE_DESCRIPTIONS = {
  button: "dugme koje možeš pritisnuti",
  link: "link koji te vodi na drugu stranicu",
  checkbox: "kućica koju možeš čekirati",
  radio: "izbor između nekoliko opcija",
  textbox: "polje gde možeš pisati",
  combobox: "padajuća lista za izbor",
  menu: "meni sa opcijama",
  dialog: "prozor sa informacijama",
  alert: "važna poruka",
  status: "statusna poruka",
  timer: "tajmer",
  progressbar: "traka napredovanja",
} as const;

/**
 * Validates da li je element dostupan za keyboard i screen readers
 */
export function validateAccessibility(element: HTMLElement): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for interactive elements without role
  const isInteractive =
    element.tagName === "BUTTON" ||
    element.tagName === "A" ||
    element.tagName === "INPUT" ||
    element.hasAttribute("onclick");

  if (isInteractive) {
    // Check for accessible name
    const hasLabel =
      element.hasAttribute("aria-label") ||
      element.hasAttribute("aria-labelledby") ||
      element.textContent?.trim();

    if (!hasLabel) {
      issues.push("Missing accessible name (aria-label or text content)");
    }

    // Check for keyboard accessibility
    const tabIndex = element.getAttribute("tabindex");
    if (tabIndex === "-1" && !element.hasAttribute("disabled")) {
      issues.push('Element is not keyboard accessible (tabindex="-1")');
    }
  }

  // Check images for alt text
  if (element.tagName === "IMG") {
    if (!element.hasAttribute("alt")) {
      issues.push("Image missing alt attribute");
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Focuses first focusable element in container
   */
  focusFirst(container: HTMLElement) {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }
  },

  /**
   * Focuses last focusable element in container
   */
  focusLast(container: HTMLElement) {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      (focusable[focusable.length - 1] as HTMLElement).focus();
    }
  },

  /**
   * Gets all focusable elements in container
   */
  getFocusableElements(container: HTMLElement): Element[] {
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector));
  },

  /**
   * Traps focus within container (za modale)
   */
  trapFocus(container: HTMLElement, event: KeyboardEvent) {
    if (event.key !== "Tab") return;

    const focusable = this.getFocusableElements(container);
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  },
};

/**
 * Skip link helper - omogućava preskakanje navigacije
 */
export function createSkipLink(targetId: string, label: string) {
  return {
    href: `#${targetId}`,
    label,
    className:
      "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg",
  };
}
