#!/usr/bin/env node
// Admin role management — the only way to grant/revoke admin access, by
// design (see "Admin dashboard" in README.md). No self-serve UI promotion
// path exists, so this still requires possessing SUPABASE_SERVICE_ROLE_KEY —
// the same trust boundary as using the Supabase SQL Editor directly. This
// just adds validation (does the user actually exist?) and confirmation
// output that a raw `update` statement doesn't give you.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

function usage() {
  console.error(
    [
      "Usage:",
      "  node scripts/manage-admin.mjs promote <email>",
      "  node scripts/manage-admin.mjs revoke <email>",
      "  node scripts/manage-admin.mjs list",
    ].join("\n")
  );
  process.exitCode = 1;
}

// Uses process.exitCode + a plain return instead of process.exit() — calling
// process.exit() while the Supabase client's underlying fetch socket is still
// closing crashes Node on Windows (libuv assertion in src/win/async.c).
// Letting the event loop drain naturally avoids it.
async function main() {
  const [command, email] = process.argv.slice(2);
  if (!command || !["promote", "revoke", "list"].includes(command)) return usage();
  if (command !== "list" && !email) return usage();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check .env.local."
    );
    process.exitCode = 1;
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (command === "list") {
    const { data, error } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .order("email");
    if (error) {
      console.error(`Could not list admins: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    if (!data || data.length === 0) {
      console.log("No admins yet.");
    } else {
      console.log(`${data.length} admin(s):`);
      for (const row of data) console.log(`  - ${row.email} (${row.full_name ?? "no name"})`);
    }
    return;
  }

  const { data: profile, error: lookupError } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error(`Lookup failed: ${lookupError.message}`);
    process.exitCode = 1;
    return;
  }
  if (!profile) {
    console.error(`No profile found for ${email} — check the email is correct and the user has signed up.`);
    process.exitCode = 1;
    return;
  }

  const newRole = command === "promote" ? "admin" : "student";
  if (profile.role === newRole) {
    console.log(`${email} is already ${newRole === "admin" ? "an admin" : "a student"} — nothing to do.`);
    return;
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", profile.id);

  if (updateError) {
    console.error(`Update failed: ${updateError.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `${email} is now ${newRole === "admin" ? "an admin" : "a student"} (was ${profile.role}).`
  );
}

await main();
