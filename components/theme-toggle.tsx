// Theme Toggle Component - Prilagođeno deci
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Tema se učitava">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const themes = [
    { value: "light", icon: Sun, label: "Svetla tema" },
    { value: "dark", icon: Moon, label: "Tamna tema" },
    { value: "system", icon: Laptop, label: "Sistemska tema" },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      {themes.map(({ value, icon: ThemeIcon, label }) => {
        const isActive = theme === value;

        return (
          <motion.div
            key={value}
            animate={{ scale: isActive ? 1 : 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(value)}
              aria-label={label}
              aria-pressed={isActive}
              className={`relative h-9 w-9 rounded-full transition-colors ${
                isActive
                  ? "bg-white dark:bg-gray-700 shadow-md"
                  : "hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <ThemeIcon
                className={`h-5 w-5 transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              />

              {isActive && (
                <motion.div
                  layoutId="activeTheme"
                  className="absolute inset-0 rounded-full bg-blue-500/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

// Simple toggle (for mobile)
export function SimpleThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Prebaci na svetlu temu" : "Prebaci na tamnu temu"}
      className="relative h-10 w-10"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5 text-blue-400" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5 text-yellow-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
