// The product's promises, from docs/acceptance-criteria.md.
import { expect, test, type Page } from "@playwright/test";
import { blockPaidServices, chooseOption, expectNoHorizontalOverflow, loginAs, BASE_URL } from "./helpers";

const main = (page: Page) => page.getByRole("main");

async function newUser(page: Page, tag: string, state = "WY") {
  // Usernames have a length limit, so only the tag's start and a short random part are used.
  const username = `e2e_${tag.slice(0, 5)}_${Math.random().toString(36).slice(2, 10)}`;
  const response = await page.request.post("/api/account/signup", {
    headers: { origin: BASE_URL },
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  expect(response.status()).toBe(201);
  const done = await page.request.patch("/api/civic/onboarding", {
    headers: { origin: BASE_URL },
    data: { complete: true },
  });
  expect(done.ok()).toBeTruthy();
  if (state) {
    const saved = await page.request.post("/api/civic/location", {
      headers: { origin: BASE_URL },
      data: { mode: "manual", regionCode: state, districtCode: "AL" },
    });
    expect(saved.ok(), "location saved").toBeTruthy();
  }
  return username;
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("voting before finding out", () => {
  test("a rep's vote isn't in the page's HTML before the user votes", async ({ page }) => {
    await newUser(page, "blind");
    const html = await (await page.request.get("/vote")).text();
    expect(html).toContain("blind-vote-card");
    for (const leak of ["You match", "You differ", "reveal-row", 'position\\":\\"YEA', 'position":"YEA']) {
      expect(html, leak).not.toContain(leak);
    }
    const dashboard = await (await page.request.get("/dashboard")).text();
    for (const leak of ["You match", "reveal-row", 'position\\":\\"YEA', 'position\\":\\"NAY']) {
      expect(dashboard, leak).not.toContain(leak);
    }
  });

  test("a bill page's HTML has no rep positions for a signed-in user who hasn't voted", async ({ page }) => {
    await newUser(page, "billblind");
    const gated = await (await page.request.get("/federal/bills/us-119-s-4465")).text();
    expect(gated).toContain("vote-gate");
    expect(gated).not.toContain("reveal-row");
    // Choosing to read on still doesn't show how they voted.
    await page.goto("/federal/bills/us-119-s-4465");
    await page.getByTestId("gate-skip").click();
    await expect(page.getByTestId("reveal-hidden")).toBeVisible();
    const html = await (await page.request.get("/federal/bills/us-119-s-4465")).text();
    expect(html).toContain("reveal-hidden");
    expect(html).not.toContain("reveal-row");
    expect(html).not.toContain("How your reps voted");
  });

  test("voting reveals your reps, with pictures and whether you match", async ({ page }) => {
    await newUser(page, "reveal");
    await page.goto("/vote");
    await page.waitForLoadState("networkidle");
    const card = page.getByTestId("blind-vote-card");
    await expect(card.getByTestId("reveal-hidden")).toBeVisible();
    await card.getByTestId("vote-support").click();
    await expect(card.getByTestId("reveal-panel")).toBeVisible();
    await expect(card.getByTestId("reveal-row")).toHaveCount(3);
    await expect(card.getByTestId("reveal-row").first()).toContainText(/Hageman|Barrasso|Lummis/);
    await expectNoHorizontalOverflow(page);
  });

  test("you can ask to see it anyway", async ({ page }) => {
    await newUser(page, "anyway");
    await page.goto("/vote");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("reveal-anyway").click();
    await expect(page.getByTestId("reveal-panel")).toBeVisible();
    await expect(page.getByTestId("reveal-panel")).toContainText("How your reps voted");
    await expect(page.getByTestId("reveal-panel")).not.toContainText("You match");
  });

  test("signed out, showing it asks you to sign in", async ({ page }) => {
    await page.goto("/vote");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("reveal-anyway").click();
    await expect(page.getByText("Log in or sign up")).toBeVisible();
  });

  test("the reveal API needs a signed-in user", async ({ request }) => {
    const response = await request.get("/api/civic/bills/reveal?slug=us-119-s-4465");
    expect(response.status()).toBe(401);
  });
});

test.describe("a voting session", () => {
  test("goes through bills one at a time, and ends with what to do next", async ({ page }) => {
    await newUser(page, "session");
    await page.goto("/vote");
    await page.waitForLoadState("networkidle");
    const total = Number((await page.getByTestId("session-progress").getAttribute("aria-valuemax")) ?? 0);
    expect(total).toBeGreaterThan(0);
    for (let index = 0; index < total; index += 1) {
      await expect(page.getByTestId("session-progress")).toHaveAttribute("aria-valuenow", String(index));
      if (index % 2 === 0) {
        const vote = page.waitForResponse("**/api/civic/bills/vote");
        await page.getByTestId("vote-oppose").click();
        expect((await vote).ok()).toBe(true);
        await page.getByTestId("session-next").click();
      } else {
        await page.getByTestId("session-skip").click();
      }
    }
    await expect(page.getByTestId("session-finish")).toBeVisible();
    await expect(page.getByTestId("session-summary")).toContainText("You weighed in on");
    await expect(page.getByTestId("session-again")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("the next session doesn't repeat what you voted on", async ({ page }) => {
    await newUser(page, "repeat");
    await page.goto("/vote");
    await page.waitForLoadState("networkidle");
    const first = await page.getByTestId("blind-vote-card").getAttribute("data-slug");
    const vote = page.waitForResponse("**/api/civic/bills/vote");
    await page.getByTestId("vote-support").click();
    await vote;
    await page.goto("/vote");
    await expect(page.getByTestId("blind-vote-card")).not.toHaveAttribute("data-slug", first!);
  });
});

test.describe("the dashboard", () => {
  test("is tailored: progress, a next step, pulse checks, and reps with verdicts", async ({ page }) => {
    await newUser(page, "dash");
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("progress-strip")).toBeVisible();
    await expect(main(page).getByTestId("next-bill")).toBeVisible();
    await expect(main(page).getByTestId("pulse-alert").first()).toBeVisible();
    await expect(main(page).getByTestId("pulse")).toContainText("Vote first");
    await expect(main(page).getByTestId("rep-report-card")).toHaveCount(3);
    await expect(main(page).getByTestId("verdict").first()).toHaveText("Not enough votes yet");
    await expect(main(page).getByTestId("rep-recap").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.goto("/progress");
    await expect(main(page).getByTestId("badges").locator('[data-earned="true"]')).toHaveCount(1);
  });

  test("with no location, the first step is finding your reps", async ({ page }) => {
    await newUser(page, "noloc", "");
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("next-step").first()).toHaveAttribute("data-step", "find-reps");
  });

  test("finding your reps happens right there, and then they appear", async ({ page }) => {
    await newUser(page, "findr", "");
    await page.goto("/reps");
    await page.waitForLoadState("networkidle");
    const finder = main(page).getByTestId("find-reps");
    await expect(finder).toBeVisible();
    await chooseOption(page, "Or choose your state", "Wyoming", finder);
    await finder.getByTestId("save-location").click();
    await expect(main(page).getByTestId("rep-report-card")).toHaveCount(3, { timeout: 15000 });
  });

  test("the navigation alerts you to your reps' votes, and counts down", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("phone"), "Checked on the phone navigation");
    await newUser(page, "alert");
    await page.goto("/federal/bills");
    const dot = page.getByTestId("bottom-nav").getByTestId("pulse-dot");
    await expect(dot).toBeVisible();
    const count = async () => (await (await page.request.get("/api/civic/pulse")).json()).count;
    const before = await count();
    expect(before).toBeGreaterThan(0);
    // The queue leads with scheduled bills, so this picks one your reps actually voted on.
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const saved = page.waitForResponse("**/api/civic/bills/vote");
    await page.getByTestId("pulse").getByTestId("vote-support").first().click();
    await saved;
    expect(await count()).toBe(before - 1);
    await expect(dot).toBeVisible();
  });

  test("signed out, it explains the idea and offers a first step", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(main(page).getByRole("heading", { level: 1 })).toContainText("represent you");
    await expect(main(page).getByTestId("next-step").first()).toHaveAttribute("data-step", "sign-up");
    await main(page).getByTestId("next-step-action").first().click();
    await expect(page).toHaveURL(/\/vote/);
  });

  test("a vote moves the daily goal and earns a reward right away", async ({ page }) => {
    await newUser(page, "reward");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(main(page).getByTestId("daily-goal")).toHaveText("0/3");
    await main(page).getByTestId("blind-vote-card").first().getByTestId("vote-support").click();
    await expect(page.getByTestId("reward")).toBeVisible();
    await expect(main(page).getByTestId("daily-goal")).toHaveText("1/3");
    await expect(main(page).getByTestId("streak")).toHaveText("1");
  });

  test("answers do they represent me, with a verdict after 3 shared votes", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.goto("/reps");
    await expect(main(page).getByTestId("rep-report-card").first()).toBeVisible();
    await expect(main(page).getByTestId("verdict").first()).toBeVisible();
    await expect(main(page).getByTestId("alignment-ring").first()).toBeVisible();
    await expect(main(page).getByTestId("alignment-by-topic").first()).toBeVisible();
    await expect(main(page).getByTestId("job-measures").first()).toContainText("of the");
    await expect(main(page).getByTestId("rep-latest-bill").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("demystifying", () => {
  test("upcoming bills show their topic, sponsor, and a digest or an honest gap", async ({ page, request }) => {
    const { items } = await (await request.get("/api/civic/floor")).json();
    test.skip(items.length === 0, "Nothing is scheduled");
    await page.goto("/federal/upcoming");
    const card = main(page).getByTestId("floor-item").first();
    await expect(card.getByTestId("policy-chip")).toBeVisible();
    await expect(card.getByTestId("sponsor-line")).toBeVisible();
    await expect(card.locator('[data-testid="digest-lead"], [data-testid="no-digest"]')).toBeVisible();
  });

  test("a bill page leads with the digest, not boilerplate", async ({ page }) => {
    await page.goto("/federal/bills/us-119-hr-3978");
    const digest = main(page).getByTestId("digest");
    await expect(digest).toBeVisible();
    await expect(digest).not.toContainText("The following analysis is based on");
    await expect(digest.getByTestId("digest-lead")).toBeVisible();
  });

  test("a bill with no summary says so, and still helps", async ({ page }) => {
    const html = await (await page.request.get("/federal/bills?status=IN_COMMITTEE")).text();
    expect(html).toContain("bill-card");
    await page.goto("/federal/bills/us-119-s-4465");
    await expect(main(page).getByTestId("digest")).toBeVisible();
  });

  test("jargon explains itself on tap", async ({ page, request }) => {
    const { items } = await (await request.get("/api/civic/floor")).json();
    test.skip(items.length === 0, "Nothing is scheduled");
    await page.goto("/federal/upcoming");
    await page.waitForLoadState("networkidle");
    await main(page).getByTestId("term-suspension-of-the-rules").first().click();
    await expect(page.getByTestId("term-explanation")).toContainText("two-thirds");
  });

  test("the timeline explains actions in plain words", async ({ page }) => {
    await page.goto("/federal/bills/us-119-s-4465");
    await expect(main(page).getByTestId("action-plain").first()).toContainText("It's now the law.");
  });

  test("topics are color coded and explained, and lead to bills", async ({ page }) => {
    await page.goto("/federal/topics");
    await expect(main(page).getByTestId("topic-family")).toHaveCount(8);
    await expect(main(page).getByTestId("topic-card").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.goto("/federal/topics/health");
    await expect(main(page)).toContainText("Health care");
    await expect(main(page).getByTestId("bill-card").first()).toBeVisible();
    expect((await page.goto("/federal/topics/not-a-topic"))?.status()).toBe(404);
  });

  test("the lingo page explains how a bill becomes a law", async ({ page }) => {
    await page.goto("/learn");
    await expect(main(page).getByTestId("bill-path")).toBeVisible();
    await expect(main(page)).toContainText("Cloture");
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("members", () => {
  const MEMBER = "/federal/legislators/T000193";

  test("show job measures compared with their chamber, and charts by policy", async ({ page }) => {
    await page.goto(MEMBER);
    await expect(main(page).getByTestId("member-stats")).toContainText("Attendance");
    await expect(main(page).getByTestId("member-stats")).toContainText("of the House");
    await expect(main(page).getByTestId("sponsored-chart").locator("li").first()).toBeVisible();
    await expect(main(page).getByTestId("vote-split").locator("li").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("senators get the same", async ({ page }) => {
    await page.goto("/federal/legislators/B001261");
    await expect(main(page).getByTestId("member-stats")).toContainText("of the Senate");
    await expect(main(page).getByTestId("sponsored-chart").locator("li").first()).toBeVisible();
  });

  test("the list is paged, and filtering still finds everyone", async ({ page }) => {
    await page.goto("/federal/legislators");
    await expect(main(page).getByTestId("member-card")).toHaveCount(48);
    await expect(main(page)).toContainText("current members of Congress");
    await main(page).getByTestId("next-members").click();
    await expect(page).toHaveURL(/page=2/);
    await expect(main(page).getByTestId("member-card")).toHaveCount(48);
    await page.goto("/federal/legislators?state=TX&chamber=UPPER");
    await expect(main(page).getByTestId("member-card")).toHaveCount(2);
    await expect(main(page).getByTestId("member-pages")).toHaveCount(0);
  });

  test("hide how they voted until you open it", async ({ page }) => {
    await page.goto(MEMBER);
    await expect(main(page).getByTestId("member-votes")).toBeHidden();
    await main(page).getByTestId("member-votes-reveal-trigger").click();
    await expect(main(page).getByTestId("member-votes")).toBeVisible();
  });
});

test.describe("every main page", () => {
  for (const path of ["/", "/dashboard", "/vote", "/reps", "/federal/bills", "/federal/upcoming", "/federal/legislators", "/federal/topics", "/learn"]) {
    test(`${path} fits the screen and logs no errors`, async ({ page }) => {
      await loginAs(page, "test_member");
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message.slice(0, 200)));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text().slice(0, 200));
      });
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState("networkidle");
      await expectNoHorizontalOverflow(page);
      expect(errors).toEqual([]);
    });
  }

  for (const path of ["/federal/upcoming", "/federal/bills/us-119-s-4465", "/federal/legislators/T000193", "/federal/topics", "/learn", "/reps"]) {
    test(`${path} offers a next step`, async ({ page }) => {
      await page.goto(path);
      await expect(main(page).getByTestId("next-step").first()).toBeVisible();
    });
  }

  test("phones get thumb-reach navigation, and larger screens don't", async ({ page }, testInfo) => {
    await page.goto("/dashboard");
    const nav = page.getByTestId("bottom-nav");
    if (testInfo.project.name.startsWith("phone")) {
      await expect(nav).toBeVisible();
      await nav.getByRole("link", { name: "Vote" }).click();
      await expect(page).toHaveURL(/\/vote/);
      await expect(nav.getByRole("link", { name: "Vote" })).toHaveAttribute("aria-current", "page");
    } else if (testInfo.project.name === "desktop") {
      await expect(nav).toBeHidden();
    }
  });

  test("the page follows a dark device, until someone chooses", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto("/federal/bills");
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await context.close();
  });
});
