// Prijava stranica - moderna, child-friendly, dark mode support
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Shield, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DEMO_ACCOUNTS = [
  {
    name: "Demo Učenik 1",
    email: "demo1@osnovci.rs",
    password: "demo123",
    desc: "5-8 razred - Demo nalog",
  },
  {
    name: "Demo Učenik 2",
    email: "demo2@osnovci.rs",
    password: "demo123",
    desc: "5-8 razred - Demo nalog",
  },
  {
    name: "Demo Učenik 3",
    email: "demo3@osnovci.rs",
    password: "demo123",
    desc: "5-8 razred - Demo nalog",
  },
  {
    name: "Demo Učenik 4",
    email: "demo4@osnovci.rs",
    password: "demo123",
    desc: "5-8 razred - Demo nalog",
  },
  {
    name: "Demo Učenik 5",
    email: "demo5@osnovci.rs",
    password: "demo123",
    desc: "5-8 razred - Demo nalog",
  },
];

export default function PrijavaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true); // Pokazuj odmah demo naloge
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Auto-focus prvi input
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Pogrešan email ili lozinka");
      } else {
        toast.success("Dobrodošli nazad! 🎉");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Greška pri prijavljivanju");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login sa demo nalogom
  const handleDemoLogin = async (email: string, password: string) => {
    setFormData({ email, password });
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Greška pri demo prijavi");
      } else {
        toast.success(`🎉 Ulogovan kao ${email.split("@")[0]}!`);
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Greška pri demo prijavi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background blobs - Isti stil kao landing page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 sm:top-20 -left-10 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 sm:bottom-20 -right-10 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header - Mobile optimized */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-6 sm:mb-8"
        >
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block mb-3 sm:mb-4"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-2xl touch-manipulation">
                O
              </div>
            </motion.div>
          </Link>
          <Link href="/">
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 hover:scale-105 active:scale-95 transition-transform inline-block">
              Osnovci
            </h1>
          </Link>
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-1.5 sm:mb-2">
            <LogIn className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <p className="text-base sm:text-lg font-medium">
              Prijavi se na svoj nalog
            </p>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Nastavi tamo gde si stao 🎯
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-2xl border-2 border-gray-200 backdrop-blur-sm bg-white/95 overflow-hidden">
            {/* Decorative gradient bar */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

            <CardHeader className="pb-5 sm:pb-6 px-5 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">👋</span>
                Dobrodošli nazad!
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Unesi svoje podatke da nastaviš sa učenjem
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 sm:px-6">
              <form
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-5"
                aria-label="Forma za prijavu"
              >
                <Input
                  ref={emailInputRef}
                  label="Email ili telefon"
                  type="text"
                  placeholder="ime@primer.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  helperText="Unesi email ili broj telefona koji si koristio za registraciju"
                  aria-label="Email adresa ili broj telefona"
                />

                <div>
                  <Input
                    label="Lozinka"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    helperText="Minimum 6 karaktera"
                    aria-label="Lozinka za pristup nalogu"
                  />
                  <div className="mt-2 text-right">
                    <Link
                      href="/zaboravljena-lozinka"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      Zaboravljena lozinka?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                  loading={isLoading}
                  aria-label={
                    isLoading
                      ? "Prijavljivanje u toku, molim sačekaj..."
                      : "Prijavi se na nalog"
                  }
                >
                  {!isLoading && (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Prijavi se
                    </>
                  )}
                </Button>
              </form>

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500 font-medium">
                    ili probaj demo
                  </span>
                </div>
              </div>

              {/* Demo Accounts Panel - Poboljšan dizajn */}
              <AnimatePresence mode="wait">
                {showDemoAccounts && (
                  <motion.div
                    initial={{ opacity: 1, height: "auto" }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 space-y-2.5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Demo Nalozi - Klikni za pristup
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowDemoAccounts(false)}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label="Zatvori demo naloge"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-2">
                        {DEMO_ACCOUNTS.map((account, idx) => (
                          <motion.button
                            key={account.email}
                            type="button"
                            onClick={() =>
                              handleDemoLogin(account.email, account.password)
                            }
                            disabled={isLoading}
                            initial={{ opacity: 1, x: 0 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-3.5 bg-white rounded-xl border-2 border-blue-100 hover:border-blue-400 hover:shadow-lg transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {account.name}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                  {account.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                                  {account.desc}
                                </span>
                                <motion.span
                                  className="text-blue-600"
                                  animate={{ x: [0, 4, 0] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                  }}
                                >
                                  →
                                </motion.span>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showDemoAccounts && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <button
                    type="button"
                    onClick={() => setShowDemoAccounts(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 mx-auto hover:gap-2 transition-all"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Prikaži demo naloge
                  </button>
                </motion.div>
              )}

              {/* Sign up link */}
              <div className="text-center mt-5 sm:mt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Nemaš nalog?{" "}
                  <Link
                    href="/registracija"
                    className="font-bold text-blue-600 hover:text-blue-700 active:text-blue-800 hover:underline touch-manipulation"
                  >
                    Registruj se odmah
                  </Link>
                </p>

                {/* Trust badges - Mobile optimized */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-5 sm:mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="font-medium">Sigurno</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="font-medium">Bez reklama</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <span className="text-blue-600 flex-shrink-0">✓</span>
                    <span className="font-medium">Dostupno</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 text-center text-xs text-gray-500 leading-relaxed px-4"
        >
          Prijavom se slažeš sa našim{" "}
          <Link href="/uslovi" className="underline hover:text-blue-600">
            uslovima korišćenja
          </Link>{" "}
          i{" "}
          <Link href="/privatnost" className="underline hover:text-blue-600">
            privatnosti
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
