import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Loaded here (not just in global-setup.ts) so it's also available inside
// individual test files' own Node process — e.g. e2e/helpers.ts's direct
// Supabase admin lookups.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  // All specs share one e2e account's credit balance and draft report rows —
  // force a single worker so tests never race each other against that state.
  workers: 1,
  // This sandbox's network to Supabase is occasionally slow/flaky (seen
  // independent of this suite — direct one-off scripts hit the same
  // intermittent "fetch failed" a few times this session); one retry absorbs
  // that without masking a real, reproducible bug (which would fail twice).
  retries: 1,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Uses the system-installed Chrome rather than Playwright's own bundled
  // Chromium — avoids a ~200MB browser download in environments where that's
  // slow/unavailable. Swap to the default `chromium` project (no `channel`)
  // if you'd rather have Playwright manage its own pinned browser build.
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // Always start a fresh server so E2E_MOCK_PAYSTACK is guaranteed active —
    // reusing a server started without it would silently redirect to the
    // real Paystack checkout mid-suite.
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      // Test seam read by src/lib/payments/paystack.ts — never set this
      // outside the e2e suite.
      E2E_MOCK_PAYSTACK: "true",
    },
  },
});
