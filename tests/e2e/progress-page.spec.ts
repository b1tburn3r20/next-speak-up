import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow } from "./helpers";

const ORIGIN = { origin: BASE_URL };

async function newUser(page: Page) {
  const username = `prog_${Math.random().toString(36).slice(2, 10)}`;
  await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test("signed out, it explains itself and offers a way in", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your progress");
  await expect(page.getByTestId("level-card")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("a new account starts at level 1, with a nudge to vote", async ({ page }) => {
  await newUser(page);
  await page.goto("/progress");
  await expect(page.getByTestId("level-number")).toHaveText("Level 1");
  await expect(page.getByTestId("level-next")).toHaveText("100 XP to level 2");
  await expect(page.getByTestId("xp-history")).toContainText("haven't earned any XP");
  await expect(page.locator('[data-testid="badge"][data-earned="true"]')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("it shows what you've earned, and from what", async ({ page }) => {
  await newUser(page);
  await page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug: "us-119-s-4465", position: "YEA" } });
  await page.goto("/progress");
  await expect(page.getByTestId("level-next")).toHaveText("90 XP to level 2");
  await expect(page.getByTestId("xp-kind").first()).toContainText("Voted on a bill");
  await expect(page.getByTestId("xp-kind").first()).toContainText("10");
  await expect(page.getByTestId("xp-recent").first()).toContainText("+10");
  await expect(page.locator('[data-testid="badge"][data-earned="true"]')).toHaveCount(1);
  await expect(page.getByTestId("lean-row").first()).toContainText("Armed Forces");
  await expect(page.getByTestId("progress-leaderboard")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("shows your rank, the XP goal for the next one, and the whole ladder", async ({ page }) => {
  await newUser(page);
  await page.goto("/progress");
  await expect(page.getByTestId("rank-name")).toHaveText("Newcomer");
  await expect(page.getByTestId("rank-next")).toContainText("50 XP to Listener");
  await page.getByTestId("rank-ladder-toggle-trigger").click();
  await expect(page.getByTestId("rank-ladder").locator("li")).toHaveCount(9);
  await expect(page.locator('[data-testid="rank-ladder"] [data-reached="true"]')).toHaveCount(1);

  for (const slug of ["us-119-s-4465", "us-119-hr-2388", "us-119-hr-1"]) {
    await page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug, position: "YEA" } });
  }
  await page.reload();
  // Three votes earn 30, and meeting the daily goal earns 20, which reaches Listener at 50.
  await expect(page.getByTestId("rank-name")).toHaveText("Listener");
  await expect(page.getByTestId("rank-next")).toContainText("100 XP to Neighbor");
  await expect(page.getByTestId("rank-bar")).toHaveAttribute("aria-valuenow", "0");
  await expectNoHorizontalOverflow(page);
});

test("reaching a new rank gets celebrated, live", async ({ page }) => {
  await newUser(page);
  for (const slug of ["us-119-s-4465", "us-119-hr-2388"]) {
    await page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug, position: "YEA" } });
  }
  await page.goto("/federal/bills/us-119-hr-1");
  await page.getByTestId("vote-support").click();
  await expect(page.getByTestId("celebration")).toContainText("New rank: Listener!");
});

test("the bar at the top leads here", async ({ page }) => {
  await newUser(page);
  await page.goto("/federal/bills");
  await page.locator('a[data-testid="hud"]:visible').first().click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByTestId("level-card")).toBeVisible();
});
