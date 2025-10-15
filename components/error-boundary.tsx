// React Error Boundary - Graceful error handling
"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("❌ ErrorBoundary caught error:", error, errorInfo);

    // Log to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to Sentry
      // Sentry.captureException(error, { extra: errorInfo });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI - prilagođeno deci
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Ups! Nešto nije u redu 😕
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Ne brini, ovo se dešava svima! Pokušaj ponovo ili se vrati na
                početnu stranicu.
              </p>

              {/* Error details - samo u dev modu */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    Detalji greške (samo za developere)
                  </summary>
                  <pre className="whitespace-pre-wrap text-red-600 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col gap-3 mt-6">
                <Button
                  onClick={this.handleReset}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Pokušaj ponovo
                </Button>

                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Vrati se na početnu
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                Ako se problem nastavi, javi roditelju ili nastavniku! 🙋‍♂️
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component za lakšu upotrebu
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
