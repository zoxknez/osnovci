"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Camera,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  emoji: string;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}

const FEATURES: Feature[] = [
  {
    icon: Camera,
    emoji: "📸",
    title: "Domaći sa dokazima",
    description:
      "Fotografiši urađeni domaći i pošalji roditeljima. AI automatski poboljšava kvalitet slike. Sve ostaje sačuvano i offline.",
    gradient: "from-blue-500 to-cyan-500",
    delay: 0,
  },
  {
    icon: Calendar,
    emoji: "📅",
    title: "Raspored časova",
    description:
      "Nedeljni raspored, automatski podsetnici i notifikacije za sve časove i kontrolne. Nikad više propuštenih časova!",
    gradient: "from-purple-500 to-pink-500",
    delay: 0.1,
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "Analitika i izveštaji",
    description:
      "Prati svoj napredak kroz intuitivne grafikone. Roditelji dobijaju nedeljne izveštaje i preporuke.",
    gradient: "from-orange-500 to-red-500",
    delay: 0.2,
  },
  {
    icon: Users,
    emoji: "👨‍👩‍👧",
    title: "Povezivanje sa roditeljima",
    description:
      "QR kod povezivanje sa roditeljima. Oni vide tvoj napredak, ti dobijaš podršku. Svi su na istoj strani!",
    gradient: "from-green-500 to-emerald-500",
    delay: 0.3,
  },
  {
    icon: Trophy,
    emoji: "🏆",
    title: "Gamifikacija i motivacija",
    description:
      "Skupljaj XP, dižiš levele, otključavaj bedževe. Učenje postaje zabavno i motivišuće svaki dan!",
    gradient: "from-yellow-500 to-orange-500",
    delay: 0.4,
  },
  {
    icon: Shield,
    emoji: "🔒",
    title: "Potpuna sigurnost",
    description:
      "Tvoji podaci su šifrovani i sigurni. Nema reklama, nema praćenja. Dizajnirano sa brigom o privatnosti.",
    gradient: "from-indigo-500 to-purple-500",
    delay: 0.5,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: feature.delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-white p-6 sm:p-8 shadow-lg hover:shadow-2xl hover:border-gray-300 transition-all touch-manipulation"
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
      />

      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className={`relative mb-5 sm:mb-6 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-3xl sm:text-4xl shadow-lg`}
      >
        {feature.emoji}
      </motion.div>

      <h3 className="relative mb-2.5 sm:mb-3 text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
        {feature.title}
      </h3>
      <p className="relative text-sm sm:text-base text-gray-600 leading-relaxed">
        {feature.description}
      </p>

      {/* Animated arrow */}
      <motion.div
        className="relative mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        whileHover={{ x: 5 }}
      >
        Saznaj više
        <span>→</span>
      </motion.div>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section className="relative px-4 py-12 sm:py-16 md:py-20 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16 px-2"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 leading-tight">
            Sve što ti treba za školu
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Jedan ekosistem za sve školske potrebe - domaći, raspored, ocene i
            više
          </p>
        </motion.div>

        <div className="grid gap-5 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 text-left">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
