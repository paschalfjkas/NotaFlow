import { z } from "zod";

export const createPricingPackageSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Key is too short")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only"),
  name: z.string().trim().min(2, "Enter a name"),
  credits: z.coerce.number().int().min(1, "Must be at least 1"),
  priceNaira: z.coerce.number().min(1, "Must be at least ₦1"),
  sortOrder: z.coerce.number().int().default(0),
});
export type CreatePricingPackageInput = z.infer<typeof createPricingPackageSchema>;

export const updatePricingPackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Enter a name"),
  credits: z.coerce.number().int().min(1, "Must be at least 1"),
  priceNaira: z.coerce.number().min(1, "Must be at least ₦1"),
  sortOrder: z.coerce.number().int().default(0),
});
export type UpdatePricingPackageInput = z.infer<typeof updatePricingPackageSchema>;
