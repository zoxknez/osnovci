/**
 * Hero Section Component
 * Extracted from main page for better organization
 */

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Users, BookOpen, Star, Zap } from "lucide-react";
import Link from "next/link";

const STATS = [
  { value: "10,000+", label: "Aktivnih učenika", icon: Users },
  { value: "50,000+", label: "Završenih zadataka", icon: BookOpen },
  { value: "4.9", label: "Prosečna ocena", icon: Star },
  { value: "99.9%", label: "Uptime", icon: Zap },
];

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative px-4 py-12 sm:py-16 md:py-20 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 0.2,
            x: prefersReducedMotion ? 0 : [0, 100, 0],
            y: prefersReducedMotion ? 0 : [0, 50, 0],
          }}
          transition={{
            opacity: { duration: 0.8, ease: "easeOut" },
            x: prefersReducedMotion ? {} : { duration: 20, repeat: Infinity, ease: "easeInOut" },
            y: prefersReducedMotion ? {} : { duration: 20, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute top-10 sm:top-20 -left-10 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 0.2,
            x: prefersReducedMotion ? 0 : [0, -100, 0],
            y: prefersReducedMotion ? 0 : [0, -50, 0],
          }}
          transition={{
            opacity: { duration: 0.8, ease: "easeOut", delay: 0.2 },
            x: prefersReducedMotion ? {} : { duration: 15, repeat: Infinity, ease: "easeInOut" },
            y: prefersReducedMotion ? {} : { duration: 15, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-10 sm:bottom-20 -right-10 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-blue-700 ring-2 ring-blue-200 shadow-lg"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="leading-tight">
              Savršena aplikacija za učenike i roditelje
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 sm:mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] px-2"
          >
            <span className="block">Osnovci</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient mt-1 sm:mt-2">
              sve na jednom mestu
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 sm:mb-10 max-w-3xl text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 leading-relaxed px-4"
          >
            Domaći zadaci sa dokazima, raspored časova, ocene, analitika i
            mnogo više.
            <br className="hidden sm:block" />
            <span className="block mt-2 sm:mt-1 sm:inline font-semibold text-gray-900">
              Prilagođeno deci, sigurno za roditelje.
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-stretch sm:items-center justify-center gap-3 sm:gap-4 sm:flex-row mb-12 sm:mb-16 px-4 max-w-lg mx-auto sm:max-w-none"
          >
            <Link href="/dashboard" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-white shadow-2xl shadow-blue-500/30 transition-all hover:shadow-blue-500/50 active:shadow-blue-500/60 min-h-[56px] touch-manipulation"
              >
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  🎓 Započni odmah
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
            </Link>

            <Link href="/prijava" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border-3 border-gray-300 bg-white px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-gray-900 shadow-lg transition-all hover:border-gray-400 hover:shadow-xl active:shadow-2xl min-h-[56px] touch-manipulation"
              >
                Prijavi se
              </motion.button>
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto px-4"
          >
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100"
              >
                <stat.icon className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

