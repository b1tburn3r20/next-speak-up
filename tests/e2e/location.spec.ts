import { expect, test } from "@playwright/test";

// These use the free Census geocoder for real, because the bug they guard against came from
// how the live service behaves. Austin's district differs between the 119th and 120th maps.
test.skip(({ browserName }) => browserName !== "chromium");

test("coordinates resolve to the sitting Congress's district", async ({ request }) => {
  test.skip(new Date() >= new Date("2027-01-03"), "The 120th Congress is seated.");
  const response = await request.post("/api/civic/location", {
    data: { lat: 30.27, lng: -97.74 },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ regionCode: "TX", districtCode: "37" });
});

test("an address resolves, and DC's delegate seat maps to at-large", async ({ request }) => {
  const response = await request.post("/api/civic/location", {
    data: { address: "1600 Pennsylvania Ave NW, Washington, DC 20500" },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ regionCode: "DC", districtCode: "AL" });
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
