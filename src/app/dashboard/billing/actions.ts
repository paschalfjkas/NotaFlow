"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, PaystackError } from "@/lib/payments/paystack";
import { getServerEnv, isPaystackConfigured } from "@/lib/env";

export type CheckoutResult = { url: string } | { error: string };

export async function initiateCheckoutAction(packageKey: string): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Your session has expired." };

  const env = getServerEnv();
  if (!isPaystackConfigured(env)) {
    return { error: "Payments are not configured yet." };
  }

  const { data: pkg } = await supabase
    .from("pricing_packages")
    .select("key, credits, price_kobo, currency")
    .eq("key", packageKey)
    .eq("active", true)
    .maybeSingle();

  if (!pkg) return { error: "That package is no longer available." };

  const reference = `notaflow_${randomUUID()}`;
  const admin = createAdminClient();

  const { error: insertError } = await admin.from("transactions").insert({
    user_id: user.id,
    reference,
    package_key: pkg.key,
    amount_kobo: pkg.price_kobo,
    currency: pkg.currency,
    status: "pending",
    credits: pkg.credits,
  });

  if (insertError) return { error: "Could not start checkout. Please try again." };

  try {
    const { authorizationUrl } = await initializeTransaction({
      email: user.email,
      amountKobo: pkg.price_kobo,
      reference,
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing/callback`,
      metadata: { user_id: user.id, package_key: pkg.key },
    });
    return { url: authorizationUrl };
  } catch (error) {
    await admin.from("transactions").update({ status: "failed" }).eq("reference", reference);
    return {
      error:
        error instanceof PaystackError
          ? error.message
          : "Could not start checkout. Please try again.",
    };
  }
}
