import { expect, test } from "@playwright/test";
import { blockPaidServices, chooseOption, expectNoHorizontalOverflow } from "./helpers";

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("Our dropdowns", () => {
  test("filter a server-rendered page, with a plain form", async ({ page }) => {
    await page.goto("/federal/bills");
    await chooseOption(page, "Status", "Became law");
    await page.getByRole("button", { name: "Search", exact: true }).last().click();
    await expect(page).toHaveURL(/status=[A-Z_]+/);
    await expect(page.getByRole("combobox", { name: "Status" })).toContainText("Became law");
    // "Any" sends nothing, rather than the placeholder value the component uses inside.
    expect(new URL(page.url()).searchParams.get("policyArea")).toBe("");
    expect(page.url()).not.toContain("__empty__");
    await expectNoHorizontalOverflow(page);
  });

  test("show the chosen filter in the server's HTML, so it doesn't flash", async ({ page }) => {
    const html = await (await page.request.get("/federal/legislators?party=R")).text();
    expect(html).toContain("Republican");
    expect(html).toContain('name="party" value="R"');
  });

  test("clearing filters resets them", async ({ page }) => {
    await page.goto("/federal/bills?q=zzzzzzzznothing&status=BECAME_LAW");
    await expect(page.getByRole("combobox", { name: "Status" })).toContainText("Became law");
    await page.getByRole("link", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/federal\/bills$/);
    await expect(page.getByRole("combobox", { name: "Status" })).toContainText("Any status");
  });

  test("have thumb-sized options, on screen, and scroll a long list", async ({ page }) => {
    await page.goto("/federal/legislators");
    await page.getByRole("combobox", { name: "State" }).click();
    const options = page.getByRole("option");
    // The menu zooms in as it opens, so measure once it has finished.
    await expect(async () => {
      expect((await options.first().boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }).toPass();
    const list = await page.getByRole("listbox").boundingBox();
    const viewport = page.viewportSize()!;
    expect(list!.x).toBeGreaterThanOrEqual(0);
    expect(list!.x + list!.width).toBeLessThanOrEqual(viewport.width);
    expect(list!.y + list!.height).toBeLessThanOrEqual(viewport.height);
    await page.getByRole("option", { name: "Wyoming" }).click();
    await expect(page.getByRole("combobox", { name: "State" })).toContainText("Wyoming");
  });

  test("don't nudge the page sideways when they open", async ({ page }) => {
    await page.goto("/federal/legislators");
    // By tag, because an open menu hides the rest of the page from role lookups.
    const heading = page.locator("main h1").first();
    const before = await heading.boundingBox();
    await page.getByRole("combobox", { name: "Party" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    const after = await heading.boundingBox();
    expect(after!.x).toBe(before!.x);
  });
});

test("no page shows a browser's native control", async ({ page }) => {
  for (const path of ["/federal/bills", "/federal/legislators", "/federal/bills/us-119-hr-2388", "/onboarding"]) {
    await page.goto(path);
    // Radix keeps a hidden 1px select in forms for autofill. Nobody sees that one.
    await expect(page.locator('select:not([aria-hidden="true"]):visible, details:visible')).toHaveCount(0);
  }
});

test("showing more opens in place, and stays out of the way until asked", async ({ page }) => {
  await page.goto("/federal/bills/us-119-hr-2388");
  const trigger = page.getByTestId("cosponsors-trigger");
  if (!(await trigger.count())) return;
  await expect(page.getByTestId("cosponsors").locator("li")).toHaveCount(0);
  await trigger.click();
  await expect(page.getByTestId("cosponsors").locator("li").first()).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  // The glossary term is beside the button, not nested in it.
  await page.getByTestId("term-cosponsor").first().click();
  await expect(page.getByTestId("term-explanation")).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});
