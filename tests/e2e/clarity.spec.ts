// The paths people take, checked against docs/clarity-benchmark.md: each page says what it's for, puts
// what's yours first, and leads somewhere.
import { expect, test, type Page } from "@playwright/test";
import { FORUM_OPEN } from "../../lib/features";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow, loginAs, readOnPastGate } from "./helpers";

const ORIGIN = { origin: BASE_URL };
const main = (page: Page) => page.getByRole("main");

/** Someone in Des Moines, located by district numbers, so the geocoder isn't called. */
async function newIowan(page: Page) {
  const username = `clear_${Math.random().toString(36).slice(2, 10)}`;
  await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
  await page.request.post("/api/civic/location", { headers: ORIGIN, data: { regionCode: "IA", districtCode: "3" } });
  await page.request.patch("/api/civic/location/state", { headers: ORIGIN, data: { lower: "36", upper: "18", city: "des-moines" } });
  return username;
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("home", () => {
  test("answers in order: your next vote, who represents you, then this week", async ({ page }) => {
    await newIowan(page);
    await page.goto("/dashboard");
    // The page streams in, and evaluateAll doesn't wait, so wait for the last section first.
    await expect(main(page).getByTestId("dashboard-week")).toBeVisible();
    await expect(main(page).getByTestId("dashboard-reps")).toBeVisible();
    const order = await main(page)
      .locator('[data-testid="pulse"], [data-testid="dashboard-next"], [data-testid="dashboard-reps"], [data-testid="dashboard-week"]')
      .evaluateAll((sections) => sections.map((section) => section.getAttribute("data-testid")));
    expect(order.indexOf("dashboard-reps")).toBeGreaterThan(-1);
    expect(order.indexOf("dashboard-week")).toBeGreaterThan(order.indexOf("dashboard-reps"));
    // Congress, the statehouse, and City Hall, each a group of faces.
    await expect(main(page).getByTestId("my-people-group")).toHaveCount(3);
    for (const row of ["congress", "city"]) await expect(main(page).getByTestId(`this-week-${row}`)).toBeVisible();
    // The statehouse is only in "This week" when something's happening there this week. Between
    // sessions, its faces say when it's back instead.
    const stateRow = main(page).getByTestId("this-week-state");
    if ((await stateRow.count()) === 0) await expect(main(page).getByTestId("dashboard-reps")).toContainText("statehouse · back");
    else await expect(stateRow).toContainText(/In session|this week/);
    // The schedule itself lives on its own page now.
    await expect(main(page).getByTestId("floor-board")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("every number in the progress row says what it is", async ({ page }) => {
    await newIowan(page);
    await page.goto("/dashboard");
    const strip = main(page).getByTestId("progress-strip");
    await expect(strip).toContainText("day streak");
    await expect(strip).toContainText("XP");
    await expect(strip).toContainText("votes today");
  });

  test("signed out, it explains the idea in three steps", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("how-it-works").locator("li")).toHaveCount(3);
  });
});

test.describe("voting", () => {
  test("says what the page is, and why each bill is there", async ({ page }) => {
    await newIowan(page);
    await page.goto("/vote");
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText("Vote");
    await expect(main(page).getByTestId("session-reason")).toContainText(/Bill 1 of \d+ · /);
  });

  test("keeps the voting screen about voting, with no count of what's waiting", async ({ page }) => {
    await newIowan(page);
    await page.goto("/vote");
    await expect(main(page).getByTestId("session-reason")).toBeVisible();
    await expect(main(page).getByTestId("vote-waiting")).toHaveCount(0);
  });
});

test.describe("upcoming votes", () => {
  test("splits the week three ways, with a bar that fills as you vote", async ({ page }) => {
    await newIowan(page);
    await page.goto("/federal/upcoming");
    const progress = main(page).getByTestId("floor-progress");
    await expect(progress).toBeVisible();
    for (const group of ["voted", "waiting", "missed"]) await expect(main(page).getByTestId(`floor-group-${group}`)).toBeVisible();
    const waiting = main(page).getByTestId("floor-group-waiting");
    const card = waiting.getByTestId("floor-item").filter({ has: page.getByTestId("vote-support") }).first();
    test.skip((await card.count()) === 0, "Nothing is waiting on a vote this week");
    await page.waitForLoadState("networkidle");
    await expect(progress.getByTestId("floor-progress-count")).toContainText(/^0 of \d+$/);
    await card.getByTestId("vote-support").click();
    await expect(progress.getByTestId("floor-progress-count")).toContainText(/^1 of \d+$/);
    await expect(main(page).getByTestId("floor-group-voted-trigger")).toContainText("1");
  });
});

test.describe("a pulse check", () => {
  test("runs a few of a member's bills, then says how you lined up on just those", async ({ page }) => {
    await newIowan(page);
    await page.goto("/federal/legislators/E000295");
    await main(page).getByTestId("pulse-check-3").click();
    await expect(page).toHaveURL(/\/pulse-check\?count=3$/);
    const html = await (await page.request.get("/federal/legislators/E000295/pulse-check?count=3")).text();
    // Her votes aren't in the page before yours.
    expect(html).not.toContain("pulse-row");
    // A tap before the page is ready does nothing.
    await page.waitForLoadState("networkidle");
    for (let bill = 1; bill <= 3; bill += 1) {
      await expect(main(page).getByTestId("session-reason")).toContainText(`Bill ${bill} of 3`);
      const saved = page.waitForResponse("**/api/civic/bills/vote");
      await main(page).getByTestId("blind-vote-card").getByTestId(bill === 2 ? "vote-oppose" : "vote-support").click();
      await saved;
      await main(page).getByTestId("session-next").click();
    }
    await expect(main(page).getByTestId("pulse-headline")).toContainText(/You and Joni (agreed|disagreed)/);
    await expect(main(page).getByTestId("pulse-row")).toHaveCount(3);
    await expect(main(page).getByTestId("pulse-again")).toHaveAttribute("href", /pulse-check\?count=3$/);
  });
});

test.describe("the shelved forum", () => {
  test("can't be reached: no link from a bill, its pages 404, and its routes refuse", async ({ page }) => {
    test.skip(FORUM_OPEN, "The forum is open");
    await loginAs(page, "test_member");
    await page.goto("/federal/bills/us-119-s-4465");
    await readOnPastGate(page);
    await expect(main(page).getByTestId("bill-discuss")).toHaveCount(0);
    for (const path of ["/forum", "/forum/create-forum-post", "/forum/posts/1"]) expect((await page.goto(path))?.status()).toBe(404);
    const response = await page.request.post("/api/forum/new-post", { headers: ORIGIN, data: { title: "x", content: "y" } });
    expect(response.status()).toBe(404);
  });
});

test.describe("a bill", () => {
  test("leads to talking about it, with the post already about the bill", async ({ page }) => {
    test.skip(!FORUM_OPEN, "The forum is shelved");
    await loginAs(page, "test_member");
    await page.goto("/federal/bills/us-119-s-4465");
    await page.waitForLoadState("networkidle");
    await readOnPastGate(page);
    await main(page).getByTestId("bill-discuss").click();
    await expect(page).toHaveURL(/\/forum\?bill=us-119-s-4465/);
    const composer = main(page).getByTestId("forum-composer");
    await expect(composer).toBeVisible();
    await expect(composer.getByRole("textbox").first()).toHaveValue(/^S\. 4465: /);
  });

  test("says where \"In short\" comes from when you tap it, not in another line on the page", async ({ page }) => {
    await page.goto("/federal/bills/us-119-s-4465");
    await page.waitForLoadState("networkidle");
    await expect(main(page).getByTestId("digest-source")).toHaveCount(0);
    await main(page).getByTestId("in-short").click();
    await expect(page.getByTestId("in-short-explanation")).toContainText("word for word");
    await expect(page.getByTestId("in-short-explanation")).toContainText("no AI");
  });

  test("keeps its history, votes, and full summary in tabs", async ({ page }) => {
    await page.goto("/federal/bills/us-119-s-4465");
    await expect(main(page).getByTestId("bill-tab-history")).toBeVisible();
    await expect(main(page).getByTestId("bill-tab-votes")).toBeVisible();
    await expect(main(page).getByTestId("bill-timeline")).toBeVisible();
  });
});

test.describe("where you live", () => {
  test("can be changed from Settings, through My Reps", async ({ page }) => {
    await newIowan(page);
    await page.goto("/settings");
    await main(page).getByTestId("settings-location").click();
    await expect(page).toHaveURL(/\/reps#where-you-live$/);
    await main(page).getByTestId("change-location-trigger").click();
    await expect(main(page).getByTestId("find-reps")).toBeVisible();
  });

  test("Iowa's legislators list starts with your own two", async ({ page }) => {
    await newIowan(page);
    await page.goto("/state/ia/legislators");
    await expect(main(page).getByTestId("state-members-yours").getByTestId("member-card")).toHaveCount(2);
    await expect(main(page).getByTestId("state-chamber-tab-lower")).toBeVisible();
  });
});
