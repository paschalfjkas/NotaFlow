"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPricingPackageSchema, updatePricingPackageSchema } from "@/lib/validation/pricing";

export type ActionResult = { error: string } | { success: true };

function revalidatePricingPaths() {
  revalidatePath("/admin/pricing");
  revalidatePath("/dashboard/billing");
  revalidatePath("/");
}

export async function createPricingPackageAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createPricingPackageSchema.safeParse({
    key: formData.get("key"),
    name: formData.get("name"),
    credits: formData.get("credits"),
    priceNaira: formData.get("priceNaira"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("pricing_packages").insert({
    key: parsed.data.key,
    name: parsed.data.name,
    credits: parsed.data.credits,
    price_kobo: Math.round(parsed.data.priceNaira * 100),
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "That key is already in use."
        : "Could not create the package.",
    };
  }

  revalidatePricingPaths();
  return { success: true };
}

export async function updatePricingPackageAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updatePricingPackageSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    credits: formData.get("credits"),
    priceNaira: formData.get("priceNaira"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("pricing_packages")
    .update({
      name: parsed.data.name,
      credits: parsed.data.credits,
      price_kobo: Math.round(parsed.data.priceNaira * 100),
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", parsed.data.id);

  if (error) return { error: "Could not update the package." };

  revalidatePricingPaths();
  return { success: true };
}

export async function togglePricingPackageActiveAction(
  id: string,
  active: boolean
): Promise<ActionResult> {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin.from("pricing_packages").update({ active }).eq("id", id);
  if (error) return { error: "Could not update the package." };

  revalidatePricingPaths();
  return { success: true };
}
