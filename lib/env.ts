// Environment Variable Validation sa Zod
// Ensures all required env vars are set at build time

import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL je obavezan"),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET mora imati minimum 32 karaktera"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL mora biti validan URL"),

  // CSRF Protection
  CSRF_SECRET: z
    .string()
    .min(32, "CSRF_SECRET mora imati minimum 32 karaktera")
    .optional()
    .default(process.env.NEXTAUTH_SECRET || ""), // Fallback to NEXTAUTH_SECRET

  // Upstash Redis (optional - for rate limiting and caching)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry Error Tracking (optional - production recommended)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Email (SMTP) - optional
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Push Notifications (VAPID) - optional
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Client-side env vars (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
});

// Validate server-side env vars
function validateServerEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:");
    console.error(error);
    throw new Error("Invalid environment variables");
  }
}

// Validate client-side env vars
function validateClientEnv() {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("❌ Invalid client environment variables:");
    console.error(error);
    throw new Error("Invalid client environment variables");
  }
}

// Export validated env vars
export const env = validateServerEnv();
export const clientEnv = validateClientEnv();

// Type-safe env vars
export type Env = z.infer<typeof envSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
