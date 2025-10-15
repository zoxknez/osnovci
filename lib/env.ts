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

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Client-side env vars (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
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
