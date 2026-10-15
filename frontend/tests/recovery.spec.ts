import { test, expect } from "@playwright/test";

test("a missing worker after server restart unlocks the workspace", async ({
  page,
}) => {
  await page.goto("/selector");
  await page.locator("#data-input").fill("5, 2, 3");
  await page
    .getByRole("button", { name: "Analyze input", exact: true })
    .click();
  await expect(page.locator(".winner-title h2")).toBeVisible();
  await page.getByRole("link", { name: "Benchmark lab", exact: true }).click();
  await expect(page.getByText("Engine connected")).toBeVisible();
  // Deliberate transport fault injection, separate from the real benchmark journeys.
  await page.route("**/api/sorting/benchmark", (route) =>
    route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ job_id: "lost-after-restart" }),
    }),
  );
  await page.route("**/api/jobs/lost-after-restart", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Job not found; the server may have restarted.",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Run benchmark", exact: true })
    .click();
  await expect(page.locator(".error-banner")).toContainText(
    "server may have restarted",
  );
  await expect(
    page.getByRole("button", { name: "Run again", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("link", { name: "Algorithm studio", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Analyze input", exact: true }),
  ).toBeEnabled();
});
