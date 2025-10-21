import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./config/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".next/",
        "**/*.config.*",
        "**/*.d.ts",
        "**/types/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../"),
    },
  },
});
