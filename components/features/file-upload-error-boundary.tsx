"use client";

import { FileX, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary za File Upload komponentu
 * Hvata greške kao što su:
 * - File API errors
 * - Compression failures
 * - Invalid file types
 * - Size limit exceeded
 * - Network errors during upload
 */
export class FileUploadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "File Upload Error Boundary caught an error:",
      error,
      errorInfo,
    );

    // Log to monitoring service
    if (typeof window !== "undefined" && "Sentry" in window) {
      // @ts-expect-error - Sentry is dynamically loaded
      window.Sentry?.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: "file-upload",
        },
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-2 border-red-200 rounded-xl p-8 bg-red-50">
          <div className="flex flex-col items-center text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FileX className="h-8 w-8 text-red-600" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Greška pri upload-u fajla
            </h3>

            {/* Error Message */}
            <p className="text-gray-600 mb-4 max-w-md">
              {this.state.error?.message?.includes("size") ||
              this.state.error?.message?.includes("large")
                ? "Fajl je prevelik. Pokušaj sa manjim fajlom ili kompresuj sliku."
                : this.state.error?.message?.includes("type") ||
                    this.state.error?.message?.includes("format")
                  ? "Nepodržan tip fajla. Samo slike (JPG, PNG), video (MP4) i PDF fajlovi su dozvoljeni."
                  : this.state.error?.message?.includes("network") ||
                      this.state.error?.message?.includes("fetch")
                    ? "Problem sa mrežom. Proveri internet konekciju i pokušaj ponovo."
                    : "Došlo je do greške prilikom upload-a fajla. Pokušaj ponovo."}
            </p>

            {/* Technical Details (development only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-4 text-left w-full max-w-md">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Tehnički detalji
                </summary>
                <pre className="mt-2 text-xs bg-white p-3 rounded overflow-auto max-h-32 border border-red-200">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action Button */}
            <Button
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="mt-2"
            >
              Pokušaj ponovo
            </Button>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-4 max-w-md">
              Proveri da je fajl ispravnog formata (JPG, PNG, MP4, PDF) i da
              nije veći od 10MB. Ako problem potraje, pokušaj sa drugim fajlom.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
