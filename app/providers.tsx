/**
 * App Providers
 * Wraps app with all necessary context providers
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { CsrfProvider } from "@/lib/security/csrf-provider";
import { ShortcutsProvider } from "@/components/providers/shortcuts-provider";

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
        networkMode: "online", // Only run queries when online
      },
      mutations: {
        // Retry failed mutations
        retry: 0, // Ne retryuj mutations
        networkMode: "online",
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
 * App Providers Component
 */
export function Providers({
  children,
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CsrfProvider>
          <ShortcutsProvider>{children}</ShortcutsProvider>
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
  );
}
