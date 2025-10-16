"use client";

import { motion } from "framer-motion";

export function LastUpdatedNotice() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-center text-sm text-gray-500 py-4"
    >
      <p>
        Poslednja izmena:{" "}
        <span className="font-medium">
          {new Date().toLocaleDateString("sr-RS")}
        </span>
      </p>
    </motion.div>
  );
}
