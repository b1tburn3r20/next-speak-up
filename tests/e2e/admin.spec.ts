import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

const ORIGIN = { origin: BASE_URL };

async function newMember(page: Page) {
  const username = `adm_${Math.random().toString(36).slice(2, 10)}`;
  await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
  return username;
}

const sessionId = (page: Page) =>
  page.evaluate(async () => (await (await fetch("/api/auth/session")).json()).user.id as string);

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("who gets in", () => {
  test("a member can't open any of it, or reach the pipeline server", async ({ page }) => {
    await newMember(page);
    for (const path of ["/admin", "/admin/users", "/admin/permissions", "/admin/pipelines", "/admin/feedback", "/admin/moderation", "/admin/audit"]) {
      await page.goto(path);
      await expect(page, path).not.toHaveURL(/\/admin/);
    }
    for (const [method, path] of [
      ["get", "status"],
      ["get", "pipelines"],
      ["get", "runs/1/logs"],
      ["post", "stop"],
      ["post", "daily/run"],
      ["put", "schedule"],
    ] as const) {
      const response = await page.request[method](`/api/admin/pipelines/${path}`, { headers: ORIGIN, data: method === "get" ? undefined : {} });
      expect(response.status(), path).toBe(403);
    }
    await expect(page.locator('a[href="/admin"]')).toHaveCount(0);
  });

  test("signed out, the pipeline routes refuse", async ({ page }) => {
    expect((await page.request.get("/api/admin/pipelines/status")).status()).toBe(401);
  });

  test("anything not on the list doesn't exist, even for an admin", async ({ page }) => {
    await loginAs(page, "test_superadmin");
    for (const path of ["health", "docs", "openapi.json", "runs/abc"]) {
      expect((await page.request.get(`/api/admin/pipelines/${path}`)).status(), path).toBe(404);
    }
  });

  test("the token never reaches the browser", async ({ page }) => {
    await loginAs(page, "test_superadmin");
    const seen: string[] = [];
    page.on("response", async (response) => {
      if (response.url().includes("/api/admin/pipelines")) seen.push(await response.text().catch(() => ""));
    });
    await page.goto("/admin/pipelines");
    await expect(page.getByTestId("pipelines-dashboard")).toBeVisible();
    const html = await page.content();
    for (const text of [html, ...seen]) expect(text).not.toContain("Bearer ");
    expect(html).not.toContain("PIPELINE_SERVER_TOKEN");
  });

  test("a cross-site request can't start a pipeline", async ({ page }) => {
    await loginAs(page, "test_superadmin");
    const response = await page.request.post("/api/admin/pipelines/stop", {
      headers: { origin: "https://evil.example" },
      data: {},
    });
    expect(response.status()).toBe(403);
  });
});

test.describe("the rules for changing who can do what", () => {
  test("you can't change your own role", async ({ page }) => {
    await loginAs(page, "test_superadmin");
    await page.goto("/admin");
    const response = await page.request.put("/api/admin/roles/assign-role-to-user", {
      headers: ORIGIN,
      data: { userId: await sessionId(page), roleId: 2 },
    });
    expect(response.status()).toBe(403);
    expect((await response.json()).error).toContain("your own role");
  });

  test("a role change is recorded", async ({ page, browser }) => {
    const other = await browser.newContext({ baseURL: BASE_URL });
    const otherPage = await other.newPage();
    const username = await newMember(otherPage);
    await otherPage.goto("/dashboard");
    const id = await sessionId(otherPage);
    await other.close();

    await loginAs(page, "test_superadmin");
    await page.goto("/admin/permissions");
    const roles = await (await page.request.get("/api/admin/roles/get-all-roles")).json();
    const list = roles.roles ?? roles;
    const supporter = list.find((role: { name: string }) => role.name === "Supporter");
    const changed = await page.request.put("/api/admin/roles/assign-role-to-user", {
      headers: ORIGIN,
      data: { userId: id, roleId: supporter.id },
    });
    expect(changed.ok()).toBe(true);
    await page.goto(`/admin/users/${id}`);
    await expect(page.getByTestId("user-audit")).toContainText("Member to Supporter");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(username);
    await page.goto("/admin/audit");
    await expect(page.getByTestId("audit-table")).toContainText("user.role_changed");
  });
});

