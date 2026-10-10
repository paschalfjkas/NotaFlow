import { describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  InsufficientCreditsError,
  addPaidCredits,
  consumeReportCredit,
  getCreditBalance,
  refundReportCredit,
} from "@/lib/credits";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

function mockRpcClient(result: { data?: unknown; error?: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>);
  return rpc;
}

describe("consumeReportCredit", () => {
  it("returns the credit source the row-locked RPC reports (free vs paid)", async () => {
    const rpc = mockRpcClient({ data: "free", error: null });

    const result = await consumeReportCredit("user_1");

    expect(result).toBe("free");
    expect(rpc).toHaveBeenCalledWith("consume_report_credit", { p_user_id: "user_1" });
  });

  it("throws InsufficientCreditsError when the RPC reports no credits left", async () => {
    mockRpcClient({ data: null, error: { message: "insufficient_credits" } });

    await expect(consumeReportCredit("user_1")).rejects.toBeInstanceOf(InsufficientCreditsError);
  });

  it("rethrows any other database error unchanged (does not mask it as insufficient credits)", async () => {
    mockRpcClient({ data: null, error: { message: "connection reset" } });

    await expect(consumeReportCredit("user_1")).rejects.not.toBeInstanceOf(InsufficientCreditsError);
  });
});

describe("refundReportCredit", () => {
  it("calls refund_report_credit with the user and the exact source that was debited", async () => {
    const rpc = mockRpcClient({ error: null });

    await refundReportCredit("user_1", "paid");

    expect(rpc).toHaveBeenCalledWith("refund_report_credit", { p_user_id: "user_1", p_source: "paid" });
  });

  it("is best-effort — it does not throw even if the refund RPC errors", async () => {
    mockRpcClient({ error: { message: "boom" } });

    await expect(refundReportCredit("user_1", "free")).resolves.toBeUndefined();
  });
});

describe("addPaidCredits", () => {
  it("calls add_paid_credits with the user and credit count (Paystack fulfillment + admin grants)", async () => {
    const rpc = mockRpcClient({ error: null });

    await addPaidCredits("user_1", 5);

    expect(rpc).toHaveBeenCalledWith("add_paid_credits", { p_user_id: "user_1", p_credits: 5 });
  });

  it("throws when the RPC errors, unlike the best-effort refund path", async () => {
    mockRpcClient({ error: { message: "db down" } });

    await expect(addPaidCredits("user_1", 5)).rejects.toBeTruthy();
  });
});

describe("getCreditBalance", () => {
  it("returns the free/paid credit counts for the user", async () => {
    const single = vi.fn().mockResolvedValue({ data: { free_credits: 1, paid_credits: 3 }, error: null });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({ select })),
    } as unknown as ReturnType<typeof createAdminClient>);

    const result = await getCreditBalance("user_1");

    expect(result).toEqual({ free_credits: 1, paid_credits: 3 });
    expect(eq).toHaveBeenCalledWith("user_id", "user_1");
  });

  it("throws when the lookup errors", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({ select })),
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(getCreditBalance("user_1")).rejects.toBeTruthy();
  });
});
