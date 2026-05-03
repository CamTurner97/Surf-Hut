import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/routes/**/*.ts"],
      exclude: [
        "src/scripts/**",
        "src/lib/logger.ts",
        "src/lib/beaches-data.ts",
        "src/routes/index.ts",
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      reporter: ["text", "text-summary"],
    },
  },
});
