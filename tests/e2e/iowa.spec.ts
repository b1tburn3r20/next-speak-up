import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

const ORIGIN = { origin: BASE_URL };
const main = (page: Page) => page.getByRole("main");

/** A new person in Des Moines. Districts are saved by number, so the geocoder isn't called. */
async function newIowan(page: Page, seats: { lower: string; upper: string; city: string | null } = { lower: "36", upper: "18", city: "des-moines" }) {
  const username = `ia_${Math.random().toString(36).slice(2, 10)}`;
  await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
  const saved = await page.request.post("/api/civic/location", {
    headers: ORIGIN,
    data: { regionCode: "IA", districtCode: "3" },
  });
  expect(saved.ok()).toBe(true);
  const state = await page.request.patch("/api/civic/location/state", { headers: ORIGIN, data: seats });
  expect(state.ok()).toBe(true);
  return username;
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("federal and state stay apart", () => {
  test("an Iowan's federal reps are their member of Congress and two U.S. senators", async ({ request }) => {
    const { reps } = await (await request.get("/api/civic/reps?state=IA&district=3")).json();
    expect(reps).toHaveLength(3);
    expect(reps.filter((rep: { role: string }) => rep.role === "Senator")).toHaveLength(2);
    for (const rep of reps) expect(rep.bioguide).not.toMatch(/^ia:/);
  });

  test("the federal lists don't show Iowa's bills or legislators", async ({ page }) => {
    await page.goto("/federal/bills?q=HF");
    expect(await main(page).locator('a[href^="/state/ia"]').count()).toBe(0);
    await page.goto("/federal/legislators?state=IA");
    await expect(main(page).getByTestId("member-card").first()).toBeVisible();
    expect(await main(page).locator('a[href^="/state/ia"]').count()).toBe(0);
  });

  test("a federal URL won't open an Iowa bill, or the reverse", async ({ page }) => {
    expect((await page.goto("/federal/bills/ia-91-hf-2765"))?.status()).toBe(404);
    expect((await page.goto("/state/ia/bills/us-119-hr-2388"))?.status()).toBe(404);
  });

  test("a state we don't cover is a 404", async ({ page }) => {
    expect((await page.goto("/state/tx"))?.status()).toBe(404);
    expect((await page.goto("/state/ia/legislators/no-such-person"))?.status()).toBe(404);
    expect((await page.goto("/state/ia/events/999999999"))?.status()).toBe(404);
    expect((await page.goto("/state/ia/city/springfield"))?.status()).toBe(404);
    expect((await page.goto("/state/tx/bills"))?.status()).toBe(404);
  });
});

test.describe("the Iowa hub", () => {
  test("explains the session being out, and links everywhere", async ({ page }) => {
    await page.goto("/state/ia");
    await expect(main(page).getByTestId("state-session-note")).toContainText("out until January 11, 2027");
    for (const id of ["bills", "legislators", "events", "city-des-moines"]) {
      await expect(main(page).getByTestId(`state-link-${id}`)).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
  });

  test("shows an Iowan their legislators and how to reach Des Moines", async ({ page }) => {
    await newIowan(page);
    await page.goto("/state/ia");
    await expect(main(page).locator("h1")).toHaveText("Your Iowa");
    await expect(main(page).getByTestId("state-seats").getByTestId("rep-report-card")).toHaveCount(2);
    await expectNoHorizontalOverflow(page);
  });

  test("someone we only have a congressional district for can look up their seats right there", async ({ page }) => {
    // Calls the Census geocoder, which is free, like location.spec.ts.
    const username = `ia_${Math.random().toString(36).slice(2, 10)}`;
    await page.request.post("/api/account/signup", {
      headers: ORIGIN,
      data: { username, email: `${username}@coolbills.test`, password: "a good password" },
    });
    await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
    await page.request.post("/api/civic/location", { headers: ORIGIN, data: { regionCode: "IA", districtCode: "3" } });
    await page.goto("/state/ia");
    await expect(main(page).getByTestId("find-state-seats")).toBeVisible();
    await expect(page).toHaveURL(/\/state\/ia$/);
    await main(page).getByPlaceholder("123 Main St, Austin, TX").fill("1007 E Grand Ave, Des Moines, IA 50319");
    await main(page).getByPlaceholder("123 Main St, Austin, TX").press("Enter");
    await expect(main(page).getByTestId("state-seats").getByTestId("rep-report-card")).toHaveCount(2, { timeout: 20000 });
    await expect(main(page).getByTestId("state-seats")).toContainText("Iowa House, District 36");
    await expect(main(page).getByTestId("find-state-seats")).toHaveCount(0);
  });

  test("says when a seat is empty, rather than hiding it", async ({ page }) => {
    await newIowan(page, { lower: "38", upper: "11", city: null });
    await page.goto("/state/ia");
    await expect(main(page).getByTestId("seat-empty").first()).toContainText("empty");
  });

  test("the nav's My State link only appears for people in a state we cover, and goes to theirs", async ({ page }) => {
    await page.goto("/dashboard");
    expect(await page.locator('a[href="/state"]:visible').count()).toBe(0);
    await newIowan(page);
    await page.goto("/dashboard");
    await expect(page.locator('a[href="/state"]').first()).toBeAttached();
    await page.goto("/state");
    await expect(page).toHaveURL(/\/state\/ia$/);
  });

  test("the states page lists what we cover for anyone else", async ({ page }) => {
    await page.goto("/state");
    await expect(main(page).getByTestId("state-option")).toContainText(["Iowa"]);
  });
});

test.describe("Iowa's bills", () => {
  test("the list searches by number, and links to the state's pages", async ({ page }) => {
    await page.goto("/state/ia/bills");
    await expect(main(page).getByTestId("state-session-note")).toBeVisible();
    const first = main(page).locator('a[href^="/state/ia/bills/ia-91-"]').first();
    await expect(first).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.goto("/state/ia/bills?q=HF%202765");
    await expect(main(page).locator('a[href="/state/ia/bills/ia-91-hf-2765"]').first()).toBeVisible();
  });

  test("a signed bill says so in Iowa's words, for someone signed out", async ({ page }) => {
    await page.goto("/state/ia/bills/ia-91-hf-2765");
    await expect(main(page).getByTestId("bill-status").first()).toHaveText("Signed");
    await expect(main(page).getByText("Governor", { exact: true })).toBeVisible();
    await expect(main(page).getByTestId("bill-timeline")).toBeVisible();
    await expect(main(page).getByText("Acts Chapter")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("a bill that never finished says the session ended, and doesn't ask for a call", async ({ page }) => {
    await newIowan(page);
    const html = await (await page.request.get("/state/ia/bills?status=IN_COMMITTEE")).text();
    const slug = html.match(/ia-91-[a-z]+-\d+/)?.[0];
    test.skip(!slug, "No unfinished bills loaded");
    await page.goto(`/state/ia/bills/${slug}`);
    await expect(main(page).getByTestId("vote-gate")).toBeVisible();
    await page.getByTestId("vote-support").first().click();
    await expect(main(page).getByTestId("bill-outlook")).toContainText("didn't finish before the session ended");
  });

  test("the vote gate works for an Iowa bill, without giving status away", async ({ page }) => {
    await newIowan(page);
    const html = await (await page.request.get("/state/ia/bills/ia-91-hf-2765")).text();
    expect(html).toContain("vote-gate");
    expect(html).not.toContain("Acts Chapter");
  });
});

test.describe("Iowa's legislators", () => {
  test("lists who's sitting, names the vacancies, and filters", async ({ page }) => {
    await page.goto("/state/ia/legislators");
    await expect(main(page).getByTestId("state-members")).toBeVisible();
    expect(await main(page).getByTestId("member-card").count()).toBeGreaterThan(140);
    await expect(main(page).getByTestId("state-vacancies")).toContainText("Senate 11");
    await expect(main(page).getByTestId("state-vacancies")).toContainText("House 38");
    await page.goto("/state/ia/legislators?chamber=LOWER&district=36");
    await expect(main(page).getByTestId("member-card")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });

  test("a legislator's page has their seat and how to reach them", async ({ page }) => {
    await page.goto("/state/ia/legislators?chamber=LOWER&district=36");
    await main(page).getByTestId("member-card").click();
    await expect(page).toHaveURL(/\/state\/ia\/legislators\/\d+/);
    await expect(main(page).getByTestId("legislator-contact")).toBeVisible();
    await expect(main(page)).toContainText("Iowa House, District 36");
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("showing up", () => {
  test("with nothing posted, it says why and offers the past", async ({ page }) => {
    await page.goto("/state/ia/events");
    const empty = main(page).getByText("No meetings are posted right now");
    if (await empty.isVisible()) {
      await page.getByRole("link", { name: "See past meetings" }).click();
      await expect(page).toHaveURL(/when=past/);
    }
    await page.goto("/state/ia/events?when=past");
    await expect(main(page).getByTestId("event-card").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("a past meeting explains itself, and is too old to report", async ({ page }) => {
    await page.goto("/state/ia/events?when=past&kind=SUBCOMMITTEE");
    await main(page).getByTestId("event-card").first().getByRole("link").click();
    await expect(page).toHaveURL(/\/state\/ia\/events\/\d+/);
    await expect(main(page).getByText("How to take part")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("attending can't be reported for a meeting that's long past", async ({ page }) => {
    await newIowan(page);
    const html = await (await page.request.get("/state/ia/events?when=past&kind=COUNCIL_MEETING")).text();
    const id = Number(html.match(/\/state\/ia\/events\/(\d+)/)?.[1]);
    const old = await page.request.post("/api/civic/events/attend", { headers: ORIGIN, data: { eventId: id } });
    expect(old.status()).toBe(400);
  });

  test("reporting needs an account", async ({ request }) => {
    const response = await request.post("/api/civic/events/attend", { headers: ORIGIN, data: { eventId: 1 } });
    expect(response.status()).toBe(401);
  });

  test("a meeting's calendar file is real", async ({ page, request }) => {
    const html = await (await page.request.get("/state/ia/events?when=past")).text();
    const id = html.match(/\/state\/ia\/events\/(\d+)/)?.[1];
    const response = await request.get(`/api/civic/events/${id}/ics`);
    expect(response.headers()["content-type"]).toContain("text/calendar");
    expect(await response.text()).toContain("BEGIN:VEVENT");
  });
});

test.describe("Des Moines", () => {
  test("shows agendas, and is honest about what's missing", async ({ page }) => {
    await page.goto("/state/ia/city/des-moines");
    await expect(main(page).getByTestId("city-gaps")).toContainText("Council members");
    await expect(main(page).getByTestId("city-past").getByTestId("event-card").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("across the app", () => {
  test("an Iowan's dashboard and report cards keep Washington and the statehouse apart", async ({ page }) => {
    await newIowan(page);
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("dashboard-reps")).toContainText("members of Congress");
    await expect(main(page).getByTestId("dashboard-statehouse").getByTestId("rep-report-card")).toHaveCount(2);
    await page.goto("/reps");
    await expect(main(page).getByTestId("reps-statehouse")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("someone elsewhere doesn't get Iowa's section", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("dashboard-statehouse")).toHaveCount(0);
  });

  test("moving away from Iowa takes its legislators away", async ({ page }) => {
    await newIowan(page);
    await page.request.post("/api/civic/location", { headers: ORIGIN, data: { regionCode: "WY", districtCode: "AL" } });
    await page.goto("/reps");
    await expect(main(page).getByTestId("reps-statehouse")).toHaveCount(0);
  });

  test("a district that doesn't exist is refused", async ({ page }) => {
    await newIowan(page);
    const response = await page.request.patch("/api/civic/location/state", {
      headers: ORIGIN,
      data: { lower: "999", upper: null, city: null },
    });
    expect(response.status()).toBe(400);
  });

  test("search finds an Iowa legislator", async ({ request }) => {
    const response = await request.get("/api/search/ia-legislators?q=Grassley");
    const { results } = await response.json();
    expect(results[0].href).toMatch(/^\/state\/ia\/legislators\/\d+/);
  });
});