test.describe("the panels", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "test_superadmin");
  });

  test("overview shows real numbers, and fits", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByTestId("admin-overview")).toBeVisible();
    await expect(page.getByTestId("admin-tile").first()).toContainText(/\d/);
    await expect(page.getByTestId("admin-nav").getByRole("link")).toHaveCount(8);
    await expectNoHorizontalOverflow(page);
  });

  test("users can be searched and paged", async ({ page }) => {
    await page.goto("/admin/users?q=test_superadmin");
    await expect(page.getByTestId("user-row")).toHaveCount(1);
    await expect(page.getByTestId("user-row")).toContainText("test_superadmin");
    // Your own role can't be changed, and the control says so by being off.
    await expect(page.getByTestId("role-select")).toBeDisabled();
    await page.goto("/admin/users?q=nobody-has-this-name-at-all");
    await expect(page.getByTestId("users-empty")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("the permissions grid shows every role against every permission, and saves", async ({ page }) => {
    await page.goto("/admin/permissions");
    // A click before hydration does nothing, and this one changes shared data.
    await page.waitForLoadState("networkidle");
    const row = page.locator('[data-testid="permission-row"][data-name="feedback.view"]');
    await expect(row).toBeVisible();
    await expect(page.getByTestId("role-column").filter({ hasText: "Moderator" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const cell = row.getByRole("switch", { name: "feedback.view for Supporter" });
    const before = await cell.getAttribute("aria-checked");
    expect(before, "Supporter shouldn't start with this").toBe("false");
    try {
      const saved = page.waitForResponse("**/api/admin/roles/assign-permission-to-role");
      await cell.click();
      await expect(cell).toHaveAttribute("aria-checked", "true");
      expect((await saved).status()).toBe(201);
      await page.reload();
      await expect(cell).toHaveAttribute("aria-checked", "true");
    } finally {
      // Whatever happened above, leave the role as it was found.
      await page.reload();
      await page.waitForLoadState("networkidle");
      if ((await cell.getAttribute("aria-checked")) === "true") {
        const removed = page.waitForResponse("**/api/admin/roles/remove-permission-from-role");
        await cell.click();
        await expect(cell).toHaveAttribute("aria-checked", "false");
        await removed;
      }
    }
  });

  test("a permission you don't hold can't be granted, even through the API", async ({ page, browser }) => {
    const other = await browser.newContext({ baseURL: BASE_URL });
    await loginAs(await other.newPage(), "test_member");
    const denied = await other.request.put("/api/admin/roles/assign-permission-to-role", {
      headers: ORIGIN,
      data: { roleId: 2, permissionId: 1 },
    });
    expect(denied.status()).toBe(403);
    await other.close();
    await page.goto("/admin/permissions");
    await expect(page.getByTestId("permission-matrix")).toBeVisible();
  });

  test("feedback and moderation open", async ({ page }) => {
    await page.goto("/admin/feedback");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Feedback");
    await expectNoHorizontalOverflow(page);
    await page.goto("/admin/moderation");
    await expect(page.getByTestId("moderation-hidden")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("an old user link still arrives", async ({ page }) => {
    await page.goto("/admin");
    const id = await sessionId(page);
    await page.goto(`/admin/permissions/${id}`);
    await expect(page).toHaveURL(new RegExp(`/admin/users/${id}$`));
  });
});

test.describe("pipelines, against the real server", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "test_superadmin");
  });

  test("lists pipelines, charts, and sources, and fits", async ({ page }) => {
    await page.goto("/admin/pipelines");
    await expect(page.getByTestId("pipelines-dashboard")).toBeVisible();
    await expect(page.locator('[data-testid="pipeline-row"][data-name="congress_bills"]')).toBeVisible();
    await expect(page.locator('[data-testid="pipeline-row"][data-name="ia_calendar"]')).toContainText("By hand");
    await expect(page.getByTestId("chart-requests")).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("sources-table")).toContainText("congress_gov");
    await expectNoHorizontalOverflow(page);
  });

  test("a real run shows up with its log", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "One real run is enough");
    test.setTimeout(60_000);
    await page.goto("/admin/pipelines");
    // This stub only reads two small pages and writes nothing to the app, so it's safe to really run.
    await page.locator('[data-testid="pipeline-row"][data-name="ia_calendar"]').getByTestId("run-pipeline").click();
    await page.getByTestId("run-confirm").click();
    const link = page.getByTestId("run-row").filter({ hasText: "ia_calendar" }).first().getByRole("link");
    await expect(link).toBeVisible({ timeout: 20_000 });
    await link.click();
    await expect(page).toHaveURL(/\/admin\/pipelines\/runs\/\d+$/);
    await expect(page.getByTestId("run-log")).toContainText("Iowa debate calendar (stub)", { timeout: 15_000 });
    await expect(page.getByTestId("run-detail").getByTestId("run-status").first()).toHaveAttribute("data-status", "success", { timeout: 15_000 });
  });

  test("the nightly run can be turned on and back off, and it's recorded", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "It's shared state, so one width");
    await page.goto("/admin/pipelines");
    const toggle = page.getByTestId("nightly-switch");
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await page.goto("/admin/audit?action=pipeline.schedule");
    await expect(page.getByTestId("audit-row").first()).toContainText("pipeline.schedule");
  });

  test("polling stays out of the loading bar", async ({ page }) => {
    await page.goto("/admin/pipelines");
    await expect(page.getByTestId("pipelines-dashboard")).toBeVisible();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await expect(page.getByTestId("top-progress-bar")).toHaveAttribute("data-active", "false", { timeout: 25_000 });
    await page.waitForTimeout(4500);
    await expect(page.getByTestId("top-progress-bar")).toHaveAttribute("data-active", "false");
  });
});
