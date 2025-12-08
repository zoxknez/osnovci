/**
 * Keyboard Shortcuts Component
 * Prikazuje dostupne keyboard shortcuts
 */

"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  showHelp?: boolean;
}

export function KeyboardShortcuts({
  shortcuts,
  showHelp = false,
}: KeyboardShortcutsProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / to show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowModal((prev) => !prev);
      }

      // Register shortcuts
      shortcuts.forEach((shortcut) => {
        const matches = shortcut.keys.every((key) => {
          if (key === "Ctrl") return e.ctrlKey || e.metaKey;
          if (key === "Shift") return e.shiftKey;
          if (key === "Alt") return e.altKey;
          return e.key.toLowerCase() === key.toLowerCase();
        });

        if (matches) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);

  if (!showModal && !showHelp) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
        !showModal && "hidden",
      )}
      onClick={() => setShowModal(false)}
    >
      <Card
        className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
              >
                <span className="text-sm text-gray-600">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIdx) => (
                    <Badge
                      key={keyIdx}
                      variant="outline"
                      className="font-mono text-xs px-2 py-1"
                    >
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-4 border-t text-xs text-gray-500">
              <p>Pritisni Ctrl + / da otvoriš/zatvoriš ovaj prozor</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
