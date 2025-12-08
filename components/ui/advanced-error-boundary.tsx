// Advanced Error Boundary - With Recovery & Logging
"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { log } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class AdvancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    log.error("Error Boundary caught error", error, {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary when resetKeys change
    if (
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index],
      )
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  reloadPage = () => {
    window.location.reload();
  };

  goHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorCount } = this.state;
      const isRecoverable = errorCount < 3;

      // Child-friendly error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Ups! Nešto nije u redu 😕
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Ne brini, ovo nije tvoja greška! Pokušaćemo da popravimo
                problem.
              </p>

              {/* Error details for debugging (collapsible) */}
              {process.env.NODE_ENV === "development" && error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                    Tehnički detalji (za programere)
                  </summary>
                  <div className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-40">
                    <p className="text-red-600 font-mono text-xs mb-2">
                      {error.toString()}
                    </p>
                    {errorInfo && (
                      <pre className="text-gray-600 font-mono text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-4">
                {isRecoverable && (
                  <Button
                    size="lg"
                    onClick={this.resetErrorBoundary}
                    leftIcon={<RefreshCw className="h-5 w-5" />}
                    className="w-full"
                  >
                    Pokušaj ponovo
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={this.reloadPage}
                  leftIcon={<RefreshCw className="h-5 w-5" />}
                  className="w-full"
                >
                  Osveži stranicu
                </Button>

                <Button
                  size="lg"
                  variant="ghost"
                  onClick={this.goHome}
                  leftIcon={<Home className="h-5 w-5" />}
                  className="w-full"
                >
                  Idi na početnu
                </Button>
              </div>

              {/* Error count warning */}
              {!isRecoverable && (
                <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
                  <p className="text-sm text-orange-700">
                    ⚠️ Problem se ponavlja. Preporučujemo osvežavanje stranice
                    ili kontaktiranje podrške.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void,
) {
  return function WithErrorBoundaryWrapper(props: P) {
    const boundaryProps: Partial<Props> = { fallback };
    if (onError) {
      boundaryProps.onError = onError;
    }

    return (
      <AdvancedErrorBoundary {...boundaryProps}>
        <Component {...props} />
      </AdvancedErrorBoundary>
    );
  };
}

/**
 * Async error boundary for handling async errors
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AdvancedErrorBoundary
      onError={(error) => {
        // Log async errors to monitoring
        log.error("Async error caught", error, {
          type: "async",
          timestamp: new Date().toISOString(),
        });
      }}
    >
      {children}
    </AdvancedErrorBoundary>
  );
}
