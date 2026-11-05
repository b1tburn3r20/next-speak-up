import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    // Every paid service key is blank here, so no test can reach one by accident.
    env: {
      GOOGLE_API_KEY: "",
      LEMONFOX_API_KEY: "",
      EMAIL_HOST: "",
      EMAIL_USER: "",
      EMAIL_PASS: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      NEXTAUTH_URL: "http://localhost:3000",
    },
  },
});
