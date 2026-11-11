import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/prisma/client", () => ({ default: { cityProfile: { findMany: (...args: unknown[]) => findMany(...args) } } }));

describe("city search", () => {
  it("finds a city by name, with typos, and links to its page", async () => {
    // Biggest first, as the query orders them.
    findMany.mockResolvedValue([
      { slug: "des-moines", name: "Des Moines", population: 213096 },
      { slug: "pella", name: "Pella", population: 10603 },
      { slug: "pleasant-hill", name: "Pleasant Hill", population: 11000 },
    ]);
    const { cityProviders } = await import("@/lib/search/providers/cities");
    const iowa = cityProviders.find((provider) => provider.id === "ia-cities");
    const found = await iowa!.search({ query: "pela", session: null, limit: 5 });
    expect(found[0]).toMatchObject({ title: "Pella", href: "/state/ia/city/pella", subtitle: "10,603 people" });
    expect(found.map((result) => result.title)).not.toContain("Des Moines");
  });

  it("is listed for everyone, signed in or not", async () => {
    const { providersFor } = await import("@/lib/search/registry");
    expect(providersFor(null).map((provider) => provider.id)).toContain("ia-cities");
  });
});
