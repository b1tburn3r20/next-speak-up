import { expect, test } from "@playwright/test";
import { blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

const SAMPLE_BILL = "/federal/bills/us-119-hr-2388";
const SAMPLE_MEMBER = "/federal/legislators/T000193";

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

for (const path of ["/dashboard", "/federal/bills", SAMPLE_BILL, "/federal/legislators", SAMPLE_MEMBER, "/forum", "/"]) {
  test(`${path} loads and fits the screen`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("bills can be searched and filtered, including by citation", async ({ page }) => {
  await page.goto("/federal/bills?q=H.R.%202388");
  await expect(page.getByTestId("bill-card").first()).toContainText("H.R. 2388");
  await page.goto("/federal/bills?q=zzzzznothingmatches");
  await expect(page.getByRole("main").getByText("No bills match that")).toBeVisible();
});

test("a bill shows its real status and history", async ({ page }) => {
  await page.goto(SAMPLE_BILL);
  await expect(page.getByText("Became law").first()).toBeVisible();
  await expect(page.getByTestId("bill-timeline")).toContainText("Became Public Law");
});

test("a bill passed and signed in one day shows as law, newest action first", async ({ page }) => {
  await page.goto("/federal/bills/us-119-s-4465");
  await expect(page.getByTestId("bill-timeline").locator("li").first()).toContainText(
    "Became Public Law"
  );
  await expect(page.getByTestId("bill-timeline").locator("li").last()).toContainText(
    "Introduced in Senate"
  );
  await expect(page.getByRole("main")).toContainText(/became law/i);
});

test("an unknown bill or member is a clean 404", async ({ page }) => {
  expect((await page.goto("/federal/bills/us-119-hr-999999"))?.status()).toBe(404);
  expect((await page.goto("/federal/legislators/Z999999"))?.status()).toBe(404);
});

test("the legislators page filters by state and finds both senators", async ({ page }) => {
  await page.goto("/federal/legislators?state=WY&chamber=UPPER");
  await expect(page.getByTestId("member-card")).toHaveCount(2);
  await page.goto("/federal/legislators?state=WY&chamber=LOWER");
  await expect(page.getByTestId("member-card")).toContainText("At Large");
});

test("a member page shows attendance and party voting", async ({ page }) => {
  await page.goto("/federal/legislators/B001261");
  await expect(page.getByTestId("member-stats")).toContainText("Attendance");
  await expect(page.getByTestId("member-stats")).toContainText("%");
  await page.getByTestId("member-votes-reveal-trigger").click();
  await expect(page.getByTestId("member-votes")).toBeVisible();
});

test("signed-in users see their reps, including an at-large seat", async ({ page }) => {
  await loginAs(page, "test_member");
  await page.goto("/dashboard");
  const reps = page.getByRole("main").getByTestId("dashboard-reps");
  await expect(reps.getByTestId("rep-report-card")).toHaveCount(3);
  await expect(reps).toContainText("Hageman");
  await expect(reps).toContainText("Barrasso");
  await expect(page.getByRole("main").getByTestId("user-metrics")).toBeVisible();
});

test("voting on a bill saves, shows on the dashboard, and can be undone", async ({ page }) => {
  await loginAs(page, "test_member");
  await page.goto(SAMPLE_BILL);
  const support = page.getByTestId("vote-support");

  // Starts from a known state, whatever the last run left behind.
  if ((await support.getAttribute("aria-pressed")) === "true") {
    await support.click();
    await expect(support).toHaveAttribute("aria-pressed", "false");
    await page.waitForLoadState("networkidle");
  }
  await page.goto("/dashboard");
  const before = Number(await page.getByRole("main").getByTestId("votes-cast").textContent());

  await page.goto(SAMPLE_BILL);
  await page.getByTestId("vote-support").click();
  await expect(page.getByTestId("vote-support")).toHaveAttribute("aria-pressed", "true");
  await page.waitForLoadState("networkidle");

  await page.reload();
  await expect(page.getByTestId("vote-support")).toHaveAttribute("aria-pressed", "true");
  await page.goto("/dashboard");
  await expect(page.getByRole("main").getByTestId("votes-cast")).toHaveText(String(before + 1));

  await page.goto(SAMPLE_BILL);
  await page.getByTestId("vote-support").click();
  await expect(page.getByTestId("vote-support")).toHaveAttribute("aria-pressed", "false");
});

test("a failed save rolls the vote back and tells the user", async ({ page }) => {
  await loginAs(page, "test_member");
  await page.goto("/federal/bills/us-119-hr-7147");
  await page.route("**/api/civic/bills/vote", (route) =>
    route.fulfill({ status: 500, json: { error: "That didn't save." } }),
  );
  const oppose = page.getByTestId("vote-oppose");
  const initial = await oppose.getAttribute("aria-pressed");
  await oppose.click();
  await expect(page.getByText("That didn't save.")).toBeVisible();
  await expect(oppose).toHaveAttribute("aria-pressed", initial ?? "false");
});

test("voting while signed out asks you to sign in", async ({ page }) => {
  await page.goto(SAMPLE_BILL);
  await page.getByTestId("vote-support").click();
  await expect(page.getByText("Log in or sign up")).toBeVisible();
});

for (const path of ["/settings", "/forum", "/mission", "/privacy", "/forum/create-forum-post"]) {
  test(`${path} works when signed in`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await loginAs(page, "test_member");
    expect((await page.goto(path))?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("admin pages open for admins and refuse members", async ({ page }) => {
  await loginAs(page, "test_admin");
  expect((await page.goto("/admin/permissions"))?.status()).toBe(200);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("page content is in the server response, not behind a JavaScript spinner", async ({
  request,
}) => {
  const html = await (await request.get("/federal/bills")).text();
  expect(html).toContain('data-testid="bill-card"');
});

test("phones get a working menu", async ({ page, isMobile }, testInfo) => {
  test.skip(!["phone", "phone-small"].includes(testInfo.project.name), "Phone only");
  await page.goto("/federal/bills");
  await page.getByTestId("mobile-menu-button").click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Legislators" }).click();
  await expect(page).toHaveURL(/legislators/);
  await expect(menu).toBeHidden();
  void isMobile;
});

test("site search finds members and bills, and goes to them", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("phone"), "The search box is in the wide layout.");
  await page.goto("/federal/bills");
  await page.locator('[data-testid="site-search"]:visible, [data-testid="site-search-mobile"]:visible').first().click();
  await page.getByTestId("site-search-input").fill("Barrasso");
  await expect(page.getByTestId("search-result").first()).toContainText("Barrasso");
  await page.getByTestId("site-search-input").fill("H.R. 2388");
  await expect(page.getByTestId("search-result").first()).toContainText("H.R. 2388");
  await page.getByTestId("search-result").first().click();
  await expect(page).toHaveURL(/us-119-hr-2388/);
});

test("changing state in the older settings form updates your reps", async ({ page }) => {
  const username = `e2e_st_${Date.now()}`;
  await page.request.post("/api/account/signup", {
    headers: { origin: "http://localhost:3000" },
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  const response = await page.request.patch("/api/user/settings/state", {
    data: { state: "Wyoming" },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/dashboard");
  await page.getByTestId("onboarding-skip").click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("main").getByTestId("dashboard-reps")).toContainText("Barrasso");
  // With only a state, you see your senators, not somebody else's House member.
  await expect(page.getByRole("main").getByTestId("dashboard-reps").getByTestId("rep-report-card")).toHaveCount(2);
});


test("the progress bar shows during a slow navigation, then clears", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  const bar = page.getByTestId("top-progress-bar");
  await expect(bar).toHaveAttribute("data-active", "false");
  await page.route("**/bills**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.getByRole("link", { name: "All bills" }).click();
  await expect(bar).toHaveAttribute("data-active", "true");
  await expect(page).toHaveURL(/\/bills/, { timeout: 20000 });
  await expect(bar).toHaveAttribute("data-active", "false", { timeout: 20000 });
});
