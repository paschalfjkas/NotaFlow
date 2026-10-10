import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export class PaystackError extends Error {}

type InitializeTransactionResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

/** Starts a Paystack transaction server-side and returns the URL to redirect the student to. */
export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<InitializeTransactionResult> {
  // Test seam for the e2e suite only (playwright.config.ts sets this on the
  // server it spawns) — skips the real third-party redirect so Playwright
  // doesn't depend on checkout.paystack.com's UI staying stable, while
  // everything downstream (the pending transaction row, fulfillTransaction,
  // real crediting) still runs for real. Never set outside e2e runs.
  if (process.env.E2E_MOCK_PAYSTACK === "true") {
    return {
      authorizationUrl: `${params.callbackUrl}?reference=${encodeURIComponent(params.reference)}`,
      accessCode: "e2e-mock-access-code",
      reference: params.reference,
    };
  }

  const env = getServerEnv();
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new PaystackError("Payments are not configured yet.");
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: "NGN",
      metadata: params.metadata,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new PaystackError(json.message ?? "Could not start the Paystack checkout.");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export type VerifiedTransaction = {
  status: string;
  reference: string;
  amountKobo: number;
  raw: Record<string, unknown>;
};

/** Confirms a transaction's real status directly with Paystack (never trust the client redirect alone). */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  // See the matching note in initializeTransaction() — e2e-only test seam.
  if (process.env.E2E_MOCK_PAYSTACK === "true") {
    return { status: "success", reference, amountKobo: 0, raw: { mocked: true, reference } };
  }

  const env = getServerEnv();
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new PaystackError("Payments are not configured yet.");
  }

  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } }
  );

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new PaystackError(json.message ?? "Could not verify this transaction.");
  }

  return {
    status: json.data.status,
    reference: json.data.reference,
    amountKobo: json.data.amount,
    raw: json.data,
  };
}

/**
 * Confirms a webhook request really came from Paystack: the `x-paystack-signature`
 * header must equal an HMAC-SHA512 of the raw request body, keyed with our
 * secret key (https://paystack.com/docs/payments/webhooks/#verifying-events).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const env = getServerEnv();
  if (!env.PAYSTACK_SECRET_KEY || !signature) return false;

  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
