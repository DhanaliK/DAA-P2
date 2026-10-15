import { test, expect } from "@playwright/test";
test("no synthetic requests or controls; pasted drafts and invalid cells are explicit", async ({
  page,
}) => {
  const calls: string[] = [];
  page.on("request", (r) => calls.push(r.url()));
  await page.goto("/selector");
  await expect(page.getByText("Engine connected")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyze input", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".winner-title h2")).toHaveCount(0);
  expect(calls.some((u) => u.includes("/generate"))).toBe(false);
  await expect(
    page.getByRole("button", { name: "Generate dataset", exact: true }),
  ).toHaveCount(0);
  await page.locator("#data-input").fill("3\t1\n2\t4");
  await expect(page.locator(".parse-preview code")).toHaveText("[3, 1, 2, 4]");
  await page
    .getByRole("button", { name: "Analyze input", exact: true })
    .click();
  await expect(page.locator(".winner-title h2")).toBeVisible();
  await page.locator("#data-input").fill("8, bad, 9");
  await expect(page.locator(".parse-preview")).toContainText(
    "Check your input",
  );
  await expect(
    page.getByRole("button", { name: "Analyze input", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".visualizer")).toHaveCount(0);
  await page.getByRole("link", { name: "Benchmark lab", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Run benchmark", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("link", { name: "Return to Algorithm studio", exact: true })
    .click();
  await expect(page.locator("#data-input")).toHaveValue("8, bad, 9");
});
test("extension attributes, graph zoom and short sidebar remain clean", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (m) => {
    if (["warning", "error"].includes(m.type())) warnings.push(m.text());
  });
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.body) {
        document.body.setAttribute(
          "data-scholarcy-content-script-executed",
          "1",
        );
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.setViewportSize({ width: 1200, height: 460 });
  await page.goto("/graph");
  await expect(page.getByText("Engine connected")).toBeVisible();
  await expect(page.locator(".graph-canvas canvas").first()).toBeVisible();
  await expect(page.locator("aside")).not.toContainText("DAA");
  const history = page.getByRole("link", {
    name: "Experiment history",
    exact: true,
  });
  await history.scrollIntoViewIfNeeded();
  const box = await history.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(460);
  expect(warnings.filter((m) => /hydrat|wheel sensitivity/i.test(m))).toEqual(
    [],
  );
});
test("large inputs are never silently sampled for playback", async ({
  page,
}) => {
  await page.goto("/selector");
  await page
    .locator("#data-input")
    .fill(Array.from({ length: 81 }, (_, i) => i).join(","));
  await page
    .getByRole("button", { name: "Analyze input", exact: true })
    .click();
  await expect(page.locator(".trace-unavailable")).toContainText("1–80 values");
  await expect(page.locator(".input-receipt")).toContainText("81 integers");
});
