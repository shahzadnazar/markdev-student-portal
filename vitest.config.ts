import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit tests for the logic that decides what a student is told and whether
 * they can submit. Node environment only — no DOM: what is worth pinning here
 * is the arithmetic and the date wording, and layout is checked in a browser.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
