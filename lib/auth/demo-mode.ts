/**
 * Demo Mode Helpers
 * Provides mock authentication for demo/preview mode
 */

import type { Session } from "next-auth";

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  // Check server-side variable first, then client-side, then NODE_ENV
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NODE_ENV === "development"
  );
}

/**
 * Get demo session - mock authenticated user
 */
export function getDemoSession(): Session {
  return {
    user: {
      id: "demo-student-id",
      email: "demo@osnovci.app",
      name: "Marko Marković",
      role: "STUDENT",
      locale: "SR_LATN",
      theme: "LIGHT",
    },
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
  };
}

/**
 * Get auth session with demo mode support
 * Use this instead of auth() directly in API routes
 */
export async function getAuthSession(authFn: () => Promise<Session | null>): Promise<Session | null> {
  // If demo mode, always return demo session
  if (isDemoMode()) {
    console.log('🎯 DEMO MODE ACTIVE - Returning mock session');
    const session = getDemoSession();
    console.log('🎯 Demo session:', JSON.stringify(session.user, null, 2));
    return session;
  }

  // Otherwise use real auth
  console.log('🔒 Real auth mode - calling authFn()');
  return authFn();
}
