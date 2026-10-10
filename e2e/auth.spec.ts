import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Authentication", () => {
  test("signup form submits and asks the student to confirm their email", async ({ page }) => {
    // Supabase's public signUp validates the email more strictly than the
    // admin API used in global-setup.ts — it checks the domain has real MX
    // records, so both RFC 2606 "reserved" TLDs (.test) and made-up domains
    // get rejected. gmail.com always resolves; the specific mailbox doesn't
    // need to exist for this check (and nothing here ever reads an inbox).
    const uniqueEmail = `notaflow.e2e.signup.${Date.now()}@gmail.com`;

    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E Signup Test");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill("a-secure-test-password-1");
    await page.getByRole("button", { name: "Create my free account" }).click();

    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });

  test("an existing student can log in and out", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await page.waitForURL("**/login");
  });
});
