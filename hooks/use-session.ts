/**
 * useSession Hook
 * Client-side session hook wrapper for NextAuth
 */

"use client";

import { useSession as useNextAuthSession } from "next-auth/react";

export function useSession() {
  return useNextAuthSession();
}

