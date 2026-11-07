import { defineConfig, devices } from "@playwright/test";

// Separate from `npm run dev` on 3000, so a test run stays out of that terminal and can blank paid keys.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

const widths = [
  { name: "phone-small", width: 360, height: 740 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "./test-results",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: widths.map(({ name, width, height }) => ({
    name,
    use: { ...devices["Desktop Chrome"], viewport: { width, height } },
  })),
  webServer: {
    command: `npx next dev --turbopack -p ${PORT}`,
    url: `${BASE_URL}/api/auth/providers`,
    reuseExistingServer: true,
    timeout: 180_000,
    // Blank, so a stray click can't reach a paid service during tests.
    env: {
      NEXT_DIST_DIR: ".next-test",
      NEXTAUTH_URL: BASE_URL,
      GOOGLE_API_KEY: "",
      LEMONFOX_API_KEY: "",
      EMAIL_HOST: "",
      EMAIL_USER: "",
      EMAIL_PASS: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      RATE_LIMITING_DISABLED: "true",
    },
  },
});
