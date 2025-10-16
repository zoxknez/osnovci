// Theme Provider - Light Mode Only (No Theme Switching)
"use client";

import type { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Light theme only - no theme provider needed
  return <>{children}</>;
}
