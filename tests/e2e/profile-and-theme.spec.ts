import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

const ORIGIN = { origin: BASE_URL };

async function newUser(page: Page, details: Record<string, unknown> = {}) {
  const username = `pro_${Math.random().toString(36).slice(2, 10)}`;
  const email = `${username}@coolbills.test`;
  await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email, password: "a good password" },
  });
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
  await page.request.patch("/api/user/settings", {
    headers: ORIGIN,
    data: { name: "Secret Realname", state: "Iowa", district: 3, ageRange: "FROM_25_TO_34", householdIncome: "UNDER_25000", ...details },
  });
  const session = await (await page.request.get("/api/auth/session")).json();
  return { username, email, id: session.user.id as string };
}

const profile = (page: Page, changes: Record<string, unknown>) =>
  page.request.patch("/api/user/profile", { headers: ORIGIN, data: changes });

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("privacy", () => {
  test("by default, the server's HTML has nothing personal for anyone else", async ({ page, browser }) => {
    const { id, email } = await newUser(page);
    const stranger = await browser.newContext({ baseURL: BASE_URL });
    const html = await (await stranger.request.get(`/users/${id}`)).text();
    for (const secret of ["Secret Realname", email, "Iowa", "25 to 34", "25-34", "Under $25", "under $25"]) {
      expect(html, secret).not.toContain(secret);
    }
    expect(html).toContain('data-testid="profile-stats"');
    await stranger.close();
  });

  test("each switch shares only what it says", async ({ page, browser }) => {
    const { id, username } = await newUser(page);
    await profile(page, { showState: true });
    const stranger = await browser.newContext({ baseURL: BASE_URL });
    const visitor = await stranger.newPage();
    await visitor.goto(`/users/${id}`);
    await expect(visitor.getByRole("main").getByTestId("profile-state")).toContainText("Iowa");
    await expect(visitor.getByRole("main").getByTestId("profile-district")).toHaveCount(0);
    await expect(visitor.getByRole("main").getByTestId("profile-age")).toHaveCount(0);
    await expect(visitor.getByRole("main").getByTestId("profile-income")).toHaveCount(0);
    await expect(visitor.getByRole("main").getByTestId("profile-title")).toHaveText(username);

    await profile(page, { showDistrict: true, showName: true, showAgeRange: true, showIncome: true });
    await visitor.reload();
    await expect(visitor.getByRole("main").getByTestId("profile-district")).toContainText("3");
    await expect(visitor.getByRole("main").getByTestId("profile-title")).toHaveText("Secret Realname");
    await expect(visitor.getByRole("main").getByTestId("profile-age")).toBeVisible();
    await expect(visitor.getByRole("main").getByTestId("profile-income")).toBeVisible();
    await stranger.close();
  });

  test("a district never shows without its state", async ({ page, browser }) => {
    const { id, username } = await newUser(page);
    await profile(page, { showDistrict: true });
    const stranger = await browser.newContext({ baseURL: BASE_URL });
    const html = await (await stranger.request.get(`/users/${id}`)).text();
    expect(html).not.toContain("profile-district");
    await stranger.close();
  });

  test("a private profile shows others nothing but that, and still opens for its owner", async ({ page, browser }) => {
    const { id, username } = await newUser(page);
    await profile(page, { isPublic: false, showName: true, about: "my secret about" });
    const stranger = await browser.newContext({ baseURL: BASE_URL });
    const html = await (await stranger.request.get(`/users/${id}`)).text();
    expect(html).toContain("This profile is private");
    for (const secret of ["my secret about", "Secret Realname", "profile-stats"]) expect(html).not.toContain(secret);
    await stranger.close();

    await page.goto(`/users/${id}`);
    await expect(page.getByTestId("profile-owner-note")).toContainText("Only you can see this page");
    await expect(page.getByTestId("profile-about")).toHaveText("my secret about");
  });

  test("voting topics stay hidden until shared", async ({ page, browser }) => {
    const { id, username } = await newUser(page);
    await page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug: "us-119-s-4465", position: "NAY" } });
    const stranger = await browser.newContext({ baseURL: BASE_URL });
    expect(await (await stranger.request.get(`/users/${id}`)).text()).not.toContain("Armed Forces");
    await profile(page, { showVotingTopics: true });
    const visitor = await stranger.newPage();
    await visitor.goto(`/users/${id}`);
    await visitor.getByTestId("tab-topics").click();
    await expect(visitor.getByTestId("lean-row").first()).toContainText("Armed Forces");
    await stranger.close();
  });

  test("profiles stay out of search engines", async ({ page }) => {
    const { id, username } = await newUser(page);
    const html = await (await page.request.get(`/users/${id}`)).text();
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });

  test("the old forum profile link can't get around a private profile", async ({ page, browser }) => {
    const { id, username } = await newUser(page);
    await profile(page, { isPublic: false });
    const stranger = await browser.newContext({ baseURL: BASE_URL });
    const visitor = await stranger.newPage();
    await visitor.goto(`/community/users/${id}`);
    await expect(visitor).toHaveURL(new RegExp(`/users/${id}$`));
    await expect(visitor.getByTestId("profile-private")).toBeVisible();
    await stranger.close();
  });

  test("you can only change your own, and unknown fields are refused", async ({ page }) => {
    await newUser(page);
    expect((await profile(page, { isPublic: "yes" })).status()).toBe(400);
    expect((await profile(page, { userId: "someone-else", about: "hi" })).status()).toBe(400);
    expect((await profile(page, { about: "x".repeat(501) })).status()).toBe(400);
    await page.context().clearCookies();
    expect((await profile(page, { about: "hi" })).status()).toBe(401);
  });
});

