import { expect, test } from "@playwright/test";

test("live market panel opens at #panel", async ({ page }) => {
  await page.goto("/#panel");
  await expect(page.getByText("Cohort Master · powered by Grok Bot")).toBeVisible();
  const empty = page.getByRole("heading", { name: /Waiting for Cohort Master/ });
  const kpi = page.getByText("Market-weighted score");
  await expect(empty.or(kpi)).toBeVisible();
});
