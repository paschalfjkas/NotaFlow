import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const { generateTransferReference, isPaymentSettingsConfigured } = await import(
  "@/lib/payments/bank-transfer"
);

describe("generateTransferReference", () => {
  it("produces a short, uppercase reference safe to type into a bank app", () => {
    const reference = generateTransferReference();
    expect(reference).toMatch(/^NF-[0-9A-F]{8}$/);
  });

  it("doesn't repeat the same reference across calls", () => {
    const a = generateTransferReference();
    const b = generateTransferReference();
    expect(a).not.toBe(b);
  });
});

describe("isPaymentSettingsConfigured", () => {
  it("is false when there are no settings yet", () => {
    expect(isPaymentSettingsConfigured(null)).toBe(false);
  });

  it("is false when the account number is still blank", () => {
    expect(
      isPaymentSettingsConfigured({
        bank_name: "GTBank",
        account_number: "",
        account_name: "NotaFlow",
        instructions: "",
      })
    ).toBe(false);
  });

  it("is true once bank name, account number, and account name are all set", () => {
    expect(
      isPaymentSettingsConfigured({
        bank_name: "GTBank",
        account_number: "0123456789",
        account_name: "NotaFlow",
        instructions: "",
      })
    ).toBe(true);
  });
});
