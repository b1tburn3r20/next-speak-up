import { describe, expect, it } from "vitest";
import { describeError } from "@/lib/describe-error";

describe("describeError", () => {
  it("digs the real reason out of fetch's bare 'fetch failed'", () => {
    const cause = Object.assign(new Error("connect ETIMEDOUT 148.129.75.136:443"), { code: "ETIMEDOUT", syscall: "connect", address: "148.129.75.136", port: 443 });
    const error = new TypeError("fetch failed", { cause });
    expect(describeError(error)).toBe("TypeError fetch failed; cause: connect ETIMEDOUT 148.129.75.136:443 ETIMEDOUT connect 148.129.75.136:443");
  });

  it("lists each error in a group that has no message of its own", () => {
    const group = new AggregateError([Object.assign(new Error(""), { code: "ENETUNREACH" }), Object.assign(new Error(""), { code: "ECONNREFUSED" })], "");
    expect(describeError(new TypeError("fetch failed", { cause: group }))).toContain("[ENETUNREACH; ECONNREFUSED]");
  });

  it("copes with things that aren't errors", () => {
    expect(describeError("plain")).toBe("plain");
    expect(describeError({})).toBe("no details");
  });
});
