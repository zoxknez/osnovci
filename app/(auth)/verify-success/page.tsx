"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function VerifySuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Učitavam...</div>}>
      <VerifySuccessContent />
    </Suspense>
  );
}

function VerifySuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "unknown";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-700"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <title>Uspješno</title>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ✅ Email Verificiran!
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Tvoj email <strong className="text-indigo-600">{email}</strong> je
          uspješno potvrđen! 🎉
        </p>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-8">
          Sada možeš u potpunosti koristiti Osnovci aplikaciju.
        </p>

        {/* Button */}
        <Link
          href="/dashboard"
          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Idi na Dashboard 🚀
        </Link>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-8">
          © 2025 Osnovci - Sva Prava Zadržana
        </p>
      </div>
    </div>
  );
}
