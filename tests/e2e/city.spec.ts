import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, expectNoHorizontalOverflow, loginAs } from "./helpers";

const ORIGIN = { origin: BASE_URL };
const CITY = "/state/ia/city/des-moines";
const main = (page: Page) => page.getByRole("main");

/** Someone in Des Moines, located by district numbers, so the geocoder isn't called. */
async function newResident(page: Page) {
  const username = `dsm_${Math.random().toString(36).slice(2, 10)}`;
  await page.request.post("/api/account/signup", {
    headers: ORIGIN,
    data: { username, email: `${username}@coolbills.test`, password: "a good password" },
  });
  await page.request.patch("/api/civic/onboarding", { headers: ORIGIN, data: { complete: true } });
  await page.request.post("/api/civic/location", { headers: ORIGIN, data: { regionCode: "IA", districtCode: "3" } });
  await page.request.patch("/api/civic/location/state", {
    headers: ORIGIN,
    data: { lower: "36", upper: "18", city: "des-moines" },
  });
}

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test.describe("a city's page", () => {
  test("leads with the mayor and the next meeting", async ({ page }) => {
    await page.goto(CITY);
    await expect(main(page).getByTestId("city-official").first()).toContainText("Mayor of Des Moines");
    await expect(main(page).getByTestId("next-meeting")).toBeVisible();
    await expect(main(page).getByTestId("next-meeting-when")).toContainText("at 5");
    await expectNoHorizontalOverflow(page);
  });

  test("says when you can ask to speak, and links to the city's own form", async ({ page }) => {
    await page.goto(CITY);
    const window = main(page).getByTestId("speak-window");
    await expect(window).toContainText(/ask to speak|Requests to speak/);
    await expect(main(page).getByTestId("request-to-speak")).toHaveAttribute("href", /revize\.com\/forms\/401/);
  });

  test("says when the agenda goes up, if it isn't out yet", async ({ page }) => {
    await page.goto(CITY);
    await expect(main(page).getByTestId("agenda-note")).toContainText(/agenda/i);
  });

  test("shows recent topics in the agenda's words, grouped by section", async ({ page }) => {
    await page.goto(CITY);
    const topics = main(page).getByTestId("city-topics");
    await expect(topics.getByTestId("topic-group").first()).toBeVisible();
    await expect(topics).not.toContainText("Liquor");
  });

  test("lists every council seat, with no party, and past meetings' documents", async ({ page }) => {
    await page.goto(CITY);
    await main(page).getByTestId("city-tab-council").click();
    // The council streams in after the first screen, and evaluateAll doesn't wait for it.
    await expect(main(page).getByTestId("city-council-members").getByTestId("city-official").first()).toBeVisible();
    const seats = await main(page).getByTestId("city-council-members").getByTestId("city-official").evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-seat")),
    );
    expect(seats).toEqual(expect.arrayContaining(["At-large", "Ward 1", "Ward 2", "Ward 3", "Ward 4"]));
    await expect(main(page).getByTestId("city-council")).not.toContainText(/Democrat|Republican/);
    // Past meetings are behind their own tab.
    await main(page).getByTestId("city-tab-meetings").click();
    await expect(main(page).getByTestId("city-past-meeting").first()).toBeVisible();
  });

  test("a city that doesn't exist is a 404", async ({ page }) => {
    expect((await page.goto("/state/ia/city/atlantis-under-the-sea"))?.status()).toBe(404);
  });
});

/** Someone in Iowa whose city we don't know, because they chose their districts by hand. */
async function iowanWithoutCity(page: Page) {
  await newResident(page);
  await page.request.patch("/api/civic/location/home-city", { headers: ORIGIN, data: { city: null } });
}

