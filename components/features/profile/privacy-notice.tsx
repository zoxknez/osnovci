"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export function PrivacyNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg"
    >
      <div className="flex gap-3">
        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-blue-900 mb-1">🔒 Privatnost i sigurnost</div>
          <div className="text-sm text-blue-800">
            Sve zdravstvene informacije su šifrovane i vidljive samo roditeljima i ovlašćenom
            osoblju škole. Podaci se koriste isključivo za bezbednost i dobrobit deteta.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
