// Adding Coolbills to a phone's home screen: asked once, and always in the More sheet after that.
import { expect, test, type Page } from "@playwright/test";
import { blockPaidServices } from "./helpers";

test.skip(({ browserName }) => browserName !== "chromium");

/**
 * Plays the browser's install offer, which real browsers only make on a live HTTPS site, and records
 * whether the install dialog was opened and what the person chose.
 */
async function offerInstall(page: Page, outcome: "accepted" | "dismissed") {
  await page.addInitScript((choice) => {
    const calls: string[] = [];
    (window as unknown as { __installCalls: string[] }).__installCalls = calls;
    window.addEventListener("DOMContentLoaded", () => {
      const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      event.prompt = async () => {
        calls.push("prompt");
      };
      event.userChoice = Promise.resolve({ outcome: choice });
      window.dispatchEvent(event);
    });
  }, outcome);
}

const calls = (page: Page) => page.evaluate(() => (window as unknown as { __installCalls: string[] }).__installCalls);

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("phone"), "Phones only");
  await blockPaidServices(page);
});

test("asks once, remembers Not now, and keeps Install in the More sheet", async ({ page }) => {
  await offerInstall(page, "dismissed");
  await page.goto("/federal/bills");
  const prompt = page.getByTestId("install-prompt");
  await expect(prompt).toBeVisible({ timeout: 10_000 });
  await prompt.getByTestId("install-later").click();
  await expect(prompt).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("pwa.installAsked"))).toBe("true");

  // Not asked again on this device.
  await page.reload();
  await page.waitForTimeout(5_000);
  await expect(page.getByTestId("install-prompt")).toHaveCount(0);

  // But it's one tap away in More.
  await page.getByTestId("mobile-menu-button").click();
  await page.getByTestId("install-tile").click();
  expect(await calls(page)).toEqual(["prompt"]);
});

test("Install opens the browser's dialog, and an installed app isn't offered again", async ({ page }) => {
  await offerInstall(page, "accepted");
  await page.goto("/federal/bills");
  await page.getByTestId("install-prompt").getByTestId("install-now").click({ timeout: 10_000 });
  await expect.poll(() => calls(page)).toEqual(["prompt"]);
  await page.getByTestId("mobile-menu-button").click();
  await expect(page.getByTestId("install-tile")).toHaveCount(0);
});

test("a browser that can't install isn't nagged, and More shows how to do it by hand", async ({ page }) => {
  await page.goto("/federal/bills");
  await page.waitForTimeout(5_000);
  await expect(page.getByTestId("install-prompt")).toHaveCount(0);
  await page.getByTestId("mobile-menu-button").click();
  await page.getByTestId("install-tile").click();
  await expect(page.getByTestId("install-steps")).toContainText("Install app");
});
