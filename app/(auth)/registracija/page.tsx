// Registracija stranica - multi-step, child-friendly
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { GraduationCap, Users, ArrowLeft, Sparkles, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Step = "role" | "details";
type Role = "STUDENT" | "GUARDIAN";

export default function RegistracijaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                O
              </div>
            </motion.div>
          </Link>
          <Link href="/">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 hover:scale-105 transition-transform inline-block">
              Osnovci
            </h1>
          </Link>
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
            <span className="text-2xl">🎓</span>
            <p className="text-lg font-medium">Kreiraj novi nalog</p>
          </div>
          <p className="text-sm text-gray-500">Besplatno zauvek • Bez reklama • Potpuno sigurno</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-2xl border-2 border-gray-200 backdrop-blur-sm bg-white/80 overflow-hidden">
            {/* Decorative gradient bar */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

            {step === "role" && (
              <>
                <CardHeader className="pb-6">
                  <CardTitle className="text-3xl font-extrabold flex items-center gap-2">
                    <span className="text-4xl">🚀</span>
                    Ko si ti?
                  </CardTitle>
                  <CardDescription className="text-base">
                    Izaberi tip naloga koji želiš da kreiraš
                  </CardDescription>
                </CardHeader>

              <CardContent className="grid gap-6 md:grid-cols-2 pb-8">
                {/* Učenik kartica */}
                <motion.button
                  type="button"
                  onClick={() => handleRoleSelect("STUDENT")}
                  aria-label="Registruj se kao učenik"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-3xl border-3 border-blue-200 bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 p-8 text-left transition-all hover:border-blue-400 hover:shadow-2xl active:scale-95 focus:ring-4 focus:ring-blue-500/30 focus:outline-none"
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className="relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-xl group-hover:shadow-2xl transition-shadow"
                  >
                    <GraduationCap className="h-10 w-10" aria-hidden="true" />
                  </motion.div>

                  <h3 className="relative mb-3 text-2xl font-extrabold text-gray-900">
                    Ja sam učenik
                  </h3>
                  <p className="relative text-base text-gray-700 leading-relaxed mb-4">
                    Pratim domaće, raspored časova i svoje ocene
                  </p>

                  {/* Features list */}
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span>
                      <span>Fotografisanje domaćih</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span>
                      <span>Gamifikacija i XP sistem</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span>
                      <span>Povezivanje sa roditeljima</span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <motion.div
                    className="absolute bottom-4 right-4 text-blue-600 opacity-0 group-hover:opacity-100"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-2xl font-bold">→</span>
                  </motion.div>
                </motion.button>

                {/* Roditelj kartica */}
                <motion.button
                  type="button"
                  onClick={() => handleRoleSelect("GUARDIAN")}
                  aria-label="Registruj se kao roditelj ili staratelj"
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative overflow-hidden rounded-3xl border-3 border-purple-200 bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 p-8 text-left transition-all hover:border-purple-400 hover:shadow-2xl active:scale-95 focus:ring-4 focus:ring-purple-500/30 focus:outline-none"
                >
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className="relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl group-hover:shadow-2xl transition-shadow"
                  >
                    <Users className="h-10 w-10" aria-hidden="true" />
                  </motion.div>

                  <h3 className="relative mb-3 text-2xl font-extrabold text-gray-900">
                    Ja sam roditelj
                  </h3>
                  <p className="relative text-base text-gray-700 leading-relaxed mb-4">
                    Pratim decu, njihove obaveze i napredak
                  </p>

                  {/* Features list */}
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span>
                      <span>Praćenje više dece</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span>
                      <span>Nedeljni izveštaji</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span>
                      <span>Analitika napretka</span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <motion.div
                    className="absolute bottom-4 right-4 text-purple-600 opacity-0 group-hover:opacity-100"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-2xl font-bold">→</span>
                  </motion.div>
                </motion.button>
              </CardContent>
            </>
          )}

          {step === "details" && (
            <>
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <motion.button
                    type="button"
                    onClick={() => setStep("role")}
                    aria-label="Vrati se nazad na izbor tipa naloga"
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </motion.button>
                  <CardTitle className="text-3xl font-extrabold flex items-center gap-2">
                    <span className="text-4xl">
                      {role === "STUDENT" ? "🎓" : "👨‍👩‍👧"}
                    </span>
                    {role === "STUDENT" ? "Podaci učenika" : "Podaci roditelja"}
                  </CardTitle>
                </div>
                <CardDescription className="text-base ml-11">
                  Unesi svoje podatke za kreiranje naloga
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  aria-label={`Forma za registraciju ${role === "STUDENT" ? "učenika" : "roditelja"}`}
                >
                  <Input
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
                            className="flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                            setFormData({ ...formData, class: e.target.value })
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
                  <p className="text-sm text-gray-600 mb-4">
                    Već imaš nalog?{" "}
                    <Link
                      href="/prijava"
                      className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Prijavi se ovde
                    </Link>
                  </p>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-6 mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium">100% Sigurno</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Bez reklama</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-blue-600">✓</span>
                      <span className="font-medium">Besplatno</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-gray-500"
        >
          Registracijom se slažeš sa našim uslovima korišćenja i privatnosti
        </motion.p>
      </motion.div>
    </div>
  );
}
