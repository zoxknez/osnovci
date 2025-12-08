/**
 * Enhanced Error Boundary
 *
 * Provides comprehensive error handling with:
 * - User-friendly error display
 * - Error reporting to Sentry
 * - Recovery suggestions
 * - Error feedback form
 */

"use client";

import { AlertTriangle, Home, RefreshCw, Send } from "lucide-react";
import { Component, type ReactNode } from "react";
import { submitErrorFeedbackAction } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/monitoring/sentry-utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  feedback: string;
  feedbackSent: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      feedback: "",
      feedbackSent: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log error to console
    console.error("Error boundary caught error:", error, errorInfo);

    // Report to Sentry
    captureError(error, {
      tags: {
        errorBoundary: "true",
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
      level: "error",
    });

    this.setState({
      errorInfo: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      feedback: "",
      feedbackSent: false,
    });

    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ feedback: e.target.value });
  };

  handleSendFeedback = async () => {
    const { error, feedback } = this.state;

    if (!feedback.trim()) return;

    try {
      // Send feedback to server
      await submitErrorFeedbackAction({
        error: error?.message,
        stack: error?.stack,
        feedback,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });

      this.setState({ feedbackSent: true });
    } catch (err) {
      console.error("Failed to send feedback:", err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, feedback, feedbackSent } = this.state;
      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="w-full max-w-2xl rounded-xl border border-red-200 bg-white p-8 shadow-2xl dark:border-red-800 dark:bg-gray-900">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
              Ups! Nešto nije u redu
            </h1>

            {/* Description */}
            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              Došlo je do neočekivane greške. Naš tim je automatski obavešten i
              radi na rešenju problema.
            </p>

            {/* Error details (development only) */}
            {isDevelopment && error && (
              <div className="mb-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                <p className="mb-2 font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="max-h-40 overflow-auto text-xs text-gray-600 dark:text-gray-400">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Feedback form */}
            {!feedbackSent ? (
              <div className="mb-6">
                <label
                  htmlFor="feedback"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Šta ste pokušali da uradite? (opcionalno)
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={this.handleFeedbackChange}
                  placeholder="Npr. Pokušao sam da otvorim kalendar..."
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  rows={3}
                />
                <button
                  onClick={this.handleSendFeedback}
                  disabled={!feedback.trim()}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Pošalji povratnu informaciju
                </button>
              </div>
            ) : (
              <div className="mb-6 rounded-lg bg-green-100 p-4 text-center text-green-800 dark:bg-green-900/30 dark:text-green-400">
                ✓ Hvala na povratnoj informaciji!
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Pokušaj ponovo
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Osvež stranicu
              </Button>
              <Button onClick={this.handleGoHome} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Početna stranica
              </Button>
            </div>

            {/* Help text */}
            <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
              Ako problem i dalje postoji, kontaktirajte podršku na{" "}
              <a
                href="mailto:podrska@osnovci.app"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                podrska@osnovci.app
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
