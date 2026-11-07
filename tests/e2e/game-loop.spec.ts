import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow } from "./helpers";

const ORIGIN = { origin: BASE_URL };
const LAW = "/federal/bills/us-119-hr-2388";

async function newAccount(page: Page) {
  const username = `game_${Math.random().toString(36).slice(2, 10)}`;
  const signup = await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  expect(signup.status()).toBe(201);
  const done = await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
  expect(done.ok()).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("vote first", () => {
  test("hides where a bill stands from the server's HTML until you choose", async ({ page }) => {
    await newAccount(page);
    const html = await (await page.request.get(LAW)).text();
    expect(html).toContain('data-testid="vote-gate"');
    expect(html).not.toContain("Became law");
    expect(html).not.toContain("Public Law");
    expect(html).not.toContain('data-testid="bill-status"');
    await page.goto(LAW);
    await expect(page.getByTestId("vote-gate")).toBeVisible();
    await expect(page.getByTestId("digest-lead")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("voting shows where it stands, worded around what your vote means", async ({ page }) => {
    await newAccount(page);
    await page.goto(LAW);
    await page.getByTestId("vote-support").click();
    await expect(page.getByTestId("reward")).toContainText("+10 XP");
    await expect(page.getByTestId("vote-gate")).toHaveCount(0);
    const outlook = page.getByTestId("bill-outlook");
    await expect(outlook).toBeInViewport();
    await expect(outlook).toContainText("already law");
    await expect(outlook).toContainText("still counts");
    await expect(page.getByTestId("bill-status").first()).toContainText("Became law");
    // It stays that way.
    await page.reload();
    await expect(page.getByTestId("vote-gate")).toHaveCount(0);
  });

  test("you can skip, it earns nothing, and it's remembered", async ({ page }) => {
    await newAccount(page);
    await page.goto(LAW);
    await page.getByTestId("gate-skip").click();
    await expect(page.getByTestId("vote-gate")).toHaveCount(0);
    await expect(page.getByTestId("bill-status").first()).toContainText("Became law");
    await expect(page.getByTestId("reward")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("vote-gate")).toHaveCount(0);
    const { progress } = await (await page.request.get("/api/civic/progress")).json();
    expect(progress.xp).toBe(0);
  });

  test("signed-out visitors and search engines see the whole page", async ({ page }) => {
    const html = await (await page.request.get(LAW)).text();
    expect(html).not.toContain('data-testid="vote-gate"');
    expect(html).toContain("Became law");
  });

  test("the next bill card doesn't give away where a bill stands", async ({ page }) => {
    await newAccount(page);
    await page.goto("/dashboard");
    const card = page.getByTestId("next-bill");
    await expect(card).toBeVisible();
    await expect(card.getByTestId("bill-status")).toHaveCount(0);
    await expect(card.getByTestId("relative-date")).toHaveCount(0);
  });
});

test.describe("XP", () => {
  test("shows on every page and moves when you vote", async ({ page }) => {
    await newAccount(page);
    for (const path of ["/federal/bills", "/federal/legislators", "/vote"]) {
      await page.goto(path);
      await expect(page.locator('[data-testid="hud"]:visible').first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
    await page.goto(LAW);
    await page.getByTestId("vote-support").click();
    await expect(page.locator('[data-testid="hud-level"]:visible').first()).toBeVisible();
    await expect.poll(async () => (await (await page.request.get("/api/civic/progress")).json()).progress.xp).toBe(10);
  });

  test("isn't counted twice when you come back to the dashboard", async ({ page }) => {
    await newAccount(page);
    await page.goto(LAW);
    await page.getByTestId("vote-support").click();
    await expect(page.getByTestId("bill-outlook")).toBeVisible();
    // A client-side visit keeps the store, which is where a double count would come from.
    await page.locator('a[href="/dashboard"]:visible').first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    const strip = page.getByTestId("progress-strip");
    await expect(strip).toContainText("10 XP");
    await expect(page.getByTestId("daily-goal")).toHaveText("1/3");
    await page.reload();
    await expect(strip).toContainText("10 XP");
  });

  test("taking a vote back takes back its XP, so repeating it earns nothing extra", async ({ page }) => {
    await newAccount(page);
    await page.goto(LAW);
    await page.getByTestId("vote-support").click();
    await expect(page.getByTestId("bill-outlook")).toBeVisible();
    const vote = (position: string | null) =>
      page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug: "us-119-hr-2388", position } });
    const xp = async (response: Awaited<ReturnType<typeof vote>>) => (await response.json()).progress.xp;
    expect(await xp(await vote(null))).toBe(0);
    expect(await xp(await vote("YEA"))).toBe(10);
    // Changing your mind isn't a new vote.
    expect(await xp(await vote("NAY"))).toBe(10);
  });
});

test.describe("layout", () => {
  test("the loading bar uses the theme's color, not the color for No", async ({ page }) => {
    await page.goto("/federal/bills");
    const fill = page.getByTestId("top-progress-bar").locator("div");
    await expect(fill).toHaveClass(/bg-primary/);
    await expect(fill).not.toHaveClass(/bg-oppose/);
  });

  test("a bill page uses a wide screen, with the vote beside it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Only a wide screen has two columns");
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(LAW);
    const digest = await page.getByTestId("digest").boundingBox();
    const vote = await page.getByTestId("your-vote").boundingBox();
    expect(digest!.width).toBeGreaterThan(700);
    expect(vote!.x).toBeGreaterThan(digest!.x + digest!.width);
    expect(vote!.y).toBeLessThan(digest!.y + digest!.height);
  });

  test("a phone keeps one column, with the summary first", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "Checked at one phone width");
    await page.goto(LAW);
    const digest = await page.getByTestId("digest").boundingBox();
    const vote = await page.getByTestId("your-vote").boundingBox();
    expect(vote!.y).toBeGreaterThan(digest!.y);
    await expectNoHorizontalOverflow(page);
  });
});
