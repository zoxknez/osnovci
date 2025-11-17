/**
 * API Utilities
 * Common fetch wrappers and helpers
 */

import { toast } from "sonner";

interface FetchOptions extends RequestInit {
  showErrorToast?: boolean;
  errorMessage?: string;
}

/**
 * Enhanced fetch with error handling
 */
export async function fetchApi<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { showErrorToast = true, errorMessage, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Greška pri komunikaciji sa serverom",
      }));

      throw new Error(errorData.message || errorMessage || "API greška");
    }

    return response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nepoznata greška";

    if (showErrorToast) {
      toast.error("Greška", {
        description: errorMessage || message,
      });
    }

    throw error;
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  url: string,
  options: Omit<FetchOptions, "method" | "body"> = {},
): Promise<T> {
  return fetchApi<T>(url, { ...options, method: "GET" });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  url: string,
  data?: any,
  options: Omit<FetchOptions, "method" | "body"> = {},
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "POST",
    ...(data && { body: JSON.stringify(data) }),
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  url: string,
  data?: any,
  options: Omit<FetchOptions, "method" | "body"> = {},
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "PUT",
    ...(data && { body: JSON.stringify(data) }),
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  url: string,
  data?: any,
  options: Omit<FetchOptions, "method" | "body"> = {},
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "PATCH",
    ...(data && { body: JSON.stringify(data) }),
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  url: string,
  options: Omit<FetchOptions, "method" | "body"> = {},
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "DELETE",
  });
}

/**
 * Upload file
 */
export async function uploadFile(
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    xhr.open("POST", url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(formData);
  });
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Retry failed request
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: boolean;
  } = {},
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = true } = options;

  let lastError: Error;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (i < retries - 1) {
        const waitTime = backoff ? delay * 2 ** i : delay;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError!;
}

/**
 * Cancel-able fetch
 */
export function createCancelableFetch<T>(
  url: string,
  options: RequestInit = {},
): {
  promise: Promise<T>;
  cancel: () => void;
} {
  const controller = new AbortController();

  const promise = fetch(url, {
    ...options,
    signal: controller.signal,
  }).then((res) => res.json()) as Promise<T>;

  return {
    promise,
    cancel: () => controller.abort(),
  };
}
