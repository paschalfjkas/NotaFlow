import { describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { addPaidCredits } from "@/lib/credits";
import { fulfillTransaction, markTransactionFailed } from "@/lib/payments/fulfill";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/credits", () => ({ addPaidCredits: vi.fn() }));

type MaybeSingleResult = { data: unknown; error?: unknown };

/**
 * A minimal chainable fake for `admin.from(table).update(x).eq(a,b).eq(c,d).select(e).maybeSingle()`
 * (and the shorter `.select(e).eq(a,b).maybeSingle()` existence-check chain). Every method
 * returns the same object so any call order chains, and `.maybeSingle()` resolves each queued
 * result in sequence — one per `admin.from(...)` call fulfillTransaction makes.
 */
function createAdminClientMock(maybeSingleResults: MaybeSingleResult[]) {
  const maybeSingle = vi.fn();
  for (const result of maybeSingleResults) maybeSingle.mockResolvedValueOnce(result);

  const chain = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle,
  };
  return { from: vi.fn(() => chain) } as unknown as ReturnType<typeof createAdminClient>;
}

describe("fulfillTransaction", () => {
  it("credits the account exactly once when it wins the pending->success transition", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      createAdminClientMock([{ data: { user_id: "user_1", credits: 5 }, error: null }])
    );

    const result = await fulfillTransaction("ref_1", { status: "success" });

    expect(result).toBe("credited");
    expect(addPaidCredits).toHaveBeenCalledTimes(1);
    expect(addPaidCredits).toHaveBeenCalledWith("user_1", 5);
  });

  it("does not credit again when the transaction was already fulfilled (e.g. by the webhook first)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      createAdminClientMock([
        { data: null, error: null }, // update matched no row — already not "pending"
        { data: { id: "txn_1" }, error: null }, // but the row does exist
      ])
    );

    const result = await fulfillTransaction("ref_1", { status: "success" });

    expect(result).toBe("already_processed");
    expect(addPaidCredits).not.toHaveBeenCalled();
  });

  it("reports not_found and never credits for a reference that doesn't exist", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      createAdminClientMock([
        { data: null, error: null },
        { data: null, error: null },
      ])
    );

    const result = await fulfillTransaction("unknown_ref", { status: "success" });

    expect(result).toBe("not_found");
    expect(addPaidCredits).not.toHaveBeenCalled();
  });

  it("throws (and never credits) when the update itself errors", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      createAdminClientMock([{ data: null, error: new Error("db unreachable") }])
    );

    await expect(fulfillTransaction("ref_1", {})).rejects.toThrow("db unreachable");
    expect(addPaidCredits).not.toHaveBeenCalled();
  });
});

describe("markTransactionFailed", () => {
  it("only updates rows that are still pending", async () => {
    const chain = {
      update: vi.fn(() => chain),
      eq: vi.fn(() => chain),
    };
    const from = vi.fn(() => chain);
    vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<typeof createAdminClient>);

    await markTransactionFailed("ref_1", { status: "failed" });

    expect(from).toHaveBeenCalledWith("transactions");
    expect(chain.update).toHaveBeenCalledWith({ status: "failed", provider_raw: { status: "failed" } });
    expect(chain.eq).toHaveBeenCalledWith("reference", "ref_1");
    expect(chain.eq).toHaveBeenCalledWith("status", "pending");
  });
});
