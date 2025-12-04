/**
 * Section Error Boundary
 * Lightweight error boundary for individual dashboard sections
 * Prevents one failing section from breaking the entire page
 */

"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { log } from "@/lib/logger";

interface Props {
  children: ReactNode;
  sectionName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    log.error(`Section error boundary caught error in ${this.props.sectionName || "unknown section"}`, error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Greška u sekciji
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {this.props.sectionName 
                    ? `Došlo je do greške u sekciji "${this.props.sectionName}".`
                    : "Došlo je do greške u ovoj sekciji."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Pokušaj ponovo
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

