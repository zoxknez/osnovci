// Theme Toggle Component - Removed (Light theme only)
"use client";

import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // Light theme only - no toggle needed
  return (
    <Button variant="ghost" size="icon" disabled aria-label="Svetla tema">
      <Sun className="h-5 w-5 text-orange-500" />
    </Button>
  );
}

// Simple toggle - Light theme only
export function SimpleThemeToggle() {
  // Light theme only - no toggle needed
  return (
    <Button variant="ghost" size="icon" disabled aria-label="Svetla tema">
      <Sun className="h-5 w-5 text-orange-500" />
    </Button>
  );
}
