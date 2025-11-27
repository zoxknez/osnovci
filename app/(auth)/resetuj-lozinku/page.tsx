"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Shield,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "loading" | "form" | "success" | "error";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "Najmanje 8 karaktera", test: (p) => p.length >= 8 },
  { label: "Jedno veliko slovo", test: (p) => /[A-Z]/.test(p) },
  { label: "Jedno malo slovo", test: (p) => /[a-z]/.test(p) },
  { label: "Jedan broj", test: (p) => /\d/.test(p) },
];

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError("Nevažeći link za resetovanje lozinke");
      setStep("error");
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.valid) {
        setEmail(data.email);
        setUserName(data.userName);
        setStep("form");
      } else {
        setError(data.error || "Nevažeći ili istekao link");
        setStep("error");
      }
    } catch {
      setError("Greška pri verifikaciji. Pokušajte ponovo.");
      setStep("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const failedRequirements = passwordRequirements.filter(
      (req) => !req.test(password)
    );
    
    if (failedRequirements.length > 0) {
      setError("Lozinka ne ispunjava sve zahteve");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setStep("success");
      } else {
        setError(data.error || "Greška pri resetovanju lozinke");
      }
    } catch {
      setError("Greška pri resetovanju. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-green-300/30 dark:bg-green-600/20 rounded-full blur-3xl"
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
      </div>

      <motion.div 
        className="max-w-md w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Main Card */}
        <motion.div 
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {step === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Proveravamo link za resetovanje...
                </p>
              </motion.div>
            )}

            {/* Form State */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <Shield className="w-8 h-8" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Nova lozinka
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Zdravo <strong>{userName}</strong>! Unesite novu lozinku za nalog{" "}
                    <strong className="text-blue-600">{email}</strong>
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                      Nova lozinka
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 text-base"
                        disabled={isLoading}
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="mt-3 space-y-1">
                      {passwordRequirements.map((req, i) => {
                        const passed = req.test(password);
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 text-sm ${
                              password.length === 0
                                ? "text-gray-400"
                                : passed
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-500"
                            }`}
                          >
                            {password.length === 0 ? (
                              <div className="w-4 h-4 rounded-full border border-gray-300" />
                            ) : passed ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            {req.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                      Potvrdite lozinku
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 text-base"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && password !== confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <X className="w-4 h-4" />
                        Lozinke se ne poklapaju
                      </p>
                    )}
                    {confirmPassword.length > 0 && password === confirmPassword && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Lozinke se poklapaju
                      </p>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </p>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || password !== confirmPassword || password.length < 8}
                    className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Čuvanje...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Sačuvaj novu lozinku
                      </span>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Success State */}
            {step === "success" && (
              <motion.div
                key="success"
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
                  Lozinka je promenjena! 🎉
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Vaša nova lozinka je sačuvana. Sada možete da se prijavite sa novom lozinkom.
                </p>

                <Button
                  onClick={() => router.push("/prijava")}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Idi na prijavu
                </Button>
              </motion.div>
            )}

            {/* Error State */}
            {step === "error" && (
              <motion.div
                key="error"
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
                  Link nije validan 😔
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error || "Link za resetovanje lozinke je nevažeći ili je istekao."}
                </p>

                <div className="space-y-4">
                  <Link href="/zaboravljena-lozinka">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Zatraži novi link
                    </Button>
                  </Link>

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
      </motion.div>
    </div>
  );
}

export default function ResetujLozinkuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
