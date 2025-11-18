// Parental Consent Verification Page
// For children under 13 (COPPA compliance)

"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function ConsentVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error("Kod mora imati 6 cifara");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Greška pri verifikaciji koda");
      }

      setVerified(true);
      toast.success("Saglasnost uspešno verifikovana! 🎉");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/prijava?verified=true");
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri verifikaciji");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl hover:scale-105 transition-transform">
              O
            </div>
          </Link>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Osnovci
          </h1>
          <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            Verifikacija roditeljske saglasnosti
          </p>
        </div>

        <Card className="shadow-2xl border-2 border-gray-200 backdrop-blur-sm bg-white/90">
          {/* Decorative gradient bar */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

          <CardHeader className="pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-blue-100">
                {verified ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Mail className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-extrabold">
                  {verified ? "Saglasnost verifikovana! ✅" : "Unesi kod iz email-a"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {verified
                    ? "Možeš sada da se prijaviš u aplikaciju"
                    : "6-cifreni kod koji si dobio/la na email"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!verified ? (
              <>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Zašto je ovo potrebno?</p>
                      <p className="text-blue-700 leading-relaxed">
                        Prema COPPA zakonu (Children's Online Privacy Protection Act), 
                        deca mlađa od 13 godina moraju imati roditeljsku saglasnost 
                        pre korišćenja online platformi.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <Input
                    label="6-cifreni kod"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    disabled={isLoading}
                    maxLength={6}
                    helperText="Proveri inbox i spam folder"
                    autoFocus
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                    loading={isLoading}
                    disabled={code.length !== 6}
                  >
                    {!isLoading && (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Verifikuj kod
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span>📧</span> Nisi dobio/la email?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Proveri <strong>spam/junk</strong> folder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Email može stići sa zakašnjenjem (2-5 minuta)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Proveri da li je email adresa ispravno uneta</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <CheckCircle className="h-10 w-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Sve je u redu!
                  </h3>
                  <p className="text-green-700">
                    Roditeljska saglasnost je uspešno verifikovana. 
                    Tvoj nalog je sada aktivan.
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Preusmeriće te na prijavu za 2 sekunde...
                  </p>
                  <Button
                    onClick={() => router.push("/prijava?verified=true")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    size="lg"
                  >
                    Idi na prijavu odmah
                  </Button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ili</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Imaš pitanja?{" "}
                <Link
                  href="/kontakt"
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Kontaktiraj nas
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Već verifikovan/a?{" "}
                <Link
                  href="/prijava"
                  className="font-bold text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Prijavi se ovde
                </Link>
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Shield className="h-4 w-4 text-green-700" />
                <span className="font-medium">COPPA compliant</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Sigurno</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-gray-500 leading-relaxed px-4">
          Tvoja privatnost je naš prioritet.{" "}
          <Link href="/privatnost" className="underline hover:text-blue-600">
            Politika privatnosti
          </Link>{" "}
          •{" "}
          <Link href="/coppa" className="underline hover:text-blue-600">
            COPPA compliance
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
