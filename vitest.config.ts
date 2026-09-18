import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration: mirrors the TypeScript path alias ("@/*" →
 * "src/*") used by Next.js so tests can import application modules
 * the same way the app does. Dev-only file — no production impact.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
