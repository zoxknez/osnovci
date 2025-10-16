"use client";

import { motion } from "framer-motion";
import { LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerItem } from "@/lib/animations/variants";

interface SettingsActionsProps {
  onLogout: () => void;
}

export function SettingsActions({ onLogout }: SettingsActionsProps) {
  return (
    <motion.div variants={staggerItem} className="flex gap-4">
      <div className="flex-1 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <Save className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-green-900">
            Auto-save aktiviran
          </div>
          <div className="text-sm text-green-700">
            Sve promene se automatski čuvaju
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onLogout}
        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        aria-label="Odjavi se sa naloga"
      >
        <LogOut className="h-4 w-4" />
        Odjavi se
      </Button>
    </motion.div>
  );
}
