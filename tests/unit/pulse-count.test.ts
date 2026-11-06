import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCivicStore } from "@/stores/use-civic-store";

describe("loadPulseCount", () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ count: 3 }), { status: 200 }));

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    useCivicStore.setState({ pulseCount: null });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shares one request between badges that load together", async () => {
    const { loadPulseCount } = useCivicStore.getState();
    await Promise.all([loadPulseCount(), loadPulseCount()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useCivicStore.getState().pulseCount).toBe(3);
  });

  it("doesn't ask again once it knows, unless forced", async () => {
    const { loadPulseCount } = useCivicStore.getState();
    await loadPulseCount();
    await loadPulseCount();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await loadPulseCount(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("can try again after a failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const { loadPulseCount } = useCivicStore.getState();
    await loadPulseCount();
    expect(useCivicStore.getState().pulseCount).toBeNull();
    await loadPulseCount();
    expect(useCivicStore.getState().pulseCount).toBe(3);
  });
});
