"use client";

import { AlertCircle, Camera, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary za Camera komponentu
 * Hvata greške kao što su:
 * - Camera pristup odbijen
 * - MediaDevices API nije dostupan
 * - Compression failure
 * - File API errors
 */
export class CameraErrorBoundary extends Component<Props, State> {
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
    console.error("Camera Error Boundary caught an error:", error, errorInfo);

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
          errorBoundary: "camera",
        },
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null as unknown as Error });
  };

  handleClose = () => {
    this.handleReset();
    this.props.onClose?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Greška sa kamerom
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              {this.state.error?.message?.includes("permission") ||
              this.state.error?.message?.includes("Permission")
                ? "Nemaš dozvolu za pristup kameri. Proveri podešavanja browser-a i dozvoli pristup kameri."
                : this.state.error?.message?.includes("not found") ||
                    this.state.error?.message?.includes("NotFound")
                  ? "Kamera nije pronađena na ovom uređaju. Pokušaj sa drugim uređajem."
                  : "Došlo je do greške prilikom korišćenja kamere. Pokušaj ponovo ili učitaj fotografiju iz galerije."}
            </p>

            {/* Technical Details (collapsed by default) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Tehnički detalji (samo u development modu)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Pokušaj ponovo
              </Button>
              {this.props.onClose && (
                <Button
                  onClick={this.handleClose}
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Camera className="h-4 w-4" />}
                >
                  Zatvori
                </Button>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-4">
              Ako problem potraje, možeš učitati fotografiju direktno iz
              galerije klikom na ikonicu galerije u donjem levom uglu.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
