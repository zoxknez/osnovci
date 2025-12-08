"use client";

/**
 * Global Error Handler for React Rendering Errors in App Router
 *
 * This file MUST be .js (not .jsx or .tsx) per Next.js requirements.
 * It catches errors that occur during React rendering in the app directory.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-global-errors
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: { source: "global_error_handler" },
    });
  }, [error]);

  return (
    <html lang="sr">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "#f8f9fa",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              padding: "32px",
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "32px",
                color: "#dc3545",
                marginBottom: "16px",
              }}
            >
              😔 Nešto nije u redu
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Došlo je do neočekivane greške. Naš tim je obavešten i radi na
              rešenju.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              🔄 Pokušaj ponovo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
