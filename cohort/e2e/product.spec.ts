import { expect, test } from "@playwright/test";

test("configure a sample study, export its report, and update the overview", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Test your product", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Run sample simulation" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Give your product a name to continue.",
  );
  await dialog.getByLabel("Product name").fill("Launchpad");
  await dialog
    .getByLabel("What are you building?")
    .fill("A product analytics workspace for independent teams.");
  await dialog.getByLabel("Product URL").fill("not-a-url");
  await dialog.getByRole("button", { name: "Run sample simulation" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Use a full product URL",
  );
  await dialog.getByLabel("Product URL").fill("https://example.com");
  await dialog
    .getByLabel("What would you like to learn?")
    .selectOption("Pricing research");
  await dialog.getByLabel("Who is it for?").selectOption("Product teams");
  await dialog.getByRole("button", { name: "96 agents" }).click();
  await dialog.getByRole("button", { name: "Run sample simulation" }).click();
  await expect(
    dialog.getByRole("heading", { name: "A clearer view of Launchpad." }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Clarify what each plan includes", { exact: true }),
  ).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download sample report" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe(
    "cohort-launchpad-demo-report.json",
  );
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  if (!stream) throw new Error("Missing downloaded report stream");
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const report = JSON.parse(Buffer.concat(chunks).toString());
  expect(report.mode).toBe("demo");
  expect(report.config).toMatchObject({
    product: "Launchpad",
    participants: 96,
    objective: "Pricing research",
    audience: "Product teams",
  });
  expect(report.provenance).toContain("No website was fetched");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "View sample study Launchpad — pricing research",
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("workspace navigation exposes sample personas and disconnected data sources", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Demo workspace" });
  await nav.getByRole("button", { name: "Audiences" }).click();
  await expect(
    page.getByText("ILLUSTRATIVE PERSONAS", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No real people have been interviewed or modeled.", {
      exact: false,
    }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Data sources" }).click();
  await expect(page.getByText("NOT CONNECTED", { exact: true })).toHaveCount(3);
  await nav.getByRole("button", { name: "Simulations" }).click();
  await expect(
    page.getByRole("heading", { name: "Recent simulations" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Set up study Next launch concept" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Set up study Next launch concept" }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "View sample study Pricing page clarity" })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Clarify what each plan includes", { exact: true }),
  ).toBeVisible();
});

test("landing page fits target widths and mobile navigation opens the demo", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits, `Horizontal overflow at ${width}px`).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open workspace", exact: true })
    .click();
  await page.getByLabel("Product name").fill("Mobile product");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close workspace" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
