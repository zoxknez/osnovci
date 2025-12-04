// Prijava stranica - moderna, child-friendly, dark mode support
"use client";

import { type Easing, motion, useReducedMotion } from "framer-motion";
import { LogIn, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TwoFactorModal } from "@/components/auth/two-factor-modal";
import { log } from "@/lib/logger";
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // Accessibility: respect reduced motion preferences
  const prefersReducedMotion = useReducedMotion();
  
  const backgroundAnimation = useMemo(() => 
    prefersReducedMotion ? {} : {
      animate: { x: [0, 100, 0], y: [0, 50, 0] },
      transition: { duration: 20, repeat: Infinity, ease: "easeInOut" as Easing }
    }
  , [prefersReducedMotion]);

  // Auto-focus prvi input
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Check if user has 2FA enabled
      const check2FAResponse = await fetch("/api/auth/2fa/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const check2FAData = await check2FAResponse.json();

      // Step 2: Verify password with NextAuth
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

      // Step 3: If 2FA is enabled, show 2FA modal
      if (check2FAData.twoFactorEnabled) {
        setPendingEmail(formData.email);
        setShow2FA(true);
        setIsLoading(false);
        return;
      }

      // Step 4: No 2FA - Complete login
      toast.success("Dobrodošli nazad! 🎉");
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push("/dashboard");
    } catch (error) {
      log.error("Login failed", error, { email: formData.email });
      toast.error("Došlo je do greške. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    toast.info("Prijavljujem te kao demo korisnika...", { duration: 2000 });

    try {
      // Automatically fill in demo credentials and submit
      setFormData({
        email: "marko@demo.rs",
        password: "marko123",
      });

      // Small delay to ensure state update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await signIn("credentials", {
        email: "marko@demo.rs",
        password: "marko123",
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        console.error("Demo login error:", result.error);
        toast.error(`Greška: ${result.error}`);
        setIsLoading(false);
        return;
      }

      if (!result?.ok) {
        console.error("Demo login failed:", result);
        toast.error("Demo nalog trenutno nije dostupan");
        setIsLoading(false);
        return;
      }

      toast.success("Dobrodošao Marko! Istraži aplikaciju! 🎉");
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push("/dashboard");
    } catch (error) {
      console.error("Demo login exception:", error);
      log.error("Demo login failed", error);
      toast.error("Demo prijava nije uspela");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return false;
      }

      // 2FA verified - complete login
      toast.success("2FA verifikovan! Dobrodošli nazad! 🎉");
      
      if (data.usedBackupCode) {
        toast.info("Backup kod je iskorišćen i više ne može biti korišćen.", {
          duration: 5000,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push("/dashboard");
      return true;
    } catch (error) {
      log.error("2FA verification failed", error);
      return false;
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setPendingEmail("");
    // Logout the session since password was correct but 2FA was cancelled
    signIn("credentials", { redirect: false }); // This will clear any pending session
    toast.info("Prijava otkazana");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background blobs - Isti stil kao landing page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 sm:top-20 -left-10 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          {...backgroundAnimation}
        />
        <motion.div
          className="absolute bottom-10 sm:bottom-20 -right-10 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          {...(prefersReducedMotion ? {} : {
            animate: { x: [0, -100, 0], y: [0, -50, 0] },
            transition: { duration: 15, repeat: Infinity, ease: "easeInOut" }
          })}
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

                {/* Demo Login Section */}
                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">brz pristup</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <h3 className="font-bold text-amber-900">Demo Nalog</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Isprobaj aplikaciju bez registracije
                  </p>
                  <div className="flex gap-2 text-xs text-gray-500 mb-3">
                    <div className="flex-1">
                      <strong>Email:</strong> marko@demo.rs
                    </div>
                    <div className="flex-1">
                      <strong>Lozinka:</strong> marko123
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-amber-400 bg-white hover:bg-amber-50 text-amber-900 font-bold"
                    size="sm"
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-amber-600" />
                    Uloguj se kao Marko
                  </Button>
                </div>
              </form>

              {/* 2FA Modal */}
              <TwoFactorModal
                open={show2FA}
                onVerify={handle2FAVerify}
                onCancel={handle2FACancel}
                email={pendingEmail}
              />

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
                    <Shield className="h-4 w-4 text-green-700 flex-shrink-0" />
                    <span className="font-medium">Sigurno</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <span className="text-purple-600 flex-shrink-0 text-lg">
                      ✨
                    </span>
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
