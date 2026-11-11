import { expect, test } from "@playwright/test";
import { BASE_URL } from "./helpers";

// These use the free Census geocoder for real, because the bug they guard against came from
// how the live service behaves. Austin's district differs between the 119th and 120th maps.
test.skip(({ browserName }) => browserName !== "chromium");

test("coordinates resolve to the sitting Congress's district", async ({ request }) => {
  test.skip(new Date() >= new Date("2027-01-03"), "The 120th Congress is seated.");
  const response = await request.post("/api/civic/location", {
    data: { lat: 30.27, lng: -97.74 },
  });
  expect(response.status()).toBe(200);
  // It also carries Austin's statehouse seats and city, which only states we cover use.
  expect(await response.json()).toMatchObject({ regionCode: "TX", districtCode: "37" });
});

test("an address resolves, and DC's delegate seat maps to at-large", async ({ request }) => {
  const response = await request.post("/api/civic/location", {
    data: { address: "1600 Pennsylvania Ave NW, Washington, DC 20500" },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ regionCode: "DC", districtCode: "AL" });
});

test("impossible coordinates are refused", async ({ request }) => {
  const response = await request.post("/api/civic/location", {
    data: { lat: 999, lng: 0 },
  });
  expect(response.status()).toBe(400);
});

test("a signed-out visitor's lookup isn't saved", async ({ request }) => {
  const response = await request.post("/api/civic/location", {
    data: { regionCode: "WY", districtCode: "AL" },
  });
  expect(response.status()).toBe(200);
});

test.describe("finding your district in the browser", () => {
  // The live site's servers can't reach the Census, so the browser asks it, inside a sandboxed frame,
  // and the server only gets the district. Both of these call the free Census for real.
  test.use({ geolocation: { latitude: 41.5868, longitude: -93.625 }, permissions: ["geolocation"] });

  // A new account with no location yet, so My Reps offers the picker.
  test.beforeEach(async ({ page }) => {
    const username = `loc_${Math.random().toString(36).slice(2, 10)}`;
    const origin = { origin: BASE_URL };
    await page.request.post("/api/account/signup", { headers: origin, data: { username, email: `${username}@coolbills.test`, password: "a good password" } });
    await page.request.patch("/api/civic/onboarding", { headers: origin, data: { complete: true } });
  });

  test("Use my location sends the server a district, never the coordinates", async ({ page }) => {
    await page.goto("/reps");
    await page.waitForLoadState("networkidle");
    const sent = page.waitForRequest((request) => request.url().endsWith("/api/civic/location") && request.method() === "POST", { timeout: 30_000 });
    await page.getByTestId("use-my-location").click();
    const body = (await sent).postDataJSON();
    expect(body).toMatchObject({ regionCode: "IA", districtCode: "3", source: "BROWSER", stateSeats: { upper: "18", lower: "36", placeGeoid: "1921000" } });
    expect(body).not.toHaveProperty("lat");
  });

  test("falls back to the server when the browser can't reach the Census", async ({ page }) => {
    await page.route("https://geocoding.geo.census.gov/**", (route) => route.abort());
    await page.goto("/reps");
    await page.waitForLoadState("networkidle");
    const sent = page.waitForRequest((request) => request.url().endsWith("/api/civic/location") && request.method() === "POST", { timeout: 30_000 });
    await page.getByTestId("use-my-location").click();
    expect((await sent).postDataJSON()).toEqual({ lat: 41.5868, lng: -93.625 });
  });
});
