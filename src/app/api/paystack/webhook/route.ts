import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { fulfillTransaction, markTransactionFailed } from "@/lib/payments/fulfill";

type PaystackEvent = {
  event: string;
  data: { reference: string } & Record<string, unknown>;
};

/**
 * Paystack's server-to-server notification — the authoritative way credits
 * get added (the browser callback in /dashboard/billing/callback is only a
 * same-second UX nicety; a student closing the tab before it loads must
 * still get credited). Signature verification needs the exact raw bytes
 * Paystack signed, so this reads request.text() rather than request.json().
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    if (event.event === "charge.success") {
      await fulfillTransaction(event.data.reference, event.data);
    } else if (event.event === "charge.failed") {
      await markTransactionFailed(event.data.reference, event.data);
    }
  } catch (error) {
    console.error("Paystack webhook fulfillment failed", error);
    return NextResponse.json({ error: "fulfillment_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
