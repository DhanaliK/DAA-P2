import { expect, test } from "@playwright/test";
import { parseInputData } from "../lib/parse-data";

test("text parsing preserves quoted phrases, escaped quotes, Unicode and leading zeros", () => {
  expect(parseInputData('apple, "New York", 0012\n"a""b"\t😀', "text")).toEqual(
    ["apple", "New York", "0012", 'a"b', "😀"],
  );
  expect(parseInputData('["0012", "A10", "A2"]', "text")).toEqual([
    "0012",
    "A10",
    "A2",
  ]);
  expect(parseInputData("3\t-1\n2,3", "number")).toEqual([3, -1, 2, 3]);
  for (const invalid of [
    "a,,b",
    "a,",
    '"unfinished',
    '"a"b',
    '["a", 2]',
    '""',
    '"   "',
  ])
    expect(() => parseInputData(invalid, "text"), invalid).toThrow();
});

test("manual keyboard entry submits integers and alphanumerics, visualizes and benchmarks", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/selector");
  await page.locator("#data-input").pressSequentially("3, -1, 2");
  await page.locator("#data-input").press("Control+Enter");
  await expect(page.locator(".winner-title h2")).toBeVisible();
  await expect(page.locator(".input-receipt")).toContainText("3 integers");
  await page
    .getByRole("combobox", { name: "Input type", exact: true })
    .selectOption("text");
  await page.locator("#data-input").fill("");
  await page
    .locator("#data-input")
    .pressSequentially('banana, A2, A10, apple, 0012, "New York"');
  await page.locator("#data-input").press("Control+Enter");
  await expect(page.locator(".input-receipt")).toContainText("6 text values");
  await expect(
    page.locator(".rank-item").filter({ hasText: "Counting Sort" }),
  ).toContainText("Not applicable");
  await page.getByLabel("Visualize algorithm").selectOption("merge");
  await expect(page.locator(".trace-text")).toBeVisible();
  await page.getByRole("slider", { name: "Jump to a step" }).press("End");
  await expect(page.locator(".trace-text code")).toHaveText([
    '"0012"',
    '"A10"',
    '"A2"',
    '"New York"',
    '"apple"',
    '"banana"',
  ]);
  await expect(page.locator(".trace-footer")).toContainText(
    "Completed output verified",
  );
  await page
    .locator(".visualizer")
    .screenshot({ path: "../docs/visual-text.png" });
  await page.getByRole("link", { name: "Benchmark lab", exact: true }).click();
  await page
    .getByRole("button", { name: "Run benchmark", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Run again", exact: true }),
  ).toBeEnabled({ timeout: 65000 });
  await expect(page.locator(".results-table .badge-green")).toHaveCount(4);
  await expect(page.locator(".output-preview .text-values code")).toHaveText([
    '"0012"',
    '"A10"',
    '"A2"',
    '"New York"',
    '"apple"',
    '"banana"',
  ]);
  expect(errors).toEqual([]);
});

test("text upload and keyboard search targets work across all searches", async ({
  page,
}) => {
  await page.goto("/selector");
  await page
    .getByRole("combobox", { name: "Input type", exact: true })
    .selectOption("text");
  await page.getByRole("button", { name: "Searching 03" }).click();
  await page.getByLabel("Upload text data").setInputFiles({
    name: "words.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('apple, 0012, "New York", Apple'),
  });
  await page
    .getByLabel("Text values to search for")
    .pressSequentially('apple, APPLE, 0012, 12, "New York"');
  await page.getByLabel("Text values to search for").press("Enter");
  await expect(page.locator(".winner-title h2")).toBeVisible();
  await page
    .getByLabel("Allow sorting before Binary Search (included in timing)")
    .check();
  for (const algorithm of ["linear", "binary", "hash"]) {
    await page.getByLabel("Visualize algorithm").selectOption(algorithm);
    await expect(
      page.getByRole("button", { name: "Play animation", exact: true }),
    ).toBeVisible();
    await page.getByRole("slider", { name: "Jump to a step" }).press("End");
    await expect(page.locator(".trace-footer")).toContainText(
      "Completed output verified",
    );
    await expect(page.locator(".trace-query-results")).toContainText(
      /APPLE\s+Not found/,
    );
    await expect(page.locator(".trace-query-results")).toContainText(
      /0012\s+Found/,
    );
  }
  // An invalid target draft must not stop an unrelated sorting submission.
  await page.getByLabel("Text values to search for").fill("[invalid JSON");
  await page.getByRole("button", { name: "Sorting 06" }).click();
  await page
    .getByRole("button", { name: "Analyze input", exact: true })
    .click();
  await expect(page.locator(".visualizer")).toBeVisible();
  await expect(page.locator(".error-banner")).toHaveCount(0);
});

test("uploaded JSON text works in complexity lab and on small screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/selector");
  await page
    .getByRole("combobox", { name: "Input type", exact: true })
    .selectOption("text");
  await page.getByLabel("Upload text data").setInputFiles({
    name: "ids.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify(["verylong".repeat(20), "A2", "A10", "0012", "a", "Z"]),
    ),
  });
  await page
    .getByRole("button", { name: "Analyze input", exact: true })
    .click();
  await expect(page.locator(".trace-text")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(391);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "Complexity lab", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Algorithm", exact: true })
    .selectOption("counting");
  await expect(
    page.getByRole("button", { name: "Run experiment", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Algorithm", exact: true })
    .selectOption("merge");
  await page
    .getByRole("button", { name: "Run experiment", exact: true })
    .click();
  await expect(page.locator(".empirical-chart .recharts-line-dot")).toHaveCount(
    4,
    { timeout: 65000 },
  );
});
