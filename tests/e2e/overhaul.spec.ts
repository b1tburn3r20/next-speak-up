// Federal routes, relative dates, onboarding, the tailored dashboard, search, and permissions.
import { expect, test, type Page } from "@playwright/test";
import { blockPaidServices, chooseOption, loginAs, BASE_URL } from "./helpers";

const ORIGIN = { origin: BASE_URL };

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

async function signUp(page: Page, prefix: string) {
  const username = `e2e_${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  const response = await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  expect(response.status()).toBe(201);
  return username;
}

async function finishSetup(page: Page, state = "WY") {
  const saved = await page.request.post("/api/civic/location", {
    headers: ORIGIN,
    data: { regionCode: state, districtCode: "AL" },
  });
  expect(saved.ok()).toBeTruthy();
  const done = await page.request.patch("/api/civic/onboarding", {
    headers: ORIGIN,
    data: { complete: true },
  });
  expect(done.ok()).toBeTruthy();
}

async function openSearch(page: Page) {
  await page.locator('[data-testid="site-search"]:visible, [data-testid="site-search-mobile"]:visible').first().click();
  await expect(page.getByTestId("search-dialog")).toBeVisible();
}

test.describe("federal routes", () => {
  for (const [from, to] of [
    ["/bills", "/federal/bills"],
    ["/bills/upcoming", "/federal/upcoming"],
    ["/bills/us-119-hr-2388", "/federal/bills/us-119-hr-2388"],
    ["/legislators", "/federal/legislators"],
    ["/topics", "/federal/topics"],
    ["/topics/health", "/federal/topics/health"],
  ]) {
    test(`${from} moves to ${to}`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(new RegExp(`${to}$`));
    });
  }

  test("the federal page leads to everything federal", async ({ page }) => {
    await page.goto("/federal");
    for (const name of ["Upcoming votes", "Bills", "Legislators", "Topics"]) {
      await expect(page.getByRole("main").getByRole("link", { name, exact: true })).toBeVisible();
    }
  });

  test("a member's page has the new address", async ({ page }) => {
    await page.goto("/federal/legislators");
    await page.getByTestId("member-card").first().click();
    await expect(page).toHaveURL(/\/federal\/legislators\/[A-Z0-9]+$/);
  });
});

test.describe("navigation", () => {
  test("only one link is active on upcoming votes", async ({ page, isMobile }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("phone") || isMobile, "side nav is for larger screens");
    await page.goto("/federal/upcoming");
    const current = page.getByRole("navigation", { name: "Main" }).locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText("Upcoming Votes");
  });

  test("bills is active on a bill, and topics is under it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("phone"), "side nav is for larger screens");
    await page.goto("/federal/bills/us-119-hr-2388");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.locator('[aria-current="page"]')).toContainText("Bills");
    await page.goto("/federal/topics");
    await expect(nav.locator('[aria-current="page"]')).toContainText("Topics");
    await expect(nav.getByRole("link", { name: "Federal" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Legislators" })).toBeVisible();
  });

  test("the phone's tabs only light one up", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("phone"), "phones only");
    await page.goto("/federal/upcoming");
    await expect(page.getByTestId("bottom-nav").locator('[aria-current="page"]')).toHaveCount(1);
  });
});

test.describe("plain words", () => {
  test("topics don't talk about what's loaded", async ({ page }) => {
    await page.goto("/federal/topics");
    await expect(page.getByRole("main")).not.toContainText("loaded");
  });

  for (const path of ["/dashboard", "/federal/bills", "/federal/legislators", "/federal/upcoming", "/learn"]) {
    test(`${path} has no developer words`, async ({ page }) => {
      await page.goto(path);
      const text = (await page.getByRole("main").innerText()).toLowerCase();
      for (const word of [" loaded", "pipeline", "database", "imported"]) {
        expect(text, word).not.toContain(word);
      }
    });
  }
});

test.describe("relative dates", () => {
  test("every bill card says when, in words", async ({ page }) => {
    await page.goto("/federal/bills");
    const cards = page.getByTestId("bill-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(3);
    for (let index = 0; index < count; index += 1) {
      await expect(cards.nth(index).getByTestId("relative-date")).toHaveText(
        /(ago|today|yesterday)$/,
      );
    }
  });

  test("a bill's own page says when", async ({ page }) => {
    await page.goto("/federal/bills/us-119-s-4465");
    await expect(page.getByTestId("bill-when").getByTestId("relative-date")).toHaveText(/^Became law /);
  });

  test("a bill that became law says so", async ({ page }) => {
    await page.goto("/federal/bills?status=BECAME_LAW");
    const when = page.getByTestId("bill-card").first().getByTestId("relative-date");
    await expect(when).toHaveText(/^Became law /);
  });

  test("a small date has a thumb-sized target", async ({ page }) => {
    await page.goto("/federal/bills");
    await page.waitForLoadState("networkidle");
    const date = page.getByTestId("bill-card").first().getByTestId("relative-date");
    // Centered, so nothing fixed to the screen, like the phone's tab bar, is on top of it.
    await date.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect(async () => {
      const box = await date.boundingBox();
      const hit = await page.evaluate(
        ([x, y]) => Boolean(document.elementFromPoint(x, y)?.closest('[data-testid="relative-date"]')),
        [box!.x + box!.width / 2, box!.y - 8],
      );
      expect(hit).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test("hovering shows the exact date, after a moment", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("phone"), "phones tap instead");
    await page.goto("/federal/bills");
    const when = page.getByTestId("bill-card").first().getByTestId("relative-date");
    await when.hover();
    const card = page.getByTestId("relative-date-card");
    await expect(card).toBeVisible();
    await expect(card).toHaveText(/\w+day, \w+ \d+, \d{4}/);
  });

  test("tapping on a phone shows the exact date, and stays on the page", async ({ browser }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("phone"), "phones only");
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 800 },
      baseURL: BASE_URL,
    });
    const page = await context.newPage();
    await page.goto("/federal/bills");
    const url = page.url();
    await page.getByTestId("bill-card").first().getByTestId("relative-date").tap();
    const dialog = page.getByTestId("relative-date-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveText(/\w+day, \w+ \d+, \d{4}/);
    expect(page.url()).toBe(url);
    await context.close();
  });

  test("upcoming bills don't claim a vote will happen", async ({ page }) => {
    await page.goto("/federal/upcoming");
    const items = page.getByTestId("floor-when");
    if ((await items.count()) === 0) test.skip(true, "nothing scheduled");
    await expect(items.first()).toContainText(/House vote possible|Listed for a House vote/);
  });
});

test.describe("loading bar", () => {
  test("moves and then finishes on a page change", async ({ page }) => {
    await page.goto("/federal/bills");
    // A click before the page has hydrated happens before the bar is listening.
    await page.waitForLoadState("networkidle");
    const bar = page.getByTestId("top-progress-bar");
    await expect(bar).toHaveAttribute("data-active", "false");
    await page.route("**/federal/topics**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });
    // Read from inside the page. A locator can stall while a navigation is in flight, then read the
    // next page, where the bar has already finished.
    const activeWhileLoading = await page.evaluate(async () => {
      const link = document.createElement("a");
      link.href = "/federal/topics";
      link.textContent = "go";
      document.body.append(link);
      link.click();
      await new Promise((resolve) => setTimeout(resolve, 200));
      return document.querySelector('[data-testid="top-progress-bar"]')?.getAttribute("data-active");
    });
    expect(activeWhileLoading).toBe("true");
    await expect(page).toHaveURL(/\/federal\/topics/);
    await expect(bar).toHaveAttribute("data-active", "false");
  });
});

test.describe("onboarding", () => {
  test("three steps, then the dashboard", async ({ page }) => {
    await signUp(page, "ob");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/onboarding$/);

    const progress = page.getByTestId("onboarding-progress");
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    await expect(progress).toHaveAttribute("aria-valuemax", "3");
    await page.getByRole("button", { name: "25 to 34" }).click();

    await expect(progress).toHaveAttribute("aria-valuenow", "2");
    await chooseOption(page, "Or choose your state", "Wyoming", page.getByTestId("onboarding-card"));
    await expect(page.getByTestId("save-location")).toBeVisible();
    await page.getByTestId("save-location").click();
    await expect(page.getByTestId("onboarding-reps")).toContainText("Barrasso");
    await expect(page.getByTestId("onboarding-reps")).toContainText("Hageman");
    await page.getByTestId("onboarding-next").click();

    await expect(progress).toHaveAttribute("aria-valuenow", "3");
    const topics = page.getByTestId("topic-options");
    // Energy is what Wyoming's suggestion leads with, and housing comes from the age.
    await expect(topics.getByRole("button", { name: "Energy" })).toHaveAttribute("aria-pressed", "true");
    await expect(
      topics.getByRole("button", { name: "Housing and Community Development" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("show-all-topics").click();
    await topics.getByRole("button", { name: "Animals" }).click();
    await page.getByTestId("onboarding-finish").click();

    await expect(page).toHaveURL(/\/dashboard$/);
    const main = page.getByRole("main");
    await expect(main.getByTestId("dashboard-reps")).toContainText("Hageman");
    await expect(main.getByTestId("dashboard-topics")).toContainText("Animals");
    // A programmatic redirect mustn't leave the loading bar stuck.
    await expect(page.getByTestId("top-progress-bar")).toHaveAttribute("data-active", "false");
    // Their own House rep comes first.
    await expect(main.getByTestId("dashboard-reps").getByTestId("rep-report-card").first()).toContainText("Hageman");
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("only one card can be used at a time, and you can go back", async ({ page }) => {
    await signUp(page, "oc");
    await page.goto("/onboarding");
    await expect(page.locator('[data-testid="onboarding-card"]')).toHaveCount(1);
    await page.getByRole("button", { name: "18 to 24" }).click();
    await expect(page.getByTestId("onboarding-progress")).toHaveAttribute("aria-valuenow", "2");
    await expect(page.getByRole("button", { name: "18 to 24" })).toBeHidden();
    await page.getByTestId("onboarding-back").click();
    await expect(page.getByRole("button", { name: "18 to 24" })).toBeVisible();
    await expect(page.getByRole("button", { name: "18 to 24" })).toHaveAttribute("aria-pressed", "true");
  });

  test("finds someone automatically if the browser allows it", async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 41.14, longitude: -104.82 },
      permissions: ["geolocation"],
      baseURL: BASE_URL,
    });
    const page = await context.newPage();
    await blockPaidServices(page);
    await page.route("**/api/civic/location", (route) =>
      route.fulfill({ json: { regionCode: "WY", districtCode: "AL" } }),
    );
    await signUp(page, "og");
    await page.goto("/onboarding");
    await page.getByRole("button", { name: "35 to 44" }).click();
    await expect(page.getByTestId("onboarding-reps")).toContainText("Barrasso");
    await context.close();
  });

  test("only knowing your state still works", async ({ page }) => {
    await signUp(page, "os");
    await page.goto("/onboarding");
    await page.getByRole("button", { name: "I'd rather not say" }).click();
    await chooseOption(page, "Or choose your state", "Texas", page.getByTestId("onboarding-card"));
    await expect(page.getByLabel("District")).toBeVisible();
    await page.getByTestId("save-location").click();
    await expect(page.getByTestId("onboarding-reps").locator("li")).toHaveCount(2);
  });

  test("skipping works, and doesn't ask again", async ({ page }) => {
    await signUp(page, "ok");
    await page.goto("/federal/bills");
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByTestId("onboarding-skip").click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/federal/bills");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/federal\/bills$/);
  });

  test("signed out goes home", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/localhost:3100\/$/);
  });

  test("rejects a topic that doesn't exist", async ({ page }) => {
    await signUp(page, "ox");
    const response = await page.request.patch("/api/civic/onboarding", {
      headers: ORIGIN,
      data: { topics: ["Not a real topic"] },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("dashboard", () => {
  test("shows reps, the next bill, and what reps work on", async ({ page }) => {
    await signUp(page, "db");
    await finishSetup(page);
    await page.goto("/dashboard");
    const main = page.getByRole("main");
    await expect(main.getByTestId("dashboard-reps").getByTestId("rep-report-card")).toHaveCount(3);
    const next = main.getByTestId("next-bill");
    await expect(next).toBeVisible();
    await expect(next.getByRole("heading")).not.toBeEmpty();
    // Where a bill stands waits until after the vote.
    await expect(next.getByTestId("relative-date")).toHaveCount(0);

    const work = main.getByTestId("dashboard-rep-work").getByTestId("rep-work");
    await expect(work).toHaveCount(3);
    await expect(work.first().getByTestId("sponsored-areas")).toBeVisible();
    await expect(work.first().getByTestId("success-rate")).toContainText(/\d+%/);
    await expect(work.first().getByTestId("success-rate")).toContainText(/\d+ of \d+ bills? they sponsored became law/);
    await next.getByRole("heading").getByRole("link").click();
    await expect(page).toHaveURL(/\/federal\/bills\/us-/);
  });

  test("the next bill doesn't reveal how a rep voted", async ({ page }) => {
    await signUp(page, "dr");
    await finishSetup(page);
    await page.goto("/dashboard");
    const text = await page.getByTestId("next-bill").innerText();
    expect(text).not.toMatch(/voted (yes|no|yea|nay)/i);
  });

  test("the next bill puts tracked topics ahead of the rest", async ({ page }) => {
    await signUp(page, "dt");
    await finishSetup(page);
    const saved = await page.request.post("/api/civic/topics", {
      headers: ORIGIN,
      data: { policyArea: "Animals", tracked: true },
    });
    expect(saved.ok()).toBeTruthy();
    await page.goto("/dashboard");
    await expect(page.getByRole("main").getByTestId("dashboard-topics")).toContainText("Animals");
  });

  test("a topic page can start and stop tracking", async ({ page }) => {
    await signUp(page, "dg");
    await finishSetup(page);
    await page.goto("/federal/topics/health");
    await page.waitForLoadState("networkidle");
    const button = page.getByTestId("track-topic");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    const saved = page.waitForResponse("**/api/civic/topics");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await saved;
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("search", () => {
  test("finds a person in their own group, even with a typo", async ({ page }) => {
    await page.goto("/federal/bills");
    await openSearch(page);
    await page.getByTestId("site-search-input").fill("barrasoo");
    const group = page.locator('[data-provider="senators"]');
    await expect(group.getByTestId("search-result").first()).toContainText("Barrasso");
    await group.getByTestId("search-result").first().click();
    await expect(page).toHaveURL(/\/federal\/legislators\/[A-Z0-9]+$/);
    await expect(page.getByTestId("search-dialog")).toBeHidden();
  });

  test("separates senators from representatives", async ({ page }) => {
    await page.goto("/federal/bills");
    await openSearch(page);
    await page.getByTestId("site-search-input").fill("wyoming");
    await expect(page.locator('[data-provider="senators"]').getByTestId("search-result")).toHaveCount(2);
    await expect(page.locator('[data-provider="representatives"]').getByTestId("search-result")).toHaveCount(1);
  });

  test("finds a bill by number and by words", async ({ page }) => {
    await page.goto("/federal/bills");
    await openSearch(page);
    const input = page.getByTestId("site-search-input");
    await input.fill("H.R. 2388");
    const bills = page.locator('[data-provider="bills"]');
    await expect(bills.getByTestId("search-result").first()).toContainText("H.R. 2388");
    await input.fill("appropriations");
    await expect(bills.getByTestId("search-result").first()).toBeVisible();
  });

  test("each group loads on its own, with a skeleton while it waits", async ({ page }) => {
    await page.route("**/api/search/bills?**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });
    await page.goto("/federal/bills");
    await openSearch(page);
    await page.getByTestId("site-search-input").fill("wyoming");
    await expect(page.locator('[data-provider="senators"]').getByTestId("search-result").first()).toBeVisible();
    await expect(page.locator('[data-provider="bills"]').getByTestId("search-skeleton")).toBeVisible();
  });

  test("one broken group doesn't break the rest", async ({ page }) => {
    await page.route("**/api/search/bills?**", (route) => route.fulfill({ status: 500, json: {} }));
    await page.goto("/federal/bills");
    await openSearch(page);
    await page.getByTestId("site-search-input").fill("wyoming");
    await expect(page.getByTestId("search-group-error")).toContainText("Bills");
    await expect(page.locator('[data-provider="senators"]').getByTestId("search-result").first()).toBeVisible();
  });

  test("keyboard: open with a shortcut, enter picks the top result", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("phone"), "needs a keyboard");
    await page.goto("/federal/bills");
    await page.keyboard.press("Control+k");
    const input = page.getByTestId("site-search-input");
    await expect(input).toBeFocused();
    await input.fill("wyoming");
    // Representatives come before senators, and later results mustn't move the highlight off them.
    const top = page.locator('[data-provider="representatives"]').getByTestId("search-result").first();
    await expect(top).toHaveAttribute("data-selected", "true");
    await page.locator('[data-provider="bills"]').getByTestId("search-result").first().waitFor();
    await expect(top).toHaveAttribute("data-selected", "true");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/federal\/legislators\//);
  });

  test("suggests places before anything's typed", async ({ page }) => {
    await page.goto("/federal/bills");
    await openSearch(page);
    await expect(page.locator('[data-provider="pages"]').getByTestId("search-result").first()).toBeVisible();
  });

  test("says so when nothing matches", async ({ page }) => {
    await page.goto("/federal/bills");
    await openSearch(page);
    await page.getByTestId("site-search-input").fill("zzzzqqqq");
    await expect(page.getByTestId("search-empty")).toBeVisible();
  });

  test("accounts only show up for people with permission", async ({ page }) => {
    const response = await page.request.get("/api/search/users?q=test");
    expect(response.status()).toBe(404);
    const list = await (await page.request.get("/api/search")).json();
    expect(list.providers.map((provider: { id: string }) => provider.id)).not.toContain("users");
  });
});

test.describe("permissions", () => {
  test("a member can't use admin routes, or make themselves an admin", async ({ page }) => {
    await signUp(page, "pm");
    for (const [method, url, data] of [
      ["put", "/api/admin/roles/assign-role-to-user", { userId: "x", roleId: 1 }],
      ["post", "/api/admin/roles/create-role", { roleName: "Hacker" }],
      ["post", "/api/admin/permissions/create-permission", { permissionName: "hack" }],
      ["put", "/api/admin/roles/assign-permission-to-role", { permissionId: 1, roleId: 2 }],
      ["put", "/api/admin/roles/remove-permission-from-role", { permissionId: 1, roleId: 1 }],
      ["get", "/api/admin/roles/get-all-roles", undefined],
      ["get", "/api/admin/roles/get-role-data?roleId=1", undefined],
      ["get", "/api/admin/roles/check-role?roleName=Admin", undefined],
      ["get", "/api/admin/permissions/get-all-permissions", undefined],
      ["get", "/api/admin/permissions/check-permission?permissionName=x", undefined],
    ] as const) {
      const response = await page.request.fetch(url, { method, headers: ORIGIN, data });
      expect(response.status(), url).toBe(403);
    }
  });

  test("a member can't open another person's admin page", async ({ page }) => {
    await signUp(page, "pp");
    await page.goto("/admin/permissions/1");
    await expect(page).not.toHaveURL(/admin/);
  });

  test("signed out, admin routes want a sign-in", async ({ page }) => {
    const response = await page.request.get("/api/admin/roles/get-all-roles");
    expect(response.status()).toBe(401);
  });

  test("an admin sees admin links, and can search accounts", async ({ page }) => {
    await loginAs(page, "test_admin");
    const list = await (await page.request.get("/api/search")).json();
    expect(list.providers.map((provider: { id: string }) => provider.id)).toContain("users");
    const found = await (await page.request.get("/api/search/users?q=test_member")).json();
    expect(found.results[0].title).toBe("test_member");
    await page.goto("/admin/permissions");
    await expect(page).toHaveURL(/admin\/permissions/);
  });

});
