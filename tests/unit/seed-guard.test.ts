// @vitest-environment node
import { describe, expect, it } from "vitest";
import { assertLocalDatabase } from "@/prisma/seed";

describe("assertLocalDatabase", () => {
  it.each([
    "mysql://root:x@localhost:3306/gov",
    "mysql://root:x@127.0.0.1:3306/gov",
  ])("allows %s", (url) => {
    expect(() => assertLocalDatabase(url)).not.toThrow();
  });

  it.each([
    "mysql://root:x@containers.railway.app:3306/railway",
    "mysql://root:x@db.internal/gov",
    "mysql://root:x@10.0.0.5/gov",
  ])("refuses %s", (url) => {
    expect(() => assertLocalDatabase(url)).toThrow(/local only/);
  });

  it("refuses an unset URL", () => {
    expect(() => assertLocalDatabase(undefined)).toThrow();
  });
});
