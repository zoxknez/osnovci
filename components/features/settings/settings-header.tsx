"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations/variants";

export function SettingsHeader() {
  return (
    <motion.div initial="initial" animate="animate" variants={fadeInUp}>
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
        ⚙️ Podešavanja
      </h1>
      <p className="text-gray-600 mt-1">Prilagodi aplikaciju po svojoj želji</p>
    </motion.div>
  );
}
