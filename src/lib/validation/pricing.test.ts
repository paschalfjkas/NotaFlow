import { describe, expect, it } from "vitest";
import { createPricingPackageSchema, updatePricingPackageSchema } from "@/lib/validation/pricing";

describe("createPricingPackageSchema", () => {
  it("accepts a valid package submission from FormData-style string values", () => {
    const result = createPricingPackageSchema.safeParse({
      key: "ten_pack",
      name: "10 Reports",
      credits: "10",
      priceNaira: "13000",
      sortOrder: "0",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ key: "ten_pack", name: "10 Reports", credits: 10, priceNaira: 13000, sortOrder: 0 });
    }
  });

  it("rejects a key with spaces or uppercase letters", () => {
    expect(createPricingPackageSchema.safeParse({ key: "Ten Pack", name: "x", credits: "1", priceNaira: "1" }).success).toBe(false);
  });

  it("rejects a key that is too short", () => {
    expect(createPricingPackageSchema.safeParse({ key: "a", name: "x", credits: "1", priceNaira: "1" }).success).toBe(false);
  });

  it("rejects zero or negative credits", () => {
    expect(createPricingPackageSchema.safeParse({ key: "pack", name: "x", credits: "0", priceNaira: "1" }).success).toBe(false);
  });

  it("rejects a non-integer credits value", () => {
    expect(createPricingPackageSchema.safeParse({ key: "pack", name: "x", credits: "2.5", priceNaira: "1" }).success).toBe(false);
  });

  it("rejects zero or negative price", () => {
    expect(createPricingPackageSchema.safeParse({ key: "pack", name: "x", credits: "1", priceNaira: "0" }).success).toBe(false);
  });

  it("defaults sortOrder to 0 when omitted", () => {
    const result = createPricingPackageSchema.safeParse({ key: "pack", name: "Pack", credits: "1", priceNaira: "1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortOrder).toBe(0);
  });
});

describe("updatePricingPackageSchema", () => {
  it("requires a valid uuid id", () => {
    expect(
      updatePricingPackageSchema.safeParse({ id: "not-a-uuid", name: "x", credits: "1", priceNaira: "1" }).success
    ).toBe(false);
  });

  it("accepts a valid update payload", () => {
    const result = updatePricingPackageSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "5 Reports",
      credits: "5",
      priceNaira: "7500",
      sortOrder: "2",
    });
    expect(result.success).toBe(true);
  });
});
