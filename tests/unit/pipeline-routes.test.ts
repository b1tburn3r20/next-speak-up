import { describe, expect, it } from "vitest";
import { filterQuery, matchPipelineRoute, withActor } from "@/lib/pipeline/routes";

const match = (method: string, path: string) => matchPipelineRoute(method, path.split("/"));

describe("matchPipelineRoute", () => {
  it("reading needs the view permission", () => {
    for (const path of ["status", "pipelines", "runs", "runs/12", "runs/12/logs", "metrics", "issues"]) {
      expect(match("GET", path)?.permission).toBe("pipelines.view");
    }
  });

  it("anything that acts needs the manage permission, and is audited", () => {
    for (const [method, path] of [
      ["POST", "pipelines/ia_people/run"],
      ["POST", "daily/run"],
      ["POST", "stop"],
      ["DELETE", "queue/abc123"],
      ["PUT", "schedule"],
    ]) {
      const route = match(method, path);
      expect(route?.permission).toBe("pipelines.manage");
      expect(route?.audit).toBeTruthy();
    }
  });

  it("refuses everything not on the list", () => {
    for (const [method, path] of [
      ["GET", "health"],
      ["GET", "docs"],
      ["GET", "runs/abc"],
      ["GET", "runs/1/2"],
      ["POST", "status"],
      ["DELETE", "pipelines"],
      ["GET", "../etc/passwd"],
      ["GET", "runs/1/../../secret"],
      ["POST", "pipelines/Bad-Name/run"],
      ["POST", "pipelines/a b/run"],
      ["POST", "pipelines/a;rm/run"],
      ["DELETE", "queue/../../x"],
    ]) {
      expect(match(method, path), `${method} ${path}`).toBeNull();
    }
  });
});

describe("filterQuery", () => {
  it("drops anything not listed, and empty values", () => {
    const params = new URLSearchParams("pipeline=x&status=&evil=1&limit=5");
    expect(filterQuery(params, ["pipeline", "status", "limit"])).toBe("?pipeline=x&limit=5");
    expect(filterQuery(params)).toBe("");
  });
});

describe("withActor", () => {
  it("overrides whoever a browser claims to be", () => {
    expect(withActor({ actor: "someone-else", limit: 5 }, "real")).toEqual({ actor: "real", limit: 5 });
  });

  it("copes with a body that isn't an object, and caps the length", () => {
    expect(withActor(null, "real")).toEqual({ actor: "real" });
    expect(withActor([1], "real")).toEqual({ actor: "real" });
    expect((withActor({}, "x".repeat(99)).actor as string).length).toBe(60);
  });
});
