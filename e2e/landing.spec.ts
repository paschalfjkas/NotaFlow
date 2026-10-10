import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows the hero, nav, and pricing without being signed in", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Generate Your SIWES Report/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Generate My Report" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.getByRole("link", { name: "Pricing" }).first().click();
    await expect(page.getByRole("heading", { name: "Simple, student-friendly pricing" })).toBeVisible();
  });

  test("dark mode toggle switches the theme", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");

    await expect(html).not.toHaveClass(/dark/);
    // Both the desktop and mobile nav render their own ThemeToggle (one is
    // display:none at any given viewport) — scope to the visible one rather
    // than relying on DOM order.
    await page.locator('button[aria-label="Toggle dark mode"]:visible').first().click();
    await expect(html).toHaveClass(/dark/);
  });
});
