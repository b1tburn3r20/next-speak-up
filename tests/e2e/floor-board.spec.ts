import { expect, test } from "@playwright/test";
import { FORUM_OPEN } from "../../lib/features";
import { blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

for (const who of ["signed out", "signed in"]) {
  test(`upcoming votes always shows both chambers, this week and next, ${who}`, async ({ page }) => {
    if (who === "signed in") await loginAs(page, "test_member");
    await page.goto("/federal/upcoming");
    const main = page.getByRole("main");
    await expect(main.getByTestId("right-now")).toBeVisible();
    await expect(main.getByTestId("next-meeting-house")).toBeVisible();
    await expect(main.getByTestId("next-meeting-senate")).toBeVisible();
    // Signed out, the House's list is cards a week at a time. Signed in, it's split by what's left for
    // you to vote on. Either way, or it says nothing is scheduled.
    await expect(main.locator('[data-testid="floor-week"], [data-testid="floor-groups"], :text("Nothing on the House schedule")').first()).toBeVisible();
    await main.getByTestId("chamber-tab-senate").click();
    await expect(main.getByTestId("board-senate-this")).toContainText("This week");
    await expect(main.getByTestId("board-senate-next")).toContainText("Next week");
    await expectNoHorizontalOverflow(page);
  });
}

test("an empty week says so instead of disappearing", async ({ page }) => {
  await page.goto("/federal/upcoming");
  // The weeks with counts are the Senate's, in its tab.
  await page.getByRole("main").getByTestId("chamber-tab-senate").click();
  const weeks = page.getByRole("main").locator('[data-testid^="board-"][data-count="0"]');
  const count = await weeks.count();
  for (let index = 0; index < count; index += 1) {
    await expect(weeks.nth(index).getByTestId("board-empty")).toBeVisible();
  }
});

test("House lists hold only House bills, never a Senate row or a meeting notice", async ({ request }) => {
  const { items } = await (await request.get("/api/civic/floor")).json();
  for (const item of items) {
    expect(["SUSPENSION", "RULE", "OTHER"]).toContain(item.category);
  }
});

test("a Senate item with no date is listed once", async ({ request, page }) => {
  const { senate } = await (await request.get("/api/civic/floor")).json();
  const refs = senate.waiting.map((item: { legislationRef: string }) => item.legislationRef);
  expect(new Set(refs).size).toBe(refs.length);
  test.skip(refs.length === 0, "Nothing is waiting");
  await page.goto("/federal/upcoming");
  await page.getByRole("main").getByTestId("chamber-tab-senate").click();
  const waiting = page.getByRole("main").getByTestId("board-senate-waiting");
  await expect(waiting.getByTestId("board-item")).toHaveCount(refs.length);
});

test("the Senate's legal text is tucked away behind the bill's plain title", async ({ page, request }) => {
  const { senate } = await (await request.get("/api/civic/floor")).json();
  test.skip(senate.nextWeek.length + senate.thisWeek.length + senate.waiting.length === 0, "Nothing listed");
  await page.goto("/federal/upcoming");
  const board = page.getByRole("main").getByTestId("board-senate");
  await expect(board.getByTestId("senate-order")).toHaveCount(0);
  await expect(board.getByTestId("board-item").first()).not.toContainText("Ordered, That");
});

test("a bill's status stays hidden on the board until you vote", async ({ page }) => {
  await loginAs(page, "test_newuser");
  await page.goto("/federal/upcoming");
  await page.waitForLoadState("networkidle");
  // A brand-new account may be sent to onboarding first, and then there's no board to check.
  const tab = page.getByRole("main").getByTestId("chamber-tab-senate");
  test.skip((await tab.count()) === 0, "This account is still onboarding");
  await tab.click();
  const row = page
    .getByRole("main")
    .getByTestId("board-item")
    .filter({ has: page.locator('[data-testid="vote-support"][aria-pressed="false"]') })
    .filter({ has: page.locator('[data-testid="vote-oppose"][aria-pressed="false"]') })
    .first();
  test.skip((await row.count()) === 0, "Nothing unvoted on the board");
  await expect(row.getByTestId("bill-status")).toHaveCount(0);
});

test.describe("the forum composer", () => {
  test.skip(!FORUM_OPEN, "The forum is shelved");
  test("opens in place of the Create button, on the forum", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.goto("/forum");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("composer-open").click();
    await expect(page).toHaveURL(/\/forum$/);
    await expect(page.getByTestId("forum-composer")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByTestId("composer-cancel").click();
    await expect(page.getByTestId("forum-composer")).toHaveCount(0);
    await expect(page.getByTestId("composer-open")).toBeVisible();
  });

  test("old links open it too", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.goto("/forum/create-forum-post");
    await expect(page).toHaveURL(/\/forum\?compose=1$/);
    await expect(page.getByTestId("forum-composer")).toBeVisible();
  });
});
