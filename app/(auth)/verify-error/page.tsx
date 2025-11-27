"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function VerifyErrorPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Učitavam...</div>}>
      <VerifyErrorContent />
    </Suspense>
  );
}

function VerifyErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Unknown error";
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus("idle");
    setResendError(null);

    try {
      const email = prompt("Unesi tvoj email:");
      if (!email) {
        setIsResending(false);
        return;
      }

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendStatus("success");
      } else {
        const data = await response.json();
        setResendError(data.error || "Unknown error");
        setResendStatus("error");
      }
    } catch (error) {
      setResendError(error instanceof Error ? error.message : "Unknown error");
      setResendStatus("error");
    } finally {
      setIsResending(false);
    }
  };

  const getErrorMessage = (reason: string) => {
    switch (reason) {
      case "no_token":
        return "Nedostaje verification token. Molimo klikni na link iz email-a.";
      case "Invalid verification token":
        return "Verification token je nevalidan. Molimo zatraži novi email.";
      case "Verification token has expired":
        return "Verification token je istekao. Molimo zatraži novi email.";
      case "User not found":
        return "Korisnik nije pronađen. Molimo registriraj se ponovo.";
      default:
        return reason;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <title>Greška</title>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ❌ Greška pri Verifikaciji
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">{getErrorMessage(reason)}</p>

        {/* Resend Status */}
        {resendStatus === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✅ Novi verification email je poslat! Proveri tvoj inbox.
          </div>
        )}

        {resendStatus === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ❌ Greška: {resendError || "Pokušaj ponovo."}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {isResending ? "⏳ Slanjem..." : "📧 Zatraži Novi Email"}
          </button>

          <Link
            href="/prijava"
            className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Vrati se na Prijavu
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-8">
          © 2025 Osnovci - Sva Prava Zadržana
        </p>
      </div>
    </div>
  );
}
