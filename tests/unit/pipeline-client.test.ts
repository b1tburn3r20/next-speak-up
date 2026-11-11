import { describe, expect, it } from "vitest";

import { unreachableMessage } from "@/lib/pipeline/unreachable";

const failed = (cause: unknown) => new TypeError("fetch failed", { cause });
const coded = (code: string) => Object.assign(new Error(""), { code });

describe("unreachableMessage", () => {
  it("names each way reaching the pipeline server fails, and what to check", () => {
    expect(unreachableMessage(failed(coded("ENOTFOUND")))).toMatch(/No server has that name.*ENOTFOUND.*railway\.internal:8787/);
    expect(unreachableMessage(failed(coded("ECONNREFUSED")))).toMatch(/nothing is listening on that port/);
    expect(unreachableMessage(failed(new AggregateError([coded("ENETUNREACH"), coded("ETIMEDOUT")], "")))).toMatch(/no network route.*ENETUNREACH, ETIMEDOUT/);
    expect(unreachableMessage(Object.assign(new Error("timed out"), { name: "TimeoutError" }))).toMatch(/didn't answer within 5 seconds/);
    expect(unreachableMessage(Object.assign(new TypeError("Failed to parse URL"), { cause: coded("ERR_INVALID_URL") }))).toMatch(/needs http:\/\//);
    expect(unreachableMessage(failed(coded("ECONNRESET")))).toMatch(/use http:\/\/ instead/);
    expect(unreachableMessage(new Error("odd"))).toBe("The pipeline server isn't responding.");
  });

  it("never includes an address", () => {
    const cause = Object.assign(new Error("connect ECONNREFUSED 10.0.0.5:8787"), { code: "ECONNREFUSED", address: "10.0.0.5", port: 8787 });
    expect(unreachableMessage(failed(cause))).not.toContain("10.0.0.5");
  });
});
