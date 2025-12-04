/**
 * App Providers - Optimized & Enhanced
 * Wraps app with all necessary context providers
 * Includes performance monitoring and error handling
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { CsrfProvider } from "@/lib/security/csrf-provider";
import { ShortcutsProvider } from "@/components/providers/shortcuts-provider";
import { AdvancedErrorBoundary } from "@/components/ui/advanced-error-boundary";
import { useWebVitals } from "@/lib/performance/monitoring";
import { ReducedMotionProvider } from "@/components/features/accessibility/reduced-motion";

/**
 * Create QueryClient with default options
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache time settings
        staleTime: 1000 * 60 * 5, // 5 min - data je fresh
        gcTime: 1000 * 60 * 30, // 30 min - garbage collection (formerly cacheTime)

        // Refetch settings
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Retry settings
        retry: 1, // Pokušaj samo jednom
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network mode
        networkMode: "offlineFirst", // Allow queries to run without network (from cache)
      },
      mutations: {
        // Retry failed mutations
        retry: 0, // Ne retryuj mutations
        networkMode: "offlineFirst",
      },
    },
  });
}

/**
 * Browser-only QueryClient
 * Prevents SSR hydration issues
 */
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

/**
 * Performance Monitor Component
 */
function PerformanceMonitor() {
  useWebVitals();
  return null;
}

/**
 * App Providers Component - Enhanced
 */
export function Providers({
  children,
  nonce: _nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may
  // suspend because React will throw away the client on the initial
  // render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <AdvancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CsrfProvider>
            <ShortcutsProvider>
              {/* Performance monitoring */}
              <PerformanceMonitor />
              
              {/* Reduced motion support */}
              <ReducedMotionProvider>
                {children}
              </ReducedMotionProvider>
            </ShortcutsProvider>
          </CsrfProvider>
        </ThemeProvider>

        {/* React Query Devtools - Only in development */}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        )}
      </QueryClientProvider>
    </AdvancedErrorBoundary>
  );
}