test.describe("finding your city", () => {
  test("My City sends a resident straight to their city", async ({ page }) => {
    await newResident(page);
    await page.goto("/city");
    await expect(page).toHaveURL(/\/state\/ia\/city\/des-moines$/);
  });

  test("My City asks someone in Iowa which city is theirs", async ({ page }) => {
    await iowanWithoutCity(page);
    await page.goto("/city");
    await expect(main(page).getByTestId("find-home-city")).toBeVisible();
    await expect(main(page).getByTestId("my-city-option").first()).toContainText("Des Moines");
    await expectNoHorizontalOverflow(page);
  });

  test("My City shows the states we cover to someone signed out", async ({ page }) => {
    await page.goto("/city");
    await expect(main(page).getByTestId("my-city-state").first()).toContainText("Cities in Iowa");
  });

  test("the dashboard asks for your city, and searching saves it", async ({ page }) => {
    await iowanWithoutCity(page);
    await page.goto("/dashboard");
    const prompt = main(page).getByTestId("find-home-city");
    await expect(prompt).toBeVisible();
    await page.waitForLoadState("networkidle");
    await prompt.getByTestId("seat-city").click();
    await page.getByTestId("seat-city-search").fill("Pella");
    await page.getByTestId("seat-city-option").filter({ hasText: "Pella" }).first().click();
    await prompt.getByTestId("find-home-city-save").click();
    await expect(main(page).getByTestId("this-week-city")).toContainText("Pella");
    await page.goto("/city");
    await expect(page).toHaveURL(/\/state\/ia\/city\/pella$/);
  });

  test("I live here, on a city's page", async ({ page }) => {
    await iowanWithoutCity(page);
    await page.goto("/state/ia/city/pella");
    await page.waitForLoadState("networkidle");
    await main(page).getByTestId("home-city-save").click();
    await expect(main(page).getByTestId("home-city-badge")).toBeVisible();
    await expect(main(page).locator("h1")).toHaveText("Your city: Pella");
  });

  test("the cities list puts your own city first", async ({ page }) => {
    await newResident(page);
    await page.goto("/state/ia/cities");
    await expect(main(page).getByTestId("cities-your-city")).toContainText("Des Moines");
  });

  test("saving a city needs an account, and a real city", async ({ page, request }) => {
    expect((await request.patch("/api/civic/location/home-city", { headers: ORIGIN, data: { city: "pella" } })).status()).toBe(401);
    await newResident(page);
    expect((await page.request.patch("/api/civic/location/home-city", { headers: ORIGIN, data: { city: "atlantis" } })).status()).toBe(400);
  });
});

