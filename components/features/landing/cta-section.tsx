"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative px-4 py-16 sm:py-20 md:py-24 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:30px_30px] sm:bg-[length:50px_50px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-4xl text-center px-2"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 leading-tight">
          Spremni za modernu školu?
        </h2>
        <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
          Započni svoje digitalno obrazovno iskustvo danas
        </p>

        <div className="flex flex-col items-stretch sm:items-center justify-center gap-4 max-w-sm mx-auto sm:max-w-none sm:flex-row">
          <Link href="/registracija" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-purple-600 shadow-2xl transition-all hover:shadow-white/30 active:shadow-white/50 min-h-[56px] touch-manipulation"
            >
              <span>🚀 Započni odmah</span>
            </motion.button>
          </Link>

          <motion.div
            className="flex items-center justify-center gap-2 text-white bg-white/10 backdrop-blur-sm rounded-full px-5 py-3 sm:bg-transparent sm:backdrop-blur-none sm:px-0 sm:py-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="text-sm sm:text-base font-semibold">
              Dostupno sada
            </span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
