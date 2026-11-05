import { expect, test } from "@playwright/test";
import { blockPaidServices, seedPassword } from "./helpers";

test.beforeEach(async ({ page }) => {
  await blockPaidServices(page);
});

async function session(page) {
  const response = await page.request.get("/api/auth/session");
  return response.json();
}

test("logging in creates a real database session NextAuth recognizes", async ({ page }) => {
  const response = await page.request.post("/api/account/login", {
    headers: { origin: "http://localhost:3000" },
    data: { identifier: "test_member", password: seedPassword() },
  });
  expect(response.status()).toBe(200);

  const data = await session(page);
  expect(data.user.username).toBe("test_member");
  expect(data.user.role.name).toBe("Member");
});

test("session responses never include a password hash", async ({ page }) => {
  await page.request.post("/api/account/login", {
    headers: { origin: "http://localhost:3000" },
    data: { identifier: "test_member", password: seedPassword() },
  });
  const text = await (await page.request.get("/api/auth/session")).text();
  expect(text).not.toContain("passwordHash");
  expect(text).not.toContain("$2b$");
});

test("logging in also works with an email address", async ({ page }) => {
  const response = await page.request.post("/api/account/login", {
    headers: { origin: "http://localhost:3000" },
    data: { identifier: "TEST_MEMBER@coolbills.test", password: seedPassword() },
  });
  expect(response.status()).toBe(200);
});

test("a wrong password and an unknown user get the same answer", async ({ page }) => {
  const headers = { origin: "http://localhost:3000" };
  const wrong = await page.request.post("/api/account/login", {
    headers,
    data: { identifier: "test_member", password: "wrong password" },
  });
  const unknown = await page.request.post("/api/account/login", {
    headers,
    data: { identifier: "nobody_here", password: "wrong password" },
  });
  expect(wrong.status()).toBe(401);
  expect(unknown.status()).toBe(401);
  expect(await wrong.json()).toEqual(await unknown.json());
});

test("requests from another site are refused", async ({ page }) => {
  const response = await page.request.post("/api/account/login", {
    headers: { origin: "https://evil.example" },
    data: { identifier: "test_member", password: seedPassword() },
  });
  expect(response.status()).toBe(403);
});

test("signing up creates a Member who is logged in, and duplicates are refused", async ({
  page,
}) => {
  const username = `e2e_${Date.now()}`;
  const headers = { origin: "http://localhost:3000" };
  const data = { username, email: `${username}@coolbills.test`, password: "a good password" };
  const created = await page.request.post("/api/account/signup", { headers, data });
  expect(created.status()).toBe(201);
  const current = await session(page);
  expect(current.user.username).toBe(username);
  expect(current.user.role.name).toBe("Member");
  expect(current.user.needsOnboarding).toBe(true);

  const again = await page.request.post("/api/account/signup", { headers, data });
  expect(again.status()).toBe(409);
});

test("weak signup details are refused", async ({ page }) => {
  const response = await page.request.post("/api/account/signup", {
    headers: { origin: "http://localhost:3000" },
    data: { username: "ok_name", email: "ok@coolbills.test", password: "short" },
  });
  expect(response.status()).toBe(400);
});

test("signing out through NextAuth ends a password session", async ({ page }) => {
  await page.request.post("/api/account/login", {
    headers: { origin: "http://localhost:3000" },
    data: { identifier: "test_member", password: seedPassword() },
  });
  expect((await session(page)).user).toBeTruthy();

  const { csrfToken } = await (await page.request.get("/api/auth/csrf")).json();
  await page.request.post("/api/auth/signout", {
    form: { csrfToken, callbackUrl: "/", json: "true" },
  });
  expect((await session(page)).user).toBeUndefined();
});