test.describe("a city meeting", () => {
  test("has its own page, with how to take part", async ({ page }) => {
    await page.goto("/state/ia/city/pella");
    // Past meetings sit in a tab, so the page stays short on a phone.
    await main(page).getByTestId("city-tab-meetings").click();
    await main(page).getByTestId("city-past-meeting").first().getByRole("link").first().click();
    await expect(main(page).getByTestId("meeting-title")).toBeVisible();
    await expect(main(page).getByTestId("meeting-actions")).toBeVisible();
    await expect(main(page).getByTestId("meeting-documents")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("a meeting from another city is a 404", async ({ page }) => {
    await page.goto("/state/ia/city/pella");
    // In a tab that isn't open, so it's found as an element rather than by role.
    const href = await main(page).getByTestId("city-past-meeting").first().locator("a").first().getAttribute("href");
    const id = href?.split("/").at(-1);
    expect((await page.goto(`/state/ia/city/ames/meetings/${id}`))?.status()).toBe(404);
  });
});

test.describe("every city", () => {
  test("the state lists its cities, biggest first, with search", async ({ page }) => {
    await page.goto("/state/ia/cities");
    const items = main(page).getByTestId("city-list-item");
    await expect(items.first()).toContainText("Des Moines");
    // Searched in the browser as you type, with no button.
    await main(page).getByTestId("city-search").fill("Pella");
    await expect(items.first()).toContainText("Pella");
    await main(page).getByTestId("place-filter-meetings").click();
    await expect(items.first()).toContainText("Pella");
    await expectNoHorizontalOverflow(page);
  });

  test("a city without its own pipeline gets a page that says what we have", async ({ page }) => {
    await page.goto("/state/ia/city/pella");
    await expect(main(page).locator("h1")).toHaveText("Pella");
    await expect(main(page).getByTestId("next-meeting")).toBeVisible();
    await expect(main(page).getByTestId("speak")).toBeVisible();
    await expect(main(page).getByTestId("city-gaps")).toContainText("Last checked");
    // The first screen has one main thing to do, and the mayor and City Hall.
    await expect(main(page).getByTestId("city-actions")).toBeVisible();
    await expect(main(page).getByTestId("city-hall")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("the hub links to every city", async ({ page }) => {
    await page.goto("/state/ia");
    await expect(main(page).getByTestId("state-link-cities")).toHaveAttribute("href", "/state/ia/cities");
  });

  test("city search needs two letters, and only covers listed states", async ({ request }) => {
    expect(await (await request.get("/api/civic/cities?state=ia&q=p")).json()).toEqual({ cities: [] });
    const found = await (await request.get("/api/civic/cities?state=ia&q=pella")).json();
    expect(found.cities[0]).toMatchObject({ key: "pella", name: "Pella" });
    expect((await request.get("/api/civic/cities?state=zz&q=pella")).status()).toBe(404);
  });

  test("a resident of any city can say so", async ({ page }) => {
    await newResident(page);
    const response = await page.request.patch("/api/civic/location/state", { headers: ORIGIN, data: { lower: "36", upper: "18", city: "pella" } });
    expect(response.status()).toBe(200);
    await page.goto("/state/ia/city/pella");
    await expect(main(page).locator("h1")).toHaveText("Your city: Pella");
  });
});

test.describe("your ward", () => {
  test("a resident chooses their ward and sees their own council member", async ({ page }) => {
    await newResident(page);
    await page.goto(CITY);
    await expect(main(page).locator("h1")).toHaveText("Your city: Des Moines");
    await main(page).getByTestId("city-tab-council").click();
    await expect(main(page).getByTestId("your-ward")).toContainText("Choose your ward");
    await page.waitForLoadState("networkidle");
    await main(page).getByTestId("ward-select").click();
    await page.getByRole("option", { name: "Ward 3" }).click();
    await main(page).getByTestId("ward-save").click();
    await expect(main(page).getByTestId("your-ward").getByTestId("city-official")).toContainText("Ward 3");
    await expectNoHorizontalOverflow(page);
  });

  test("a ward the city doesn't have is refused", async ({ page }) => {
    await newResident(page);
    const response = await page.request.patch("/api/civic/location/city", { headers: ORIGIN, data: { city: "des-moines", ward: "9" } });
    expect(response.status()).toBe(400);
  });

  test("saving a ward needs an account", async ({ request }) => {
    const response = await request.patch("/api/civic/location/city", { headers: ORIGIN, data: { city: "des-moines", ward: "1" } });
    expect(response.status()).toBe(401);
  });

  test("residents get City Hall on the dashboard and the state page", async ({ page }) => {
    await newResident(page);
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("my-people")).toContainText("Mayor of Des Moines");
    await expect(main(page).getByTestId("this-week-city")).toContainText("Des Moines City Hall");
    await page.goto("/state/ia");
    await expect(main(page).getByTestId("city-glance")).toBeVisible();
  });

  test("someone elsewhere doesn't get City Hall", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("this-week-city")).toHaveCount(0);
  });
});

test.describe("an official's page", () => {
  test("the mayor's card leads to the mayor's page, with role, contact, and record", async ({ page }) => {
    await page.goto(CITY);
    await main(page).getByTestId("city-official").first().getByRole("link", { name: "Connie Boesen" }).click();
    await expect(page).toHaveURL(/\/state\/ia\/city\/des-moines\/officials\/connie-boesen$/);
    await expect(main(page).getByTestId("official-seat")).toHaveText("Mayor of Des Moines");
    await expect(main(page)).toContainText("Chairs City Council meetings");
    await expect(main(page).getByTestId("official-contact")).toContainText("(515) 283-4944");
    await expect(main(page).getByTestId("official-role-link").first()).toContainText("proclamation");
    await expect(main(page).getByTestId("official-attendance")).toContainText("%");
    await expectNoHorizontalOverflow(page);
  });

  test("a council member's page lists where they voted no", async ({ page }) => {
    await page.goto(`${CITY}/officials/carl-voss`);
    await expect(main(page).getByTestId("official-seat")).toContainText("At-large");
    const noVotes = main(page).getByTestId("official-no-votes").getByTestId("official-vote");
    await expect(noVotes.first()).toBeVisible();
    for (const position of await noVotes.evaluateAll((rows) => rows.map((row) => row.getAttribute("data-position")))) {
      expect(position).toBe("NAY");
    }
    await expectNoHorizontalOverflow(page);
  });

  test("shows no party, because the city's offices are nonpartisan", async ({ page }) => {
    await page.goto(`${CITY}/officials/connie-boesen`);
    await expect(main(page)).not.toContainText(/Democrat|Republican/);
  });

  test("someone who isn't an official there is a 404", async ({ page }) => {
    expect((await page.goto(`${CITY}/officials/nobody-here`))?.status()).toBe(404);
  });
});
