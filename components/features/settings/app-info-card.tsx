"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { staggerItem } from "@/lib/animations/variants";

export function AppInfoCard() {
  return (
    <motion.div variants={staggerItem}>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="text-4xl mb-2">📱</div>
            <div className="font-semibold text-gray-900">Osnovci App</div>
            <div className="text-sm text-gray-600">Verzija 1.0.0</div>
            <div className="text-xs text-gray-500 mt-4">© 2025 Osnovci. Sva prava zadržana.</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
