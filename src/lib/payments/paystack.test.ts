import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ PAYSTACK_SECRET_KEY: "test_secret_key" }),
}));

const { verifyWebhookSignature } = await import("@/lib/payments/paystack");

const SECRET = "test_secret_key";
const BODY = JSON.stringify({ event: "charge.success", data: { reference: "ref_1" } });

function signWith(secret: string, body: string) {
  return createHmac("sha512", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a signature computed with the correct secret over the exact body", () => {
    expect(verifyWebhookSignature(BODY, signWith(SECRET, BODY))).toBe(true);
  });

  it("rejects a signature computed with the wrong secret", () => {
    expect(verifyWebhookSignature(BODY, signWith("wrong_secret", BODY))).toBe(false);
  });

  it("rejects a valid signature replayed against a tampered body", () => {
    const tampered = JSON.stringify({ event: "charge.success", data: { reference: "ref_2" } });
    expect(verifyWebhookSignature(tampered, signWith(SECRET, BODY))).toBe(false);
  });

  it("rejects when the signature header is missing", () => {
    expect(verifyWebhookSignature(BODY, null)).toBe(false);
  });

  it("rejects a malformed/short signature without throwing", () => {
    expect(() => verifyWebhookSignature(BODY, "short")).not.toThrow();
    expect(verifyWebhookSignature(BODY, "short")).toBe(false);
  });
});
