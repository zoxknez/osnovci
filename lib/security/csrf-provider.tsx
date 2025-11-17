// CSRF Context Provider
// Provides CSRF tokens to all client components
"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface CsrfContextValue {
  token: string | null;
  secret: string | null;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextValue>({
  token: null,
  secret: null,
  isLoading: true,
  refreshToken: async () => {},
});

export function CsrfProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchToken = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/csrf");
      const data = await response.json();

      if (data.success && data.data) {
        setToken(data.data.token);
        setSecret(data.data.secret);

        // Store in sessionStorage for easy access
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("csrf-token", data.data.token);
          window.sessionStorage.setItem("csrf-secret", data.data.secret);
        }
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();

    // Refresh token every 30 minutes
    const interval = setInterval(fetchToken, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchToken]);

  return (
    <CsrfContext.Provider
      value={{
        token,
        secret,
        isLoading,
        refreshToken: fetchToken,
      }}
    >
      {children}
    </CsrfContext.Provider>
  );
}

/**
 * Hook to access CSRF tokens
 */
export function useCsrf() {
  const context = useContext(CsrfContext);
  if (!context) {
    throw new Error("useCsrf must be used within CsrfProvider");
  }
  return context;
}

/**
 * Hook to get headers with CSRF token
 */
export function useCsrfHeaders() {
  const { token, secret } = useCsrf();

  return {
    "x-csrf-token": token || "",
    "x-csrf-secret": secret || "",
  };
}