test.describe("the profile page", () => {
  test("shows status, stats, and an about me as plain text", async ({ page }) => {
    const { id, username } = await newUser(page);
    await profile(page, { about: "<script>alert(1)</script> I care about water." });
    await page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug: "us-119-s-4465", position: "YEA" } });
    await page.goto(`/users/${id}`);
    await expect(page.getByTestId("profile-status")).toHaveText("Member");
    await expect(page.getByTestId("profile-about")).toContainText("<script>alert(1)</script>");
    await expect(page.getByTestId("profile-stats")).toContainText("Newcomer");
    await expect(page.getByTestId("profile-stats")).toContainText("Votes");
    await expectNoHorizontalOverflow(page);
  });

  test("it's a wide social page, with a cover, a big picture, and tabs", async ({ page }, testInfo) => {
    const { id } = await newUser(page);
    await page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug: "us-119-s-4465", position: "YEA" } });
    await page.goto(`/users/${id}`);
    await expect(page.getByTestId("profile-cover")).toBeVisible();
    await expect(page.getByTestId("profile-avatar")).toBeVisible();
    await expect(page.getByTestId("profile-stat")).toHaveCount(6);
    await expect(page.getByTestId("profile-no-activity")).toBeVisible();
    await page.getByTestId("tab-badges").click();
    // This account has a state, so it has its reps, as well as its first vote.
    await expect(page.locator('[data-testid="profile-badge"][data-earned="true"]')).toHaveCount(2);
    await expectNoHorizontalOverflow(page);
    if (testInfo.project.name === "desktop") {
      const header = await page.getByTestId("profile-header").boundingBox();
      expect(header!.width).toBeGreaterThan(900);
    }
  });

  test("someone with no username has a real page, not a trip to settings", async ({ page }) => {
    const { id } = await newUser(page);
    // Cleared directly, because the settings form treats an unset username as unchanged.
    await page.request.patch("/api/user/settings", { headers: ORIGIN, data: { username: null } });
    await page.goto("/federal/bills");
    await page.locator('[data-testid="hud-streak"]:visible').first().click();
    await expect(page).toHaveURL(new RegExp(`/users/${id}$`));
    await expect(page.getByTestId("profile-title")).toHaveText("Coolbills member");
  });

  test("forum activity shows, and how someone voted never does", async ({ page, browser }) => {
    const { id } = await newUser(page);
    await page.request.post("/api/civic/bills/vote", { headers: ORIGIN, data: { slug: "us-119-s-4465", position: "NAY" } });
    const stranger = await browser.newContext({ baseURL: BASE_URL });
    const html = await (await stranger.request.get(`/users/${id}`)).text();
    for (const secret of ["Armed Forces", "us-119-s-4465", "S. 4465"]) expect(html).not.toContain(secret);
    await stranger.close();
  });

  test("a missing person is a 404", async ({ page }) => {
    expect((await page.goto("/users/nobody-has-this-id"))?.status()).toBe(404);
  });

  test("shows an admin's status, and both kinds of admin look the same", async ({ page }) => {
    await loginAs(page, "test_superadmin");
    const session = await (await page.request.get("/api/auth/session")).json();
    await page.goto(`/users/${session.user.id}`);
    await expect(page.getByTestId("profile-status")).toHaveText("Admin");
  });

  test("editing happens right on the profile, in the same spot", async ({ page }) => {
    const { id, username } = await newUser(page);
    await page.goto(`/users/${id}`);
    await page.waitForLoadState("networkidle");
    const url = page.url();
    await page.getByTestId("profile-edit").click();
    expect(page.url()).toBe(url);
    await expect(page.getByTestId("profile-header")).toHaveAttribute("data-editing", "true");
    await page.getByTestId("profile-about-input").fill("Hello from my profile");
    await page.getByTestId("privacy-showState").click();
    await page.getByTestId("privacy-showDistrict").click();
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-header")).toHaveAttribute("data-editing", "false");
    await expect(page.getByTestId("profile-about")).toHaveText("Hello from my profile");
    await expect(page.getByTestId("profile-district")).toContainText("3");
    await expect(page.getByTestId("profile-title")).toContainText(username);
    await expectNoHorizontalOverflow(page);
    await page.reload();
    await expect(page.getByTestId("profile-about")).toHaveText("Hello from my profile");
  });

  test("cancel puts everything back", async ({ page }) => {
    const { id } = await newUser(page);
    await profile(page, { about: "the original" });
    await page.goto(`/users/${id}`);
    await page.waitForLoadState("networkidle");
    await page.getByTestId("profile-edit").click();
    await page.getByTestId("profile-about-input").fill("changed my mind");
    await page.getByTestId("profile-cancel").click();
    await expect(page.getByTestId("profile-about")).toHaveText("the original");
    await page.reload();
    await expect(page.getByTestId("profile-about")).toHaveText("the original");
  });

  test("a taken username shows why it didn't save, and stays in edit mode", async ({ page }) => {
    const { id } = await newUser(page);
    await page.goto(`/users/${id}`);
    await page.waitForLoadState("networkidle");
    await page.getByTestId("profile-edit").click();
    await page.getByTestId("edit-username-input").fill("test_admin");
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-edit-error")).toContainText("taken");
    await expect(page.getByTestId("profile-header")).toHaveAttribute("data-editing", "true");
  });

  test("the district switch waits for the state switch", async ({ page }) => {
    const { id } = await newUser(page);
    await page.goto(`/users/${id}?edit=1`);
    await expect(page.getByTestId("privacy-showDistrict")).toBeDisabled();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("privacy-showState").click();
    await expect(page.getByTestId("privacy-showDistrict")).toBeEnabled();
  });

  test("nobody else is sent the edit form or its private values", async ({ page, browser }) => {
    const { id } = await newUser(page);
    await profile(page, { isPublic: true });
    const context = await browser.newContext();
    const html = await (await context.request.get(`${BASE_URL}/users/${id}?edit=1`)).text();
    expect(html).toContain("profile-header");
    for (const secret of ["Secret Realname", "UNDER_25000", "FROM_25_TO_34", "profile-save"]) {
      expect(html, secret).not.toContain(secret);
    }
    await context.close();
  });

  test("settings no longer holds profile fields, and sends you to the profile", async ({ page }) => {
    const { id } = await newUser(page);
    await page.goto("/settings");
    await expect(page.getByTestId("settings-theme")).toBeVisible();
    await expect(page.getByTestId("profile-about-input")).toHaveCount(0);
    await page.getByTestId("settings-profile").click();
    await expect(page).toHaveURL(new RegExp(`/users/${id}\\?edit=1`));
    await expect(page.getByTestId("profile-save")).toBeVisible();
  });

  test("only a moderator can clear someone's about me", async ({ page }) => {
    const { id, username } = await newUser(page);
    await profile(page, { about: "something rude" });
    const denied = await page.request.delete("/api/user/profile", { headers: ORIGIN, data: { userId: id } });
    expect(denied.status()).toBe(403);
    await page.context().clearCookies();
    await loginAs(page, "test_superadmin");
    await page.goto(`/users/${id}`);
    await page.getByTestId("profile-clear-about").click();
    await expect(page.getByTestId("profile-no-about")).toBeVisible();
  });
});

