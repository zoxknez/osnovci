// Skip Link Component - Accessibility Must-Have
// Omogućava korisnicima sa keyboard-om da preskoče navigaciju

"use client";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Skip Link - omogućava preskakanje ponavljajućeg sadržaja (navigation)
 *
 * Vidljiv samo kada dobije fokus (Tab key)
 * WCAG 2.1 AA requirement: Bypass Blocks (2.4.1)
 *
 * @example
 * ```tsx
 * <SkipLink href="#main-content">
 *   Preskoči na glavni sadržaj
 * </SkipLink>
 * ```
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      style={{
        // Koristi CSS umesto Tailwind da bude 100% siguran
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        padding: "0",
        margin: "0",
        whiteSpace: "nowrap",
        border: "0",
      }}
      onFocus={(e) => {
        // Prikaži na focus
        const el = e.currentTarget;
        el.style.top = "0";
        el.style.left = "0";
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.padding = "0.75rem";
        el.style.overflow = "visible";
        el.style.zIndex = "9999";
        el.style.display = "inline-flex";
        el.style.alignItems = "center";
        el.style.gap = "0.5rem";
        el.style.backgroundColor = "#2563eb";
        el.style.color = "white";
        el.style.borderRadius = "0.5rem";
        el.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        el.style.fontWeight = "500";
        el.style.outline = "none";
      }}
      onBlur={(e) => {
        // Sakrij nakon blur
        const el = e.currentTarget;
        el.style.top = "-9999px";
        el.style.left = "-9999px";
        el.style.width = "1px";
        el.style.height = "1px";
        el.style.padding = "0";
        el.style.overflow = "hidden";
        el.style.display = "block";
      }}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Skip Links Container - Grupa skip linkova
 */
export function SkipLinks({ children }: { children: React.ReactNode }) {
  return (
    <nav aria-label="Skip navigation" className="fixed top-0 left-0 z-50">
      {children}
    </nav>
  );
}
