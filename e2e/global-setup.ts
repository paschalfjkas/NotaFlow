import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MIN_CREDITS = 10;

/**
 * Ensures the dedicated e2e test account exists, is email-confirmed, and has
 * enough paid credits to run the full report-generation flow repeatedly.
 * Runs once before the whole suite (see playwright.config.ts's globalSetup).
 *
 * Provisioned directly via the Supabase admin API rather than through the
 * real signup form: a fresh signup needs email confirmation (no inbox to
 * automate), and Google OAuth can't be driven by a script at all.
 */
export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!url || !serviceKey || !email || !password) {
    throw new Error(
      "Missing Supabase or E2E_TEST_* env vars — check .env.local before running the e2e suite."
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let userId = existing?.id;

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "E2E Test Student" },
    });
    if (error) throw new Error(`Could not create the e2e test user: ${error.message}`);
    userId = created.user.id;
  }

  // Top up credits so repeated runs (each generation consumes one) never
  // hit InsufficientCreditsError.
  const { data: credits } = await admin
    .from("credits")
    .select("free_credits, paid_credits")
    .eq("user_id", userId)
    .maybeSingle();

  const total = (credits?.free_credits ?? 0) + (credits?.paid_credits ?? 0);
  if (total < MIN_CREDITS) {
    const { error } = await admin.rpc("add_paid_credits", {
      p_user_id: userId,
      p_credits: MIN_CREDITS,
    });
    if (error) throw new Error(`Could not top up e2e test credits: ${error.message}`);
  }
}
