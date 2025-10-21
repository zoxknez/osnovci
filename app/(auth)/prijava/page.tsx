// Prijava stranica - moderna, child-friendly, dark mode support
"use client";

import { motion } from "framer-motion";
import { LogIn, Shield } from "lucide-react";
import Link from "next/link";
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

export default function PrijavaPage() {
  const [isLoading, setIsLoading] = useState(false);
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
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        toast.error("Pogrešan email ili lozinka");
        setIsLoading(false);
        return;
      }

      // Uspešan login - prikaži success toast
      toast.success("Dobrodošli nazad! 🎉");

      // Čekaj malo da se session refresh-uje
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force redirect sa window.location za potpuni page refresh
      // Ovo osigurava da se session pravilno učita na server-u
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Greška pri prijavljivanju");
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
                    <span className="text-purple-600 flex-shrink-0 text-lg">✨</span>
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
