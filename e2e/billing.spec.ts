import { expect, test } from "@playwright/test";
import { getTotalCreditsFromDb, login } from "./helpers";

test("buying a credit package completes and actually credits the account", async ({ page }) => {
  await login(page);
  const creditsBefore = await getTotalCreditsFromDb();

  await page.goto("/dashboard/billing");
  await page.getByRole("button", { name: "Buy Now" }).first().click();

  // E2E_MOCK_PAYSTACK (see playwright.config.ts / src/lib/payments/paystack.ts)
  // short-circuits the real Paystack redirect straight back to our own
  // callback URL — everything from here on (verifying + crediting) is real.
  await page.waitForURL("**/dashboard/billing/callback**");
  await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();

  const creditsAfter = await getTotalCreditsFromDb();
  expect(creditsAfter).toBeGreaterThan(creditsBefore);
});
