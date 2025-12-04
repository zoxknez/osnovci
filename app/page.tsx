"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Camera,
  CheckCircle2,
  Shield,
  Sparkles,
  Trophy,
  Users,
  BookOpen,
  Star,
  Zap,
  Facebook,
  Instagram,
  Mail,
} from "lucide-react";
import Link from "next/link";

// Static data - no need for useMemo
const FEATURES = [
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

const STATS = [
    { value: "10,000+", label: "Aktivnih učenika", icon: Users },
    { value: "50,000+", label: "Završenih zadataka", icon: BookOpen },
    { value: "4.9", label: "Prosečna ocena", icon: Star },
    { value: "99.9%", label: "Uptime", icon: Zap },
  ];

export default function Home() {
  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Preskoči na glavni sadržaj
      </a>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Hero Section - Optimizovano za mobilne */}
      <section className="relative px-4 py-12 sm:py-16 md:py-20 sm:px-6 lg:px-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.2,
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              opacity: { duration: 0.8, ease: "easeOut" },
              x: { duration: 20, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 20, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute top-10 sm:top-20 -left-10 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.2,
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              opacity: { duration: 0.8, ease: "easeOut", delay: 0.2 },
              x: { duration: 15, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 15, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute bottom-10 sm:bottom-20 -right-10 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl"
          />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            {/* Badge - Mobile optimized */}
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

            {/* Main Heading - Mobile first typography */}
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

            {/* Subtitle - Better mobile readability */}
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

            {/* CTA Buttons - Touch-friendly mobile */}
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

            {/* Social Proof - Mobile optimized */}
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

      {/* Features Section - Mobile-first design */}
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
              <motion.div
                key={feature.title}
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

                {/* Animated arrow - Hidden on mobile, shown on hover desktop */}
                <motion.div
                  className="relative mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: 5 }}
                >
                  Saznaj više
                  <span>→</span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile optimized */}
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

      {/* Footer - Mobile friendly */}
      <footer className="relative px-4 py-12 sm:py-16 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🎓</span>
                <span className="text-2xl font-bold">Osnovci</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                Moderna obrazovna platforma za osnovce i njihove roditelje. 
                Sigurna, zabavna i efikasna.
              </p>
              <div className="flex gap-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="mailto:info@osnovci.app" className="text-gray-400 hover:text-white transition-colors" aria-label="Email">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Aplikacija</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/registracija" className="text-gray-400 hover:text-white transition-colors">Registracija</Link></li>
                <li><Link href="/prijava" className="text-gray-400 hover:text-white transition-colors">Prijava</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Pravno</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privatnost" className="text-gray-400 hover:text-white transition-colors">Politika privatnosti</Link></li>
                <li><Link href="/uslovi" className="text-gray-400 hover:text-white transition-colors">Uslovi korišćenja</Link></li>
                <li><Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Kolačići</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 Osnovci. Sva prava zadržana.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="h-4 w-4 text-green-500" />
              <span>COPPA & GDPR usklađeno</span>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
