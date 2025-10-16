// Registracija stranica - multi-step, child-friendly, dark mode support
"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  Shield,
  Sparkles,
  Users,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type Step = "role" | "details";
type Role = "STUDENT" | "GUARDIAN";

export default function RegistracijaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Za učenike
    school: "",
    grade: 1,
    class: "",
  });

  // Auto-focus kada se pređe na details step
  useEffect(() => {
    if (step === "details") {
      nameInputRef.current?.focus();
    }
  }, [step]);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Lozinke se ne poklapaju");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Lozinka mora imati najmanje 6 karaktera");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          password: formData.password,
          ...(role === "STUDENT" && {
            school: formData.school,
            grade: formData.grade,
            class: formData.class,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Greška pri registraciji");
        return;
      }

      toast.success("Nalog uspešno kreiran! 🎉");
      router.push("/prijava");
    } catch {
      toast.error("Greška pri registraciji");
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
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo & Header - Isti stil kao prijava */}
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
            <span className="text-xl sm:text-2xl">🎓</span>
            <p className="text-base sm:text-lg font-medium">Kreiraj novi nalog</p>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 px-4">
            Jednostavno • Bez reklama • Potpuno sigurno
          </p>
          {/* Progress Indicator */}
          {step === "details" && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-center gap-2"
            >
              <motion.div 
                className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-full shadow-md"
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Korak 2/2 - Još malo!</span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-2xl border-2 border-gray-200 backdrop-blur-sm bg-white/90 overflow-hidden">
            {/* Decorative gradient bar */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

            {step === "role" && (
              <>
                <CardHeader className="pb-5 sm:pb-6 px-5 sm:px-6">
                  <CardTitle className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl">🚀</span>
                    Ko si ti?
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Izaberi tip naloga koji želiš da kreiraš
                  </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-4 sm:gap-6 md:grid-cols-2 pb-6 sm:pb-8 px-5 sm:px-6">
                  {/* Učenik kartica */}
                  <motion.button
                    type="button"
                    onClick={() => handleRoleSelect("STUDENT")}
                    aria-label="Registruj se kao učenik"
                    whileHover={{ y: -8, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border-3 border-blue-200 bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 p-6 sm:p-8 text-left transition-all hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/50 active:scale-95 focus:ring-4 focus:ring-blue-500/30 focus:outline-none touch-manipulation"
                  >
                    {/* Animated gradient overlay */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />

                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="relative mb-5 sm:mb-6 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-300/50 transition-all"
                    >
                      <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
                    </motion.div>

                    <h3 className="relative mb-2 sm:mb-3 text-xl sm:text-2xl font-extrabold text-gray-900">
                      Ja sam učenik
                    </h3>
                    <p className="relative text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                      Pratim domaće, raspored časova i svoje ocene
                    </p>

                    {/* Features list */}
                    <div className="relative space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-medium">Fotografisanje domaćih</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-medium">Gamifikacija i XP sistem</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-medium">Povezivanje sa roditeljima</span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <motion.div
                      className="absolute bottom-4 right-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span className="text-xl sm:text-2xl font-bold">→</span>
                    </motion.div>
                  </motion.button>

                  {/* Roditelj kartica */}
                  <motion.button
                    type="button"
                    onClick={() => handleRoleSelect("GUARDIAN")}
                    aria-label="Registruj se kao roditelj ili staratelj"
                    whileHover={{ y: -8, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border-3 border-purple-200 bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 p-6 sm:p-8 text-left transition-all hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-200/50 active:scale-95 focus:ring-4 focus:ring-purple-500/30 focus:outline-none touch-manipulation"
                  >
                    {/* Animated gradient overlay */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />

                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="relative mb-5 sm:mb-6 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl group-hover:shadow-2xl group-hover:shadow-purple-300/50 transition-all"
                    >
                      <Users className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
                    </motion.div>

                    <h3 className="relative mb-2 sm:mb-3 text-xl sm:text-2xl font-extrabold text-gray-900">
                      Ja sam roditelj
                    </h3>
                    <p className="relative text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                      Pratim decu, njihove obaveze i napredak
                    </p>

                    {/* Features list */}
                    <div className="relative space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-medium">Praćenje više dece</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-medium">Nedeljni izveštaji</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-medium">Analitika napretka</span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <motion.div
                      className="absolute bottom-4 right-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span className="text-xl sm:text-2xl font-bold">→</span>
                    </motion.div>
                  </motion.button>
                </CardContent>
              </>
            )}

            {step === "details" && (
              <>
                <CardHeader className="pb-5 sm:pb-6 px-5 sm:px-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <motion.button
                      type="button"
                      onClick={() => setStep("role")}
                      aria-label="Vrati se nazad na izbor tipa naloga"
                      whileHover={{ scale: 1.1, x: -3 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl hover:bg-gray-100 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none touch-manipulation"
                    >
                      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                    </motion.button>
                    <CardTitle className="text-xl sm:text-3xl font-extrabold flex items-center gap-2">
                      <span className="text-2xl sm:text-4xl">
                        {role === "STUDENT" ? "🎓" : "👨‍👩‍👧"}
                      </span>
                      <span className="hidden sm:inline">
                        {role === "STUDENT"
                          ? "Podaci učenika"
                          : "Podaci roditelja"}
                      </span>
                      <span className="sm:hidden">
                        {role === "STUDENT" ? "Učenik" : "Roditelj"}
                      </span>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-base ml-9 sm:ml-11">
                    Unesi svoje podatke za kreiranje naloga
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-5 sm:px-6">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-5"
                    aria-label={`Forma za registraciju ${role === "STUDENT" ? "učenika" : "roditelja"}`}
                  >
                    <Input
                      ref={nameInputRef}
                      label="Ime i prezime"
                      type="text"
                      placeholder="Petar Petrović"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      disabled={isLoading}
                      helperText="Tvoje puno ime kako želiš da se prikazuje"
                    />

                    <Input
                      label="Email"
                      type="email"
                      placeholder="ime@primer.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={isLoading}
                      helperText="Možeš da se prijaviš pomoću email-a"
                    />

                    <Input
                      label="Telefon (opciono)"
                      type="tel"
                      placeholder="+381 60 123 4567"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={isLoading}
                      helperText="Ili koristi telefon za prijavu"
                    />

                    {role === "STUDENT" && (
                      <>
                        <Input
                          label="Škola"
                          type="text"
                          placeholder="OŠ Vuk Karadžić"
                          value={formData.school}
                          onChange={(e) =>
                            setFormData({ ...formData, school: e.target.value })
                          }
                          required
                          disabled={isLoading}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="grade-select"
                              className="mb-2 block text-sm font-medium text-gray-700"
                            >
                              Razred
                            </label>
                            <select
                              id="grade-select"
                              value={formData.grade}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  grade: Number(e.target.value),
                                })
                              }
                              className="flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white text-gray-900 px-4 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isLoading}
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                                <option key={g} value={g}>
                                  {g}. razred
                                </option>
                              ))}
                            </select>
                          </div>

                          <Input
                            label="Odeljenje"
                            type="text"
                            placeholder="1"
                            value={formData.class}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                class: e.target.value,
                              })
                            }
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </>
                    )}

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
                      minLength={6}
                      showCharCount
                      success={
                        formData.password.length >= 6
                          ? "Lozinka dovoljno jaka!"
                          : undefined
                      }
                    />

                    <Input
                      label="Potvrdi lozinku"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      disabled={isLoading}
                      error={
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? "Lozinke se ne poklapaju"
                          : undefined
                      }
                      success={
                        formData.confirmPassword &&
                        formData.password === formData.confirmPassword
                          ? "Lozinke se poklapaju!"
                          : undefined
                      }
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                      loading={isLoading}
                      aria-label={
                        isLoading
                          ? "Kreiranje naloga u toku..."
                          : "Kreiraj novi nalog"
                      }
                    >
                      {!isLoading && (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Kreiraj nalog
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">ili</span>
                    </div>
                  </div>

                  {/* Sign in link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Već imaš nalog?{" "}
                      <Link
                        href="/prijava"
                        className="font-bold text-blue-600 hover:text-blue-700 hover:underline touch-manipulation"
                      >
                        Prijavi se ovde
                      </Link>
                    </p>
                    
                    {/* Quick demo access */}
                    <p className="text-xs text-gray-500 mb-4">
                      Ili samo želiš da probaš?{" "}
                      <Link
                        href="/prijava"
                        className="font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        Koristi demo nalog →
                      </Link>
                    </p>

                    {/* Trust badges */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="font-medium">100% Sigurno</span>
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
              </>
            )}
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 text-center text-xs text-gray-500 leading-relaxed px-4"
        >
          Registracijom se slažeš sa našim{" "}
          <Link href="/uslovi" className="underline hover:text-blue-600">
            uslovima korišćenja
          </Link>
          {" "}i{" "}
          <Link href="/privatnost" className="underline hover:text-blue-600">
            privatnosti
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
