"use client";

import Link from "next/link";
import { useState } from "react";
import { apiPost } from "@/lib/utils/api";

export default function VerifyPendingPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [resendMessage, setResendMessage] = useState("");

  // Get email from URL params
  const getEmail = () => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  };

  const email = getEmail();

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendStatus("idle");

    try {
      await apiPost("/api/auth/verify-email", { email });
      setResendStatus("success");
      setResendMessage("✅ Email je ponovo poslat! Proveri svoju poštu.");
    } catch (_error) {
      // Obrada greške pri slanju
      setResendStatus("error");
      setResendMessage("❌ Greška pri slanju emaila. Pokušaj ponovo.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Waiting Icon */}
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-blue-500 animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Čekanje email verifikacije</title>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📧 Proveri svoj email!
        </h1>

        {/* Email Display */}
        <p className="text-gray-600 mb-6">
          Poslali smo link za verifikaciju na:
          <br />
          <span className="font-semibold text-blue-600 break-all">
            {email || "tvoj email"}
          </span>
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
          <p className="text-sm text-gray-700">
            ✅ Klikni na link u email-u da verificiraš nalog.
            <br />✅ Link istekava za 24 sata.
            <br />✅ Proveri spam folder ako ne vidis email.
          </p>
        </div>

        {/* Resend Status Messages */}
        {resendStatus === "success" && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {resendMessage}
          </div>
        )}
        {resendStatus === "error" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {resendMessage}
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResendEmail}
          disabled={isResending || !email}
          type="button"
          className={`w-full py-3 px-4 rounded-lg font-semibold mb-3 transition-all ${
            isResending || !email
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isResending ? "⏳ Slanje..." : "🔄 Ponovo pošalji email"}
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-400 text-sm">ili</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Login Link */}
        <Link
          href="/prijava"
          className="block w-full py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-center"
        >
          🚪 Nazad na prijavu
        </Link>

        {/* Footer Help */}
        <p className="text-xs text-gray-500 mt-6">
          Nisi primio/la email?
          <br />
          Koristi "Ponovo pošalji email" dugme gore.
        </p>
      </div>
    </div>
  );
}
