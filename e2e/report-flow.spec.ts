import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("full flow: wizard -> real AI generation -> download", async ({ page }) => {
  // AI generation is the real Gemini API, sequential with 429-backoff retries
  // across ~7 calls (preliminary + 5 chapters + QC) — give it real room.
  test.setTimeout(8 * 60 * 1000);

  await login(page);
  await page.getByRole("link", { name: "Start New Report" }).click();
  await page.waitForURL(/\/generate\/[0-9a-f-]{36}\//);
  const reportId = new URL(page.url()).pathname.split("/")[2];

  // --- Step 1: Personal --- (navigate directly so the test is deterministic
  // regardless of which step a previous run's draft was left on)
  await page.goto(`/generate/${reportId}/personal`);
  await page.getByLabel("Full Name").fill("E2E Test Student");
  await page.getByLabel("Matriculation Number").fill("190401234");
  await page.getByLabel("University").fill("University of Lagos");
  await page.getByLabel("Faculty / School").fill("Faculty of Science");
  await page.getByLabel("Department").fill("Computer Science");
  await page.getByLabel("Programme").fill("B.Sc. Computer Science");
  await page.getByLabel("Academic Session").fill("2025/2026");
  await page.getByLabel("Expected Graduation Year").fill("2027");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`**/generate/${reportId}/siwes`);

  // --- Step 2: SIWES ---
  await page.getByLabel("Company / Organisation").fill("LearnBlit Technologies");
  await page.getByLabel("Company Address").fill("12 Allen Avenue, Ikeja, Lagos");
  await page.getByLabel("Duration").fill("6 months");
  await page.getByLabel("Department / Team").fill("Software Engineering");
  await page.getByLabel("Industrial Supervisor").fill("Mrs. Adaeze Nwosu");
  await page.getByLabel("Institutional Supervisor").fill("Dr. Bello");
  await page.getByLabel("Head of Department").fill("Prof. Okonkwo");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`**/generate/${reportId}/company`);

  // --- Step 3: Company (mark unknown — exercises the anti-fabrication path) ---
  await page.getByLabel("Don't know this information?").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`**/generate/${reportId}/experience`);

  // --- Step 4: Experience ---
  await page.getByRole("button", { name: "Add another project" }).click();
  await page.getByLabel("Project Name").fill("Internal Dashboard Revamp");
  await page
    .getByLabel("What did you do?")
    .fill("Rebuilt the internal analytics dashboard used by the operations team.");
  await page.getByLabel("Technologies Used").fill("React, Node.js, PostgreSQL");
  await page.getByLabel("Your Role").fill("Frontend developer");
  await page
    .getByLabel("What did you learn?")
    .fill("How to structure a large React codebase and work with a production database.");
  await page.getByRole("button", { name: "Software development" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`**/generate/${reportId}/technologies`);

  // --- Step 5: Technologies ---
  await page.getByRole("button", { name: "React", exact: true }).click();
  await page.getByRole("button", { name: "Node.js", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`**/generate/${reportId}/challenges`);

  // --- Step 6: Challenges ---
  await page
    .getByLabel("What was your biggest challenge?")
    .fill("Debugging an intermittent race condition in the dashboard's data-fetching logic.");
  await page
    .getByLabel("How did you solve it?")
    .fill("Added proper request cancellation and reviewed the pattern with a senior engineer.");
  await page.getByRole("button", { name: "Problem solving" }).click();
  await page
    .getByLabel("What was the most important thing you learned?")
    .fill("How to debug concurrency issues methodically instead of guessing.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`**/generate/${reportId}/preferences`);

  // --- Step 7: Preferences (defaults are already valid) ---
  await page.getByRole("button", { name: "Review" }).click();
  await page.waitForURL(`**/generate/${reportId}/review`);

  // --- Generate: real call to the configured AI provider ---
  await page.getByRole("button", { name: "Generate My Report" }).click();
  // Confirms the click actually registered and generation started, rather
  // than silently no-op-ing — distinguishes "it's just slow" from "it never
  // started" if the final redirect wait below times out.
  await expect(page.getByText("Creating your SIWES report")).toBeVisible({ timeout: 10_000 });
  await page.waitForURL(`**/report/${reportId}`, { timeout: 7 * 60 * 1000 });

  // --- Report editor loaded with real generated content ---
  await expect(page.getByRole("heading", { name: "Your SIWES Report" })).toBeVisible();
  await expect(page.getByText("Certification")).toBeVisible();

  // --- Download the real .docx ---
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .docx" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.docx$/);
});
