import { expect, test } from "@playwright/test";
import { blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

// A real bill with votes, text, and a summary, once the pipeline has run.
const LAW = "/bills/us-119-s-4465";

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("upcoming votes", () => {
  test("shows what the schedule API has, or says nothing's scheduled", async ({ page, request }) => {
    const { items } = await (await request.get("/api/civic/floor")).json();
    const response = await page.goto("/bills/upcoming");
    expect(response?.status()).toBe(200);
    await expectNoHorizontalOverflow(page);
    if (items.length === 0) {
      await expect(page.getByText("Nothing on the House schedule right now")).toBeVisible();
      return;
    }
    await expect(page.getByTestId("floor-item")).toHaveCount(items.length);
    await expect(page.getByTestId("floor-item").first()).toContainText(items[0].legislationRef);
  });

  test("a scheduled bill links through to a page that says it's scheduled", async ({
    page,
    request,
  }) => {
    const { items } = await (await request.get("/api/civic/floor")).json();
    const upcoming = items.find(
      (item: { slug: string | null; week: string }) => item.slug && !item.week.startsWith("Last"),
    );
    test.skip(!upcoming, "Nothing is scheduled this week or next");
    await page.goto(`/bills/${upcoming.slug}`);
    await expect(page.getByTestId("floor-notice")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("you can vote on a scheduled bill right from the list", async ({ page, request }) => {
    const { items } = await (await request.get("/api/civic/floor")).json();
    test.skip(!items.some((item: { slug: string | null }) => item.slug), "No linked bills");
    await loginAs(page, "test_member");
    await page.goto("/bills/upcoming");
    const card = page.getByTestId("floor-item").filter({ has: page.getByTestId("vote-support") }).first();
    const support = card.getByTestId("vote-support");
    const before = await support.getAttribute("aria-pressed");
    await support.click();
    await expect(support).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
    await page.waitForLoadState("networkidle");
    await support.click();
    await expect(support).toHaveAttribute("aria-pressed", before ?? "false");
  });

  test("the dashboard and bills list point to it", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("main").getByTestId("dashboard-floor")).toBeVisible();
    await page.goto("/bills");
    await page.getByTestId("upcoming-link").click();
    await expect(page).toHaveURL(/\/bills\/upcoming/);
  });
});

test.describe("bill details", () => {
  test("every member's vote can be listed and filtered", async ({ page }) => {
    await page.goto(LAW);
    await page.getByTestId("roll-call-members-link").first().click();
    await expect(page).toHaveURL(/\/votes\/\d+/);
    const members = page.getByTestId("roll-call-members").locator("li");
    const everyone = await members.count();
    expect(everyone).toBeGreaterThan(400);
    await page.getByLabel("Party").selectOption("R");
    await page.getByRole("button", { name: "Filter" }).click();
    await expect(page).toHaveURL(/party=R/);
    await expect(members.first()).toContainText("Republican");
    expect(await members.count()).toBeLessThan(everyone);
    await expectNoHorizontalOverflow(page);
  });

  test("a vote from another bill's address is a 404", async ({ page }) => {
    await page.goto(LAW);
    const href = await page.getByTestId("roll-call-members-link").first().getAttribute("href");
    const wrongBill = href!.replace("us-119-s-4465", "us-119-hr-2388");
    expect((await page.goto(wrongBill))?.status()).toBe(404);
  });

  test("unknown or malformed text and vote addresses are 404s", async ({ page }) => {
    expect((await page.goto("/bills/us-119-hr-999999/text"))?.status()).toBe(404);
    expect((await page.goto(`${LAW}/votes/not-a-number`))?.status()).toBe(404);
  });

  test("the full text opens on its own page", async ({ page }) => {
    await page.goto(LAW);
    await page.getByTestId("bill-text-link").click();
    await expect(page.getByTestId("bill-full-text")).toBeVisible();
    await expect(page.getByTestId("bill-full-text")).not.toContainText("<html");
    await expectNoHorizontalOverflow(page);
  });

  test("cosponsors expand", async ({ page }) => {
    await page.goto("/bills/us-119-hr-2388");
    const cosponsors = page.getByTestId("cosponsors");
    if (await cosponsors.count()) {
      await cosponsors.locator("summary").click();
      await expect(cosponsors.locator("li").first()).toBeVisible();
    }
  });

  test("share copies the link where there's no share sheet", async ({ page, context, browserName }, testInfo) => {
    test.skip(browserName !== "chromium" || testInfo.project.name !== "desktop", "Desktop Chromium only");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(LAW);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    });
    await page.getByTestId("share-button").click();
    await expect(page.getByText("Link copied")).toBeVisible();
  });
});