test.describe("clickable progress", () => {
  test("the streak goes to your profile, and level to your progress", async ({ page }) => {
    const { id, username } = await newUser(page);
    await page.goto("/federal/bills");
    await page.locator('[data-testid="hud-streak"]:visible').first().click();
    await expect(page).toHaveURL(new RegExp(`/users/${id}$`));
    await page.locator('[data-testid="hud-link"]:visible').first().click();
    await expect(page).toHaveURL(/\/progress$/);
  });

  test("the dashboard's tiles go to the same places", async ({ page }) => {
    const { id, username } = await newUser(page);
    await page.goto("/dashboard");
    await expect(page.getByTestId("strip-streak")).toHaveAttribute("href", `/users/${id}`);
    await expect(page.getByTestId("strip-level")).toHaveAttribute("href", "/progress");
    await expect(page.getByTestId("strip-goal")).toHaveAttribute("href", "/vote");
  });
});

test.describe("the theme", () => {
  const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains("dark"));
  const pick = async (page: Page, theme: string) => {
    await page.locator('[data-testid="theme-toggle"]:visible').first().click();
    await page.getByTestId(`theme-${theme}`).click();
  };

  test("switches, stays after a reload, and changes real colors", async ({ page }) => {
    await page.goto("/federal/bills");
    await page.waitForLoadState("networkidle");
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const light = await background();
    await pick(page, "dark");
    await expect.poll(() => isDark(page)).toBe(true);
    expect(await background()).not.toBe(light);
    await page.reload();
    expect(await isDark(page)).toBe(true);
    await expectNoHorizontalOverflow(page);
    await pick(page, "light");
    await expect.poll(() => isDark(page)).toBe(false);
  });

  test("follows the device when set to system", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/federal/bills");
    await expect.poll(() => isDark(page)).toBe(true);
    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => isDark(page)).toBe(false);
  });

  test("dark doesn't flash or log errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text().slice(0, 200));
    });
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/federal/bills");
    await page.waitForLoadState("networkidle");
    expect(await isDark(page)).toBe(true);
    expect(errors).toEqual([]);
  });

  test("every main page fits on dark", async ({ page }) => {
    await newUser(page);
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    for (const path of ["/dashboard", "/progress", "/settings", "/leaderboard"]) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    }
  });
});
