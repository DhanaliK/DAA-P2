import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page, data: string) {
  await page.goto("/selector");
  await page.locator("#data-input").fill(data);
  await page
    .getByRole("button", { name: "Analyze input", exact: true })
    .click();
  await expect(page.locator(".winner-title h2")).toBeVisible();
}

test("own sorting data: playback controls, verified benchmark and saved history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page, "38, 12, 71, 5, 24, 12");
  await expect(
    page.getByRole("button", { name: "Play animation", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Visualize algorithm").selectOption("insertion");
  await expect(page.locator(".trace-position")).toContainText("Step 1 /");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator(".trace-explanation")).toContainText("Hold 12");
  await page
    .getByRole("button", { name: "Previous step", exact: true })
    .click();
  await expect(page.locator(".trace-position")).toContainText("Step 1 /");
  await page.getByLabel("Playback speed").selectOption("200");
  await page
    .getByRole("button", { name: "Play animation", exact: true })
    .click();
  await expect(page.locator(".trace-position")).not.toContainText("Step 1 /");
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  await page.getByRole("slider", { name: "Jump to a step" }).press("End");
  await expect(page.locator(".trace-footer")).toContainText(
    "Completed output verified",
  );
  await expect(page.locator(".trace-value")).toHaveText([
    "5",
    "12",
    "12",
    "24",
    "38",
    "71",
  ]);
  await page.getByRole("button", { name: "Restart animation" }).click();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page
    .locator(".visualizer")
    .screenshot({ path: "../docs/visual-sorting.png" });
  await page.getByRole("link", { name: "Benchmark lab", exact: true }).click();
  await page
    .getByRole("button", { name: "Run benchmark", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Run again", exact: true }),
  ).toBeEnabled({ timeout: 65000 });
  await expect(page.locator(".results-table .badge-green")).toHaveCount(6);
  await page
    .getByRole("link", { name: "Experiment history", exact: true })
    .click();
  await expect(page.locator(".history-table tbody tr").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("uploaded input and search targets visualize binary preprocessing and missing values", async ({
  page,
}) => {
  await page.goto("/selector");
  await page.getByRole("button", { name: "Searching 03" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "numbers.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("9, 1, 7, 4"),
  });
  await page.getByLabel("Numbers to search for").fill("7, 99");
  await page
    .getByRole("button", { name: "Analyze input", exact: true })
    .click();
  await expect(
    page.locator(".rank-item").filter({ hasText: "Binary Search" }),
  ).toContainText("Not applicable");
  await page
    .getByLabel("Allow sorting before Binary Search (included in timing)")
    .check();
  await page.getByLabel("Visualize algorithm").selectOption("binary");
  await expect(
    page.getByRole("button", { name: "Play animation", exact: true }),
  ).toBeVisible();
  await page.getByRole("slider", { name: "Jump to a step" }).press("End");
  await expect(page.locator(".trace-query-results")).toContainText(/7\s+Found/);
  await expect(page.locator(".trace-query-results")).toContainText(
    /99\s+Not found/,
  );
  await page
    .locator(".visualizer")
    .screenshot({ path: "../docs/visual-search.png" });
});

test("uploaded graph visualizes relaxation, traversal, negative edges and all-pairs", async ({
  page,
}) => {
  await page.goto("/graph");
  await expect(page.locator(".winner-title h2")).toHaveCount(0);
  await page.locator('input[type="file"]').setInputFiles({
    name: "edges.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("source,target,weight\nA,B,4\nA,C,1\nC,B,1"),
  });
  await expect(page.locator(".winner-title h2")).toHaveText("Dijkstra");
  await expect(page.locator(".trace-graph")).toBeVisible();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator(".trace-node.current")).toHaveCount(1);
  await page.getByRole("slider", { name: "Jump to a step" }).press("End");
  await expect(page.locator(".trace-footer")).toContainText(
    "Completed output verified",
  );
  await page
    .locator(".visualizer")
    .screenshot({ path: "../docs/visual-graph.png" });
  await page.getByLabel("Graph task").selectOption("traversal");
  await page.getByLabel("Visualize algorithm").selectOption("dfs");
  await expect(
    page.getByRole("button", { name: "Play animation", exact: true }),
  ).toBeVisible();
  await page.getByRole("slider", { name: "Jump to a step" }).press("End");
  await expect(page.locator(".trace-node.visited")).toHaveCount(3);
  await page.getByRole("button", { name: "Edit / upload graph" }).click();
  await page
    .getByLabel("Edge list · source,target,weight")
    .fill("A,B,4\nA,C,1\nC,B,-2");
  await expect(page.locator(".visualizer")).toHaveCount(0);
  await page.getByRole("button", { name: "Apply graph", exact: true }).click();
  await page.getByLabel("Graph task").selectOption("single-source");
  await expect(page.locator(".winner-title h2")).toHaveText("Bellman–Ford");
  await page.getByLabel("Graph task").selectOption("all-pairs");
  await expect(
    page.getByRole("button", { name: "Play animation", exact: true }),
  ).toBeVisible();
  await page.getByRole("slider", { name: "Jump to a step" }).press("End");
  await expect(page.locator(".trace-matrix")).toBeVisible();
});

test("complexity measures prefixes of submitted data", async ({ page }) => {
  const values = "20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1";
  await enter(page, values);
  await page.getByRole("link", { name: "Complexity lab", exact: true }).click();
  const request = page.waitForRequest(
    (r) =>
      r.url().endsWith("/api/complexity/empirical") && r.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Run experiment", exact: true })
    .click();
  const payload = (await request).postDataJSON();
  expect(payload.data).toEqual(values.split(",").map(Number));
  expect(payload.sizes).toEqual([4, 8, 12, 16, 20]);
  expect(payload.kind).toBeUndefined();
  await expect(page.locator(".empirical-chart .recharts-line-dot")).toHaveCount(
    5,
    { timeout: 65000 },
  );
});

test("all pages and animation controls fit mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/selector",
    "/complexity",
    "/benchmark",
    "/graph",
    "/explainability",
    "/history",
  ]) {
    await page.goto(route);
    await expect(page.getByText("Engine connected")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      route,
    ).toBeLessThanOrEqual(391);
  }
  await enter(page, "3, 1, 2");
  await expect(
    page.getByRole("button", { name: "Play animation", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(391);
  await page
    .locator(".visualizer")
    .screenshot({ path: "../docs/visual-mobile.png" });
});