test.describe("AI and read-aloud, with the paid services stubbed", () => {
  test("signed out, asking opens the login dialog and sends nothing", async ({ page }) => {
    test.setTimeout(60_000);
    let called = false;
    await page.route("**/api/civic/bills/ask", (route) => {
      called = true;
      return route.fulfill({ status: 503, json: {} });
    });
    await page.goto(LAW);
    await page.waitForLoadState("networkidle");
    await page.getByTestId("bill-ask-ai").getByRole("button").first().click();
    await expect(page.getByText("Log in or sign up")).toBeVisible();
    expect(called).toBe(false);
  });

  test("a question shows its answer as plain text", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.route("**/api/civic/bills/ask", (route) =>
      route.fulfill({ json: { content: "A stubbed <b>answer</b>." } }),
    );
    await page.goto(LAW);
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "Ask about this bill" }).fill("What does it do?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.getByTestId("chat-user")).toHaveText("What does it do?");
    await expect(page.getByTestId("chat-assistant")).toHaveText("A stubbed <b>answer</b>.");
    await expectNoHorizontalOverflow(page);
  });

  test("a failed answer shows the reason, and keeps the question", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.route("**/api/civic/bills/ask", (route) =>
      route.fulfill({ status: 503, json: { error: "Questions aren't available right now." } }),
    );
    await page.goto(LAW);
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "Ask about this bill" }).fill("Anything?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "aren't available" })).toBeVisible();
    await expect(page.getByTestId("chat-user")).toHaveText("Anything?");
  });

  test("listen sends one request, only when clicked, and reports failure", async ({ page }) => {
    await loginAs(page, "test_member");
    let calls = 0;
    await page.route("**/api/civic/bills/listen", (route) => {
      calls += 1;
      return route.fulfill({ status: 503, json: { error: "Listening isn't available right now." } });
    });
    await page.goto(LAW);
    await page.waitForLoadState("networkidle");
    expect(calls).toBe(0);
    await page.getByTestId("bill-listen").click();
    await expect(page.getByText("Listening isn't available right now.")).toBeVisible();
    expect(calls).toBe(1);
  });
});

test.describe("members", () => {
  const MEMBER = "/legislators/federal/T000193";

  test("show their record and can be saved to the dashboard", async ({ page }, testInfo) => {
    // Each screen width gets its own account, because these run at the same time.
    const accounts: Record<string, string> = {
      "phone-small": "test_member",
      phone: "test_supporter",
      tablet: "test_admin",
      desktop: "test_superadmin",
    };
    await loginAs(page, accounts[testInfo.project.name] ?? "test_member");
    await page.goto(MEMBER);
    await page.waitForLoadState("networkidle");
    const button = page.getByTestId("favorite-member");
    // A test that stopped partway may have left this saved.
    if ((await button.getAttribute("aria-pressed")) === "true") {
      const reset = page.waitForResponse("**/api/civic/people/favorite");
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "false");
      await reset;
    }
    const saved = page.waitForResponse("**/api/civic/people/favorite");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect((await saved).ok()).toBe(true);
    await page.goto("/dashboard");
    await expect(page.getByRole("main").getByTestId("saved-members")).toBeVisible();
    await page.goto(MEMBER);
    await page.waitForLoadState("networkidle");
    const removed = page.waitForResponse("**/api/civic/people/favorite");
    await page.getByTestId("favorite-member").click();
    await expect(page.getByTestId("favorite-member")).toHaveAttribute("aria-pressed", "false");
    expect((await removed).ok()).toBe(true);
  });

  test("have pages of votes", async ({ page }) => {
    await page.goto(MEMBER);
    await page.getByTestId("member-votes-reveal").locator("summary").click();
    await page.getByRole("link", { name: "Older votes" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("link", { name: "Newer votes" })).toBeVisible();
    await expect(page.getByTestId("member-votes").locator("li").first()).toBeVisible();
  });
});

test.describe("site-wide", () => {
  test("pages log no errors in the browser", async ({ page }, testInfo) => {
    test.skip(!["phone", "desktop"].includes(testInfo.project.name), "One phone and one desktop");
    test.setTimeout(180_000);
    await loginAs(page, "test_member");
    const errors: string[] = [];
    let current = "";
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${current}: ${message.text().slice(0, 200)}`);
    });
    page.on("pageerror", (error) => errors.push(`${current}: ${error.message.slice(0, 200)}`));
    for (const path of [
      "/dashboard",
      "/bills",
      "/bills/upcoming",
      LAW,
      `${LAW}/text`,
      "/legislators",
      "/legislators/federal/T000193",
      "/feedback",
      "/settings",
      "/forum",
    ]) {
      current = path;
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });

  test("the footer is there and its links work", async ({ page }) => {
    await page.goto("/bills");
    const footer = page.getByTestId("site-footer");
    await expect(footer).toBeVisible();
    await footer.getByRole("link", { name: "Feedback" }).click();
    await expect(page).toHaveURL(/\/feedback/);
  });

  test("feedback can be sent when signed in", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.goto("/feedback");
    await page.getByTestId("feedback-feature").click();
    await page.getByTestId("feedback-text").fill("An automated test of the feedback form.");
    await page.getByTestId("feedback-submit").click();
    await expect(page.getByTestId("feedback-sent")).toBeVisible();
  });

  test("feedback asks you to sign in first", async ({ page }) => {
    await page.goto("/feedback");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("feedback-text").fill("Hello");
    await page.getByTestId("feedback-submit").click();
    await expect(page.getByText("Log in or sign up")).toBeVisible();
  });

  for (const path of ["/federal/bills", "/api/bills/recent-bills", "/api/dev/test", "/dev/add-contacts"]) {
    test(`${path} no longer serves the old app`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect([307, 308, 404, 405]).toContain(response.status());
    });
  }
});
