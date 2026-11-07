import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const APP = join(ROOT, "app");

function filesNamed(dir: string, name: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return filesNamed(path, name);
    return entry.name === name ? [path] : [];
  });
}

const fromApp = (path: string) => relative(APP, path).split(sep).join("/");

function hasLoadingAbove(page: string): boolean {
  let dir = dirname(page);
  while (dir.startsWith(APP)) {
    if (existsSync(join(dir, "loading.tsx"))) return true;
    dir = dirname(dir);
  }
  return false;
}

// Pages with nothing to wait for. Anything new has to choose a loading state or be added here.
const NO_LOADING_NEEDED = new Set([
  "page.tsx",
  "learn/page.tsx",
  "mission/page.tsx",
  "privacy/page.tsx",
  "community/users/[id]/page.tsx",
  "admin/permissions/[id]/page.tsx",
  "forum/create-forum-post/page.tsx",
  // Its client component shows RunDetailSkeleton while it fetches.
  "admin/pipelines/runs/[id]/page.tsx",
]);

const SHARED_PAGES = {
  "<BillPage": "components/bills/bill-page.tsx",
  "<RollCallPage": "components/bills/roll-call-page.tsx",
};

describe("loading states", () => {
  it.each(filesNamed(APP, "page.tsx").map((page) => [fromApp(page), page]))("%s has one", (name, page) => {
    const text = readFileSync(page, "utf8");
    // Federal and state share these, so the wrapper only passes through to them.
    const shared = Object.entries(SHARED_PAGES).some(
      ([tag, file]) => text.includes(tag) && readFileSync(join(ROOT, file), "utf8").includes("<Suspense"),
    );
    const suspense = text.includes("<Suspense") || shared;
    expect(hasLoadingAbove(page) || suspense || NO_LOADING_NEEDED.has(name)).toBe(true);
  });

  it("doesn't put a loading.tsx above a detail page, which would turn its 404 into a 200", () => {
    const pages = filesNamed(APP, "page.tsx").filter((page) => !NO_LOADING_NEEDED.has(fromApp(page)));
    const dynamic = pages.filter((page) => fromApp(page).includes("["));
    expect(dynamic.length).toBeGreaterThan(0);
    for (const page of dynamic) expect(hasLoadingAbove(page), fromApp(page)).toBe(false);
  });

  it("lists every API route in docs/loading-states.md", () => {
    const doc = readFileSync(join(ROOT, "docs/loading-states.md"), "utf8");
    const routes = filesNamed(join(APP, "api"), "route.ts").map((route) =>
      relative(join(APP, "api"), dirname(route)).split(sep).join("/"),
    );
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.filter((route) => !doc.includes(`\`${route}\``))).toEqual([]);
  });
});
