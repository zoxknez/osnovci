"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations/variants";

export function SettingsHeader() {
  return (
    <motion.div initial="initial" animate="animate" variants={fadeInUp}>
      <p className="text-gray-600 mt-1">Prilagodi aplikaciju po svojoj želji</p>
    </motion.div>
  );
}
