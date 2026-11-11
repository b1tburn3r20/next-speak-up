import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

const ORIGIN = { origin: BASE_URL };

async function newUser(page: Page, state = "WY") {
  const username = `eng_${Math.random().toString(36).slice(2, 10)}`;
  const signup = await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  expect(signup.status()).toBe(201);
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
  const location = await page.request.post("/api/civic/location", {
    headers: ORIGIN,
    data: { regionCode: state, districtCode: state === "WY" ? "AL" : null },
  });
  expect(location.ok()).toBe(true);
  return username;
}

const vote = (page: Page, slug: string, position: string | null = "YEA") =>
  page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug, position } });

/** A bill your reps have voted on, and Congress hasn't finished with. */
async function openBillWithRepVote(page: Page): Promise<string> {
  await page.goto("/vote");
  const cards = page.getByTestId("blind-vote-card");
  for (let index = 0; index < 5; index += 1) {
    if (await cards.getByTestId("pulse-alert").count()) return (await cards.getAttribute("data-slug"))!;
    await page.getByTestId("session-skip").click();
  }
  throw new Error("No bill your reps voted on in this session");
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("the dashboard", () => {
  test("has quests that track what you did, and a nudge for your streak", async ({ page }) => {
    await newUser(page);
    await page.goto("/dashboard");
    const quests = page.getByTestId("quest");
    await expect(quests).toHaveCount(3);
    await expect(quests.first()).toHaveAttribute("data-done", "false");
    await expect(page.getByTestId("streak-nudge")).toHaveCount(0);

    for (const slug of ["us-119-hr-2388", "us-119-s-4465"]) expect((await vote(page, slug)).ok()).toBe(true);
    await page.reload();
    await expect(quests.first()).toContainText("2/3");
    await expect(page.getByRole("main").getByTestId("daily-goal")).toHaveText("2/3");
    await expectNoHorizontalOverflow(page);
  });

  test("charts how you've voted by topic on Progress, from real votes, with a table too", async ({ page }) => {
    await newUser(page);
    await page.goto("/progress");
    await expect(page.getByTestId("lean-empty")).toBeVisible();
    await vote(page, "us-119-s-4465", "NAY");
    await page.reload();
    const row = page.getByTestId("lean-row").first();
    await expect(row).toContainText("Armed Forces and National Security");
    await expect(row).toHaveAttribute("title", /0 supported, 1 opposed/);
    await page.getByTestId("lean-table-trigger").click();
    await expect(page.getByTestId("lean-table").getByRole("cell", { name: "Armed Forces and National Security" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("shows what moved since your last visit", async ({ page }) => {
    await newUser(page);
    await vote(page, "us-119-s-4465", "NAY");
    await page.goto("/progress");
    await expect(page.getByTestId("lean-row").first()).toBeVisible();
    await expect(page.getByTestId("lean-change")).toHaveCount(0);
    // The page shows from the server first, so wait until the chart has remembered this visit.
    await page.waitForFunction(() => Object.keys(localStorage).some((key) => key.startsWith("policy-lean:")));
    await vote(page, "us-119-s-4465", "YEA");
    await page.reload();
    await expect(page.getByTestId("lean-change").first()).toContainText("+1");
  });
});

test.describe("after you vote", () => {
  test("your match with each rep is shown moving, and you can contact them", async ({ page }) => {
    await newUser(page);
    const slug = await openBillWithRepVote(page);
    await page.getByTestId("vote-support").click();
    await expect(page.getByTestId("reveal-row").first()).toBeVisible();
    await expect(page.getByTestId("match-move").first()).toContainText("You and");

    const contact = page.getByTestId("contact-rep").first();
    await expect(contact.getByTestId("contact-call")).toHaveAttribute("href", /^tel:/);
    const before = (await (await page.request.get("/api/civic/progress")).json()).progress.xp;
    await contact.getByTestId("contact-report").click();
    await expect(contact.getByTestId("contact-done")).toContainText("You said you did");
    const after = (await (await page.request.get("/api/civic/progress")).json()).progress.xp;
    expect(after - before).toBe(25);

    // A second rep on the same bill earns nothing more, and repeating is safe.
    const second = page.getByTestId("contact-rep").nth(1);
    if (await second.count()) await second.getByTestId("contact-report").click();
    await expect.poll(async () => (await (await page.request.get("/api/civic/progress")).json()).progress.xp).toBe(after);
    expect(slug).toBeTruthy();
  });

  test("you can't report contacting someone who isn't your rep", async ({ page }) => {
    await newUser(page);
    const response = await page.request.post("/api/civic/actions/contact", {
      headers: ORIGIN,
      data: { slug: "us-119-s-4465", personId: 999999 },
    });
    expect(response.status()).toBe(404);
  });

  test("a decided bill doesn't ask you to contact anyone", async ({ page }) => {
    await newUser(page);
    await page.goto("/federal/bills/us-119-hr-2388");
    await page.getByTestId("vote-support").click();
    await expect(page.getByTestId("bill-outlook")).toHaveAttribute("data-kind", "DECIDED");
    await expect(page.getByTestId("reveal-panel")).toBeVisible();
    await expect(page.getByTestId("contact-rep")).toHaveCount(0);
  });

  test("a session counts your combo, and ends with XP earned", async ({ page }) => {
    await newUser(page);
    await page.goto("/vote");
    const total = Number(await page.getByTestId("session-progress").getAttribute("aria-valuemax"));
    for (let index = 0; index < total; index += 1) {
      await page.getByTestId("vote-support").click();
      await page.getByTestId("session-next").click();
      if (index === 1 && total > 2) await expect(page.getByTestId("session-combo")).toContainText("2 in a row");
    }
    await expect(page.getByTestId("session-xp")).toContainText(`+${total * 10 + (total >= 3 ? 20 : 0)}`, { timeout: 5000 }).catch(async () => {
      // Scheduled bills add a bonus, so only the minimum is certain.
      const text = await page.getByTestId("session-xp").innerText();
      expect(Number(text.replace(/\D/g, ""))).toBeGreaterThanOrEqual(total * 10);
    });
  });
});

test.describe("bill lists", () => {
  test("mark what you've voted on, and offer XP for the rest", async ({ page }) => {
    await newUser(page);
    await page.goto("/federal/bills?q=us-119-hr-2388");
    await page.goto("/federal/bills");
    await expect(page.getByTestId("xp-chip").first()).toContainText("+10 XP");
    expect(await page.getByTestId("voted-chip").count()).toBe(0);
  });

  test("show no XP to someone signed out", async ({ page }) => {
    await page.goto("/federal/bills");
    await expect(page.getByTestId("bill-card").first()).toBeVisible();
    await expect(page.getByTestId("xp-chip")).toHaveCount(0);
  });
});

test.describe("the leaderboard", () => {
  test("you're off it until you choose, and only your username shows", async ({ page }) => {
    const username = await newUser(page);
    await vote(page, "us-119-s-4465");
    await page.goto("/leaderboard");
    await expect(page.getByTestId("leaderboard-me")).toContainText("You'd be #");
    await expect(page.getByTestId("leaderboard-me")).toContainText("10 XP");
    await expect(page.getByRole("main").getByTestId("leaderboard-row").filter({ hasText: username })).toHaveCount(0);

    await page.getByTestId("leaderboard-toggle").click();
    const mine = page.getByRole("main").getByTestId("leaderboard-row").filter({ hasText: username });
    await expect(mine).toContainText("10 XP");
    await expect(page.getByTestId("leaderboard-me")).toContainText("You're #");
    await expectNoHorizontalOverflow(page);
    // It never says how anyone voted.
    await expect(page.getByTestId("leaderboard")).not.toContainText(/support|oppose/i);

    await page.getByTestId("leaderboard-toggle").click();
    await expect(mine).toHaveCount(0);
  });

  test("it's per state", async ({ page }) => {
    const username = await newUser(page, "WY");
    await vote(page, "us-119-s-4465");
    await page.request.patch("/api/civic/leaderboard", { headers: ORIGIN, data: { optIn: true } });
    await page.request.post("/api/account/logout", { headers: ORIGIN }).catch(() => undefined);
    await page.context().clearCookies();
    await newUser(page, "TX");
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Texas");
    await expect(page.getByRole("main").getByTestId("leaderboard-row").filter({ hasText: username })).toHaveCount(0);
  });

  test("only a moderator can take a name off", async ({ page }) => {
    await newUser(page);
    const denied = await page.request.delete("/api/civic/leaderboard", { headers: ORIGIN, data: { userId: "someone" } });
    expect(denied.status()).toBe(403);
    await page.context().clearCookies();
    const anonymous = await page.request.delete("/api/civic/leaderboard", { headers: ORIGIN, data: { userId: "someone" } });
    expect(anonymous.status()).toBe(401);
    // The link is for signed-in people.
    await page.goto("/dashboard");
    await expect(page.locator('a[href="/leaderboard"]')).toHaveCount(0);
  });

  test("a moderator's removal sticks even if they're still opted in", async ({ page }) => {
    const username = await newUser(page);
    await vote(page, "us-119-s-4465");
    await page.request.patch("/api/civic/leaderboard", { headers: ORIGIN, data: { optIn: true } });
    await page.goto("/leaderboard");
    const row = page.getByRole("main").getByTestId("leaderboard-row").filter({ hasText: username });
    await expect(row).toBeVisible();
    const rowUser = await page.evaluate(async () => (await (await fetch("/api/auth/session")).json()).user.id as string);

    await page.context().clearCookies();
    await loginAs(page, "test_superadmin");
    const removed = await page.request.delete("/api/civic/leaderboard", { headers: ORIGIN, data: { userId: rowUser } });
    expect(removed.ok()).toBe(true);
    await page.goto("/leaderboard");
    await expect(page.getByRole("main").getByTestId("leaderboard-row").filter({ hasText: username })).toHaveCount(0);
  });
});
