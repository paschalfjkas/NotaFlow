import { describe, expect, it } from "vitest";
import { formatKobo } from "@/lib/payments/format";

describe("formatKobo", () => {
  it("formats a kobo amount as whole-naira currency", () => {
    expect(formatKobo(200000)).toBe("₦2,000");
  });

  it("formats a larger amount with thousands separators", () => {
    expect(formatKobo(750000)).toBe("₦7,500");
  });

  it("formats zero", () => {
    expect(formatKobo(0)).toBe("₦0");
  });

  it("drops fractional kobo rather than showing decimals", () => {
    expect(formatKobo(150050)).toBe("₦1,501");
  });
});
