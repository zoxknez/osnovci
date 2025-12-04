/**
 * Enhanced API Client
 * Handles rate limiting errors and provides better feedback
 */

import { showRateLimitToast, parseRateLimitHeaders } from "@/components/features/rate-limit-feedback";
import { showErrorToast } from "@/components/features/error-toast";

interface ApiClientOptions extends RequestInit {
  showRateLimitFeedback?: boolean;
  showErrorToast?: boolean;
}

/**
 * Enhanced fetch with rate limit handling
 */
export async function apiFetch(
  url: string,
  options: ApiClientOptions = {}
): Promise<Response> {
  const {
    showRateLimitFeedback = true,
    showErrorToast: showToast = true,
    ...fetchOptions
  } = options;

  try {
    const response = await fetch(url, fetchOptions);

    // Handle rate limiting
    if (response.status === 429) {
      if (showRateLimitFeedback) {
        const rateLimitInfo = parseRateLimitHeaders(response.headers);
        showRateLimitToast(
          rateLimitInfo.retryAfter,
          rateLimitInfo.violations,
          rateLimitInfo.blockedUntil
        );
      }
      return response;
    }

    // Handle other errors
    if (!response.ok && showToast) {
      const errorData = await response.json().catch(() => ({}));
      showErrorToast({
        error: new Error(errorData.message || `HTTP ${response.status}`),
      });
    }

    return response;
  } catch (error) {
    if (showToast) {
      showErrorToast({
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
    throw error;
  }
}

/**
 * API POST helper
 */
export async function apiPost<T = any>(
  url: string,
  data: any,
  options: ApiClientOptions = {}
): Promise<T> {
  const response = await apiFetch(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * API PATCH helper
 */
export async function apiPatch<T = any>(
  url: string,
  data: any,
  options: ApiClientOptions = {}
): Promise<T> {
  const response = await apiFetch(url, {
    ...options,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * API GET helper
 */
export async function apiGet<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const response = await apiFetch(url, {
    ...options,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

