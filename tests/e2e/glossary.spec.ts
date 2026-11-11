// The glossary: words in summaries are underlined and explained, and only admins can change them.
import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, blockPaidServices, loginAs, readOnPastGate } from "./helpers";

const BILL = "/federal/bills/us-119-s-4465";
const ORIGIN = { origin: BASE_URL };
const main = (page: Page) => page.getByRole("main");

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

test("a member can't open the glossary admin or change it", async ({ page }) => {
  await loginAs(page, "test_member");
  await page.goto("/admin/glossary");
  await expect(page).not.toHaveURL(/\/admin\/glossary/);
  const response = await page.request.post("/api/admin/glossary", { headers: ORIGIN, data: { keyword: "nope", definition: "Not allowed." } });
  expect(response.status()).toBe(403);
});

test("an admin adds a word, and it's underlined on a bill and explains itself", async ({ page }) => {
  await loginAs(page, "test_admin");
  await page.goto(BILL);
  await readOnPastGate(page);
  const lead = (await main(page).getByTestId("digest-lead").innerText()).trim();
  // A long word from the summary that isn't in the glossary yet.
  const marked = new Set((await main(page).getByTestId("digest-lead").getByTestId("glossary-word").allInnerTexts()).map((text) => text.toLowerCase()));
  const word = lead.match(/[A-Za-z]{7,}/g)?.find((candidate) => !marked.has(candidate.toLowerCase()));
  test.skip(!word, "No long word in this summary");
  const definition = `A test meaning for ${word}, from the glossary spec.`;

  await page.goto("/admin/glossary");
  await main(page).getByTestId("glossary-add").click();
  await main(page).getByTestId("glossary-new-keyword").fill(word as string);
  await main(page).getByTestId("glossary-new-definition").fill(definition);
  await main(page).getByTestId("glossary-new-save").click();
  await expect(main(page).getByTestId("glossary-keyword").filter({ hasText: new RegExp(`^${word}$`) })).toBeVisible();

  try {
    await page.goto(BILL);
    await readOnPastGate(page);
    const trigger = main(page).getByTestId("digest-lead").getByTestId("glossary-word").filter({ hasText: word as string }).first();
    await expect(trigger).toBeVisible();
    await page.waitForLoadState("networkidle");
    await trigger.click();
    await expect(page.getByTestId("glossary-word-panel").getByTestId("glossary-meanings")).toContainText(definition);
  } finally {
    // Leaves the glossary as it was.
    await page.goto("/admin/glossary");
    await main(page).getByTestId("glossary-search").fill(word as string);
    page.once("dialog", (dialog) => dialog.accept());
    await main(page).getByTestId("glossary-term").filter({ hasText: definition }).getByTestId("glossary-term-remove").click();
    await expect(main(page).getByTestId("glossary-term").filter({ hasText: definition })).toHaveCount(0);
  }
});

test("an acronym with two meanings lists both", async ({ page }) => {
  await loginAs(page, "test_admin");
  await page.goto("/admin/glossary");
  await main(page).getByTestId("glossary-search").fill("CRA");
  await expect(main(page).getByTestId("glossary-keyword").filter({ hasText: /^CRA/ })).toContainText("2 meanings");
});
