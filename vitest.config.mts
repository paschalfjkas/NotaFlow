import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // The real "server-only" package throws unconditionally outside
      // Next's RSC bundler (see src/test/empty-module.ts) — swap it for a
      // no-op so modules marked server-only can still be unit tested.
      "server-only": path.resolve(import.meta.dirname, "src/test/empty-module.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
