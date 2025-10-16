"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staggerItem } from "@/lib/animations/variants";
import { LANGUAGE_OPTIONS } from "./constants";
import type { LanguageOption } from "./types";

interface AppearanceSectionProps {
  language: LanguageOption;
  onLanguageChange: (language: LanguageOption) => Promise<void>;
}

export function AppearanceSection({ language, onLanguageChange }: AppearanceSectionProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-lg">
              🎨
            </span>
            Izgled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label text="Jezik" />
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGE_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => onLanguageChange(option.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 relative ${
                    language === option.value
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  {language === option.value && <SelectionBadge layoutId="language-indicator" />}
                  <span className="text-2xl">{option.flag}</span>
                  <span
                    className={`font-medium transition-colors ${
                      language === option.value ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Label({ text }: { text: string }) {
  return <div className="text-sm font-medium text-gray-700 mb-3 block">{text}</div>;
}

function SelectionBadge({ layoutId }: { layoutId: string }) {
  return (
    <motion.div
      layoutId={layoutId}
      className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
      initial={false}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <span className="text-white text-xs">✓</span>
    </motion.div>
  );
}
