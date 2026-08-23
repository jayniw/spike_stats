import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["tests/setup.ts"],
          include: [
            "tests/unit/**/*.test.{ts,tsx}",
            "lib/**/*.test.{ts,tsx}",
            "components/**/*.test.{ts,tsx}",
          ],
        },
      },
      {
        test: {
          name: "contract",
          environment: "node",
          testTimeout: 30_000,
          include: ["tests/contract/**/*.spec.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          testTimeout: 60_000,
          include: ["tests/integration/**/*.spec.ts"],
        },
      },
    ],
  },
});
