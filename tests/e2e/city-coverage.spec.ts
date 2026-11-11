// Every city's page, checked against what the audit says we have for it. Opt in, since it opens every
// city in the state (940 in Iowa):
//
//   npm run audit:cities
//   CITY_AUDIT=1 npx playwright test tests/e2e/city-coverage.spec.ts --project=desktop
//
// The audit decides what each city should show. This checks that the page shows it, and that a city
// without something says so instead of showing nothing.
import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { blockPaidServices } from "./helpers";

type Row = {
  slug: string;
  name: string;
  audit: { mayor: boolean; legislators: boolean; cityHall: boolean; nextMeeting: boolean; topics: boolean; speak: boolean };
};

const STATE = process.env.CITY_AUDIT_STATE ?? "ia";
const REPORT = `reports/cities-${STATE}-audit.json`;
const enabled = process.env.CITY_AUDIT === "1" && existsSync(REPORT);
const cities: Row[] = enabled ? JSON.parse(readFileSync(REPORT, "utf-8")).cities : [];

test.describe(`every ${STATE.toUpperCase()} city's page`, () => {
  test.skip(!enabled, `Set CITY_AUDIT=1 after npm run audit:cities, which writes ${REPORT}`);

  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Runs at one width; the layout is covered by city.spec.ts");
    await blockPaidServices(page);
  });

  for (const city of cities) {
    test(city.name, async ({ page }) => {
      const response = await page.goto(`/state/${STATE}/city/${city.slug}`);
      expect(response?.status()).toBe(200);
      const main = page.getByRole("main");

      if (city.audit.mayor) await expect(main.getByTestId("city-official").first()).toContainText("Mayor");
      if (city.audit.legislators) {
        await expect(main.getByTestId("city-legislators")).toBeVisible();
        expect(await main.getByTestId("city-legislator").count()).toBeGreaterThanOrEqual(2);
      }
      if (city.audit.cityHall) {
        await expect(main.getByTestId("city-hall-address").or(main.getByTestId("city-hall-phone")).first()).toBeVisible();
      } else {
        await expect(main.getByTestId("no-city-hall")).toBeVisible();
      }
      if (city.audit.nextMeeting) await expect(main.getByTestId("next-meeting-when")).toBeVisible();
      if (city.audit.speak) {
        await expect(main.getByTestId("speak-link").or(main.getByTestId("speak-info")).or(main.getByTestId("speak-window")).first()).toBeVisible();
      }
    });
  }
});
