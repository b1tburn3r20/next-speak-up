import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow } from "./helpers";

const ORIGIN = { origin: BASE_URL };
const main = (page: Page) => page.getByRole("main");

async function newMember(page: Page) {
  const username = `nt_${Math.random().toString(36).slice(2, 10)}`;
  await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("the list of states", () => {
  test("lists every state, covered ones first, and narrows as you type", async ({ page }) => {
    await page.goto("/states");
    const options = main(page).getByTestId("state-option");
    await expect(options.first()).toContainText("Iowa");
    expect(await options.count()).toBe(51);
    await main(page).getByTestId("state-search").fill("new");
    await expect(options).toHaveCount(4);
    await main(page).getByTestId("state-search").fill("iow");
    await expect(options).toHaveCount(1);
    await options.first().click();
    await expect(page).toHaveURL(/\/state\/ia$/);
  });

  test("My State sends someone with no state to the list", async ({ page }) => {
    await page.goto("/state");
    await expect(page).toHaveURL(/\/states$/);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("a state's page", () => {
  test("has the ways in on the first screen, and finds a city as you type", async ({ page }) => {
    await page.goto("/state/ia");
    for (const id of ["bills", "legislators", "cities", "events"]) {
      await expect(main(page).getByTestId(`state-link-${id}`)).toBeInViewport();
    }
    await main(page).getByTestId("state-city-search").fill("ankeny");
    await expect(main(page).getByTestId("state-city-option").first()).toContainText("Ankeny");
    await main(page).getByTestId("state-city-option").first().click();
    await expect(page).toHaveURL(/\/state\/ia\/city\/ankeny$/);
    await expect(main(page).getByTestId("city-legislator").first()).toBeVisible();
  });
});

test.describe("notifications", () => {
  test("settings shows the choices, and they save", async ({ page }) => {
    await newMember(page);
    await page.goto("/settings");
    const panel = main(page).getByTestId("push-settings");
    await expect(panel).toBeVisible();
    await expect(main(page).getByTestId("push-status")).not.toHaveAttribute("data-status", "unknown");
    const toggle = main(page).getByTestId("notify-floorWeek");
    await expect(toggle).toHaveAttribute("data-state", "checked");
    const saving = page.waitForResponse((response) => response.url().includes("/api/notifications/preferences") && response.request().method() === "PATCH");
    await toggle.click();
    await expect(toggle).toHaveAttribute("data-state", "unchecked");
    expect((await saving).status()).toBe(200);
    const saved = await (await page.request.get("/api/notifications/preferences")).json();
    expect(saved.prefs.floorWeek).toBe(false);
  });

  test("the manager shows what you get, each kind on its own", async ({ page }) => {
    await newMember(page);
    await page.goto("/settings");
    const panel = main(page).getByTestId("push-settings");
    for (const pref of ["cityMeetings", "voteResults", "becameLaw", "votedBills", "floorWeek", "topicResults"]) {
      await expect(panel.getByTestId(`notify-${pref}`)).toHaveAttribute("data-state", "checked");
    }
    // A new member has no city, and is told how to pick one.
    await expect(panel.getByTestId("notify-city-pick")).toBeVisible();
    await expect(panel.getByTestId("notify-devices")).toBeVisible();
    await expect(panel.getByTestId("notify-recent")).toBeVisible();

    // One kind off leaves the others on.
    const saving = page.waitForResponse((response) => response.url().includes("/api/notifications/preferences") && response.request().method() === "PATCH");
    await panel.getByTestId("notify-votedBills").click();
    expect((await saving).status()).toBe(200);
    const saved = (await (await page.request.get("/api/notifications/preferences")).json()).prefs;
    expect(saved.votedBills).toBe(false);
    expect(saved.voteResults).toBe(true);
  });

  test("a topic can be muted for notifications and still tracked", async ({ page }) => {
    await newMember(page);
    expect((await page.request.post("/api/civic/topics", { headers: ORIGIN, data: { policyArea: "Health", tracked: true } })).status()).toBe(200);
    await page.goto("/settings");
    const panel = main(page).getByTestId("push-settings");
    await panel.getByTestId("notify-more-floorWeek-trigger").click();
    const chip = panel.locator('[data-testid="notify-topic"][data-topic="Health"]');
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    const saving = page.waitForResponse((response) => response.url().includes("/api/notifications/preferences") && response.request().method() === "PATCH");
    await chip.click();
    expect((await saving).status()).toBe(200);
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    expect((await (await page.request.get("/api/notifications/preferences")).json()).mutedTopics).toEqual(["Health"]);
    // A topic that isn't one is refused.
    expect((await page.request.patch("/api/notifications/preferences", { headers: ORIGIN, data: { topic: { name: "Nope", muted: true } } })).status()).toBe(400);
  });

  test("saves a browser's subscription, but only for a real push service", async ({ page }) => {
    await newMember(page);
    const keys = { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" };
    const good = await page.request.post("/api/notifications/subscription", {
      headers: ORIGIN,
      data: { endpoint: `https://fcm.googleapis.com/fcm/send/test-${Date.now()}`, keys },
    });
    expect(good.status()).toBe(200);
    expect((await (await page.request.get("/api/notifications/preferences")).json()).devices).toBe(1);
    const bad = await page.request.post("/api/notifications/subscription", { headers: ORIGIN, data: { endpoint: "https://example.com/hook", keys } });
    expect(bad.status()).toBe(400);
    // Tests run without the private key, so nothing can reach a real device.
    expect((await page.request.post("/api/notifications/test", { headers: ORIGIN })).status()).toBe(503);
    expect((await page.request.delete("/api/notifications/subscription", { headers: ORIGIN, data: {} })).status()).toBe(200);
    expect((await (await page.request.get("/api/notifications/preferences")).json()).devices).toBe(0);
  });

  test("the sender can't be run without its secret", async ({ request }) => {
    expect((await request.post("/api/cron/notify")).status()).toBe(401);
    expect((await request.post("/api/cron/notify", { headers: { Authorization: "Bearer nope" } })).status()).toBe(401);
  });

  test("signed out, the routes say to sign in", async ({ request }) => {
    expect((await request.get("/api/notifications/preferences")).status()).toBe(401);
    expect((await request.post("/api/notifications/subscription", { data: {} })).status()).toBe(401);
  });
});
