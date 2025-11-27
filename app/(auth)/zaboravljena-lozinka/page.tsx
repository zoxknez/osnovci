"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Mail, 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "sent" | "error";

export default function ZaboravljenaLozinkaPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Unesite email adresu");
      return;
    }

    if (!validateEmail(email)) {
      setError("Unesite validnu email adresu");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        setError("Previše zahteva. Pokušajte ponovo za minut.");
        setStep("error");
      } else {
        // Always show success to prevent email enumeration
        setStep("sent");
        setCountdown(60); // 60 seconds before resend
      }
    } catch {
      setError("Greška pri slanju. Pokušajte ponovo.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    
    try {
      await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCountdown(60);
    } catch {
      // Silent fail for resend
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/30 dark:bg-purple-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300/30 dark:bg-blue-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Floating Icons */}
        <motion.div
          className="absolute top-20 left-[10%] text-4xl"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🔐
        </motion.div>
        <motion.div
          className="absolute top-40 right-[15%] text-4xl"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ✉️
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-[20%] text-4xl"
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          🛡️
        </motion.div>
      </div>

      <motion.div 
        className="max-w-md w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Link */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/prijava"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Nazad na prijavu</span>
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <Shield className="w-8 h-8" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Zaboravljena lozinka?
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Unesite email adresu i poslaćemo vam link za resetovanje lozinke
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                      Email adresa
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="vas@email.com"
                        className="pl-10 h-12 text-base"
                        disabled={isLoading}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </motion.p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Šalje se...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Pošalji link za resetovanje
                      </span>
                    )}
                  </Button>
                </form>

                {/* Security Note */}
                <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Bezbednost:</strong> Link za resetovanje lozinke je validan samo 1 sat i može se koristiti samo jednom.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "sent" && (
              <motion.div
                key="sent-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 text-center"
              >
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Email je poslat! ✉️
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Ako nalog sa emailom <strong className="text-gray-900 dark:text-white">{email}</strong> postoji, poslaćemo vam link za resetovanje lozinke.
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  Proverite svoj inbox (i spam folder)
                </p>

                <div className="space-y-4">
                  <Button
                    onClick={handleResend}
                    disabled={countdown > 0 || isLoading}
                    variant="outline"
                    className="w-full h-12"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : countdown > 0 ? (
                      `Ponovo pošalji za ${countdown}s`
                    ) : (
                      "Pošalji ponovo"
                    )}
                  </Button>

                  <Link href="/prijava">
                    <Button
                      variant="ghost"
                      className="w-full h-12 text-gray-600 dark:text-gray-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Nazad na prijavu
                    </Button>
                  </Link>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-left">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">
                    💡 Saveti:
                  </p>
                  <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1 list-disc list-inside">
                    <li>Proverite spam/junk folder</li>
                    <li>Sačekajte par minuta pre ponovnog slanja</li>
                    <li>Proverite da li ste uneli ispravnu adresu</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div
                key="error-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 text-center"
              >
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-600 text-white mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <AlertCircle className="w-10 h-10" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Ups! Nešto nije u redu 😔
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error || "Došlo je do greške. Pokušajte ponovo."}
                </p>

                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setStep("email");
                      setError("");
                    }}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Pokušaj ponovo
                  </Button>

                  <Link href="/prijava">
                    <Button
                      variant="ghost"
                      className="w-full h-12 text-gray-600 dark:text-gray-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Nazad na prijavu
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Imaš problem? Kontaktiraj{" "}
          <a
            href="mailto:podrska@osnovci.app"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            podršku
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
