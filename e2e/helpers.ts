import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/** Logs in as the dedicated e2e test account (see global-setup.ts) and waits for the dashboard. */
export async function login(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_TEST_EMAIL/E2E_TEST_PASSWORD are not set — check .env.local.");
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

/**
 * Reads the e2e test account's total credits straight from the database.
 * The dashboard UI only ever displays ONE bucket (free OR paid, whichever is
 * non-zero — see CreditCard), so scraping its text can't reliably detect a
 * purchase if the free credit hasn't been consumed yet; this is what the
 * app actually persists, independent of test ordering/display logic.
 */
export async function getTotalCreditsFromDb(): Promise<number> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", process.env.E2E_TEST_EMAIL!)
    .single();

  const { data: credits } = await admin
    .from("credits")
    .select("free_credits, paid_credits")
    .eq("user_id", profile!.id)
    .single();

  return (credits?.free_credits ?? 0) + (credits?.paid_credits ?? 0);
}
