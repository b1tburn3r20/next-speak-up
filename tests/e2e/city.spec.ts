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
    const seats = await main(page).getByTestId("city-council-members").getByTestId("city-official").evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-seat")),
    );
    expect(seats).toEqual(expect.arrayContaining(["At-large", "Ward 1", "Ward 2", "Ward 3", "Ward 4"]));
    await expect(main(page).getByTestId("city-council")).not.toContainText(/Democrat|Republican/);
    await expect(main(page).getByTestId("city-past-meeting").first()).toBeVisible();
  });

  test("a city we don't cover is a 404", async ({ page }) => {
    expect((await page.goto("/state/ia/city/ames"))?.status()).toBe(404);
  });
});

test.describe("your ward", () => {
  test("a resident chooses their ward and sees their own council member", async ({ page }) => {
    await newResident(page);
    await page.goto(CITY);
    await expect(main(page).locator("h1")).toHaveText("Your city: Des Moines");
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
    await expect(main(page).getByTestId("city-glance")).toContainText("Your mayor");
    await page.goto("/state/ia");
    await expect(main(page).getByTestId("city-glance")).toBeVisible();
  });

  test("someone elsewhere doesn't get City Hall", async ({ page }) => {
    await loginAs(page, "test_member");
    await page.goto("/dashboard");
    await expect(main(page).getByTestId("city-glance")).toHaveCount(0);
  });
});
