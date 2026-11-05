import { describe, expect, it, vi } from "vitest";
import {
  createProgressTracker,
  isBackgroundRequest,
  isInternalNavigation,
  trackFetch,
} from "@/lib/request-progress";

describe("createProgressTracker", () => {
  it("is active until every overlapping request finishes", () => {
    const tracker = createProgressTracker();
    const events: boolean[] = [];
    tracker.subscribe((active) => events.push(active));
    tracker.start();
    tracker.start();
    tracker.finish();
    expect(tracker.active).toBe(true);
    tracker.finish();
    expect(tracker.active).toBe(false);
    expect(events).toEqual([true, false]);
  });

  it("can't go below zero, which would stick the bar", () => {
    const tracker = createProgressTracker();
    tracker.finish();
    tracker.start();
    expect(tracker.active).toBe(true);
    tracker.finish();
    expect(tracker.active).toBe(false);
  });

  it("stops notifying after unsubscribing", () => {
    const tracker = createProgressTracker();
    const listener = vi.fn();
    tracker.subscribe(listener)();
    tracker.start();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("trackFetch", () => {
  it("shows progress while a request runs, and returns its response", async () => {
    const tracker = createProgressTracker();
    let duringRequest = false;
    const response = new Response("ok");
    const wrapped = trackFetch(
      vi.fn(async () => {
        duringRequest = tracker.active;
        return response;
      }),
      tracker,
    );
    await expect(wrapped("/api/x")).resolves.toBe(response);
    expect(duringRequest).toBe(true);
    expect(tracker.active).toBe(false);
  });

  it("clears progress when a request fails, and still reports the failure", async () => {
    const tracker = createProgressTracker();
    const wrapped = trackFetch(vi.fn().mockRejectedValue(new Error("offline")), tracker);
    await expect(wrapped("/api/x")).rejects.toThrow("offline");
    expect(tracker.active).toBe(false);
  });

  it("ignores background session polling", async () => {
    const tracker = createProgressTracker();
    const listener = vi.fn();
    tracker.subscribe(listener);
    const wrapped = trackFetch(vi.fn().mockResolvedValue(new Response()), tracker);
    await wrapped("/api/auth/session");
    expect(listener).not.toHaveBeenCalled();
    expect(isBackgroundRequest("/api/civic/location")).toBe(false);
  });

  it("handles URL and Request inputs", async () => {
    const tracker = createProgressTracker();
    const wrapped = trackFetch(vi.fn().mockResolvedValue(new Response()), tracker);
    await wrapped(new URL("http://localhost/api/x"));
    await wrapped(new Request("http://localhost/api/x"));
    expect(tracker.active).toBe(false);
  });
});

describe("isInternalNavigation", () => {
  const here = "http://localhost:3000/bills?q=tax";
  const anchor = (href: string, target = "", download = false) => ({
    href,
    target,
    hasAttribute: (name: string) => name === "download" && download,
  });
  const click = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  };

  it("is true for a normal link to another page", () => {
    expect(isInternalNavigation(anchor("http://localhost:3000/dashboard"), click, here)).toBe(true);
  });

  it("is true when only the search changes", () => {
    expect(isInternalNavigation(anchor("http://localhost:3000/bills?q=x"), click, here)).toBe(true);
  });

  it.each([
    ["another site", anchor("https://www.congress.gov/x"), click],
    ["a new tab", anchor("http://localhost:3000/x", "_blank"), click],
    ["a download", anchor("http://localhost:3000/x", "", true), click],
    ["ctrl-click", anchor("http://localhost:3000/x"), { ...click, ctrlKey: true }],
    ["a middle click", anchor("http://localhost:3000/x"), { ...click, button: 1 }],
    ["the same page", anchor(here), click],
    ["an anchor on this page", anchor(`${here}#votes`), click],
  ])("is false for %s, which would leave the bar stuck", (_label, link, event) => {
    expect(isInternalNavigation(link, event, here)).toBe(false);
  });
});
