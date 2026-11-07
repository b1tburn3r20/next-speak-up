import { readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";
import { PAID_ROUTES } from "./paid-routes";


export const BASE_URL = "http://localhost:3100";

export async function blockPaidServices(page: Page) {
  await page.route(PAID_ROUTES, (route) =>
    route.fulfill({ status: 503, json: { error: "Blocked in tests" } }),
  );
}

/** Picks from one of our dropdowns. `scope` narrows which one, but its options open in a portal. */
export async function chooseOption(page: Page, label: string, option: string, scope: Page | Locator = page) {
  await scope.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

export function seedPassword(): string {
  const line = readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("SEED_USER_PASSWORD="));
  if (!line) throw new Error("SEED_USER_PASSWORD is missing. Run npm run db:seed first.");
  return line.split("=").slice(1).join("=").replace(/^"|"$/g, "");
}

/** Logs in through the real API, so tests that aren't about login stay fast. */
export async function loginAs(page: Page, username: string) {
  const response = await page.request.post("/api/account/login", {
    headers: { origin: BASE_URL },
    data: { identifier: username, password: seedPassword() },
  });
  expect(response.ok()).toBeTruthy();
}

/** The page must fit its width. Sideways scrolling is the most common mobile layout bug. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, "page should not scroll sideways").toBeLessThanOrEqual(1);
}
