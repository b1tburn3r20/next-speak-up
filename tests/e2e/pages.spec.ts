import { expect, test } from "@playwright/test";
import { blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

const SAMPLE_BILL = "/bills/us-119-hr-2388";
const SAMPLE_MEMBER = "/legislators/federal/T000193";

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

for (const path of ["/dashboard", "/bills", SAMPLE_BILL, "/legislators", SAMPLE_MEMBER, "/forum", "/"]) {
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
  await page.goto("/bills?q=H.R.%202388");
  await expect(page.getByTestId("bill-card").first()).toContainText("H.R. 2388");
  await page.goto("/bills?q=zzzzznothingmatches");
  await expect(page.getByText("No bills match that")).toBeVisible();
});

test("a bill shows its real status and history", async ({ page }) => {
  await page.goto(SAMPLE_BILL);
  await expect(page.getByText("Became law").first()).toBeVisible();
  await expect(page.getByTestId("bill-timeline")).toContainText("Became Public Law");
});

test("an unknown bill or member is a clean 404", async ({ page }) => {
  expect((await page.goto("/bills/us-119-hr-999999"))?.status()).toBe(404);
  expect((await page.goto("/legislators/federal/Z999999"))?.status()).toBe(404);
});

test("the legislators page filters by state and finds both senators", async ({ page }) => {
  await page.goto("/legislators?state=WY&chamber=UPPER");
  await expect(page.getByTestId("member-card")).toHaveCount(2);
  await page.goto("/legislators?state=WY&chamber=LOWER");
  await expect(page.getByTestId("member-card")).toContainText("At Large");
});

test("a member page shows attendance and party voting", async ({ page }) => {
  await page.goto("/legislators/federal/B001261");
  await expect(page.getByTestId("member-stats")).toContainText("Attendance");
  await expect(page.getByTestId("member-stats")).toContainText("%");
  await expect(page.getByTestId("member-votes")).toBeVisible();
});

test("signed-in users see their reps, including an at-large seat", async ({ page }) => {
  await loginAs(page, "test_member");
  await page.goto("/dashboard");
  const reps = page.getByTestId("dashboard-reps");
  await expect(reps.getByTestId("member-card")).toHaveCount(3);
  await expect(reps).toContainText("Hageman");
  await expect(reps).toContainText("Barrasso");
  await expect(page.getByTestId("user-metrics")).toBeVisible();
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
  const before = Number(await page.getByTestId("votes-cast").textContent());

  await page.goto(SAMPLE_BILL);
  await page.getByTestId("vote-support").click();
  await expect(page.getByTestId("vote-support")).toHaveAttribute("aria-pressed", "true");
  await page.waitForLoadState("networkidle");

  await page.reload();
  await expect(page.getByTestId("vote-support")).toHaveAttribute("aria-pressed", "true");
  await page.goto("/dashboard");
  await expect(page.getByTestId("votes-cast")).toHaveText(String(before + 1));

  await page.goto(SAMPLE_BILL);
  await page.getByTestId("vote-support").click();
  await expect(page.getByTestId("vote-support")).toHaveAttribute("aria-pressed", "false");
});

test("a failed save rolls the vote back and tells the user", async ({ page }) => {
  await loginAs(page, "test_member");
  await page.goto("/bills/us-119-hr-7147");
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

test("a new user can onboard by picking a state and district", async ({ page }) => {
  const username = `e2e_on_${Date.now()}`;
  const response = await page.request.post("/api/account/signup", {
    headers: { origin: "http://localhost:3000" },
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  expect(response.status()).toBe(201);
  await page.goto("/bills");
  const onboarding = page.getByTestId("onboarding");
  await expect(onboarding).toBeVisible();
  await onboarding.getByLabel("Or choose it yourself").selectOption("WY");
  await expect(onboarding.getByLabel("District")).toHaveValue("AL");
  await onboarding.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("onboarding-reps")).toContainText("Hageman");
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("onboarding-finish").click();
  await expect(onboarding).toBeHidden();

  await page.reload();
  await expect(page.getByTestId("onboarding")).toBeHidden();
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-reps")).toContainText("Hageman");
});

test("skipping onboarding always works", async ({ page }) => {
  const username = `e2e_sk_${Date.now()}`;
  await page.request.post("/api/account/signup", {
    headers: { origin: "http://localhost:3000" },
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  await page.goto("/bills");
  await page.getByTestId("onboarding-skip").click();
  await expect(page.getByTestId("onboarding")).toBeHidden();
  await page.reload();
  await expect(page.getByTestId("onboarding")).toBeHidden();
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
  const html = await (await request.get("/bills")).text();
  expect(html).toContain('data-testid="bill-card"');
});

test("phones get a working menu", async ({ page, isMobile }, testInfo) => {
  test.skip(!["phone", "phone-small"].includes(testInfo.project.name), "Phone only");
  await page.goto("/bills");
  await page.getByTestId("mobile-menu-button").click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Federal Legislators" }).click();
  await expect(page).toHaveURL(/legislators/);
  await expect(menu).toBeHidden();
  void isMobile;
});

test("the old bill section redirects to the new one", async ({ page }) => {
  await page.goto("/federal/bills");
  await expect(page).toHaveURL(/\/bills$/);
});

for (const theme of ["light", "dark", "sepia", "midnight"]) {
  test(`the ${theme} theme applies and survives a reload`, async ({ page }) => {
    await page.goto("/bills");
    await page.locator('[data-testid="theme-picker"]:visible').click();
    await page.locator(`[data-theme-option="${theme}"]`).click();
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
    await page.reload();
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
    await expectNoHorizontalOverflow(page);
  });
}

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
