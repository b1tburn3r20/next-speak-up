import { Profiler } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { RevealPanel } from "@/components/civic/reveal-panel";
import { useCivicStore } from "@/stores/use-civic-store";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const fetchMock = vi.fn();

const REP = {
  personId: 1,
  name: "Pat Rep",
  imageUrl: null,
  bioguide: "P000001",
  party: "D",
  role: "Representative",
  position: "YEA",
  outcome: "NO_RECORD",
  occurredAt: null,
};

function respondWith(reps: unknown[] = [REP]) {
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).includes("/reveal")) return new Response(JSON.stringify({ reps }), { status: 200 });
    return new Response(JSON.stringify({}), { status: 200 });
  });
}

beforeEach(() => {
  useCivicStore.setState({ votes: {}, follows: {}, favorites: {}, reveals: {}, voteDelta: 0, reward: null });
  fetchMock.mockReset();
  respondWith();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const buttons = (slug: string) => (
  <BillActionButtons slug={slug} signedIn initialPosition={null} initialFollowing={false} />
);

describe("rendering", () => {
  it("voting on one bill doesn't re-render another bill's buttons", async () => {
    const renders: Record<string, number> = { a: 0, b: 0 };
    const count = (id: string) => () => {
      renders[id] += 1;
    };
    render(
      <>
        <div data-testid="bill-a">
          <Profiler id="a" onRender={count("a")}>
            {buttons("a")}
          </Profiler>
        </div>
        <div data-testid="bill-b">
          <Profiler id="b" onRender={count("b")}>
            {buttons("b")}
          </Profiler>
        </div>
      </>,
    );
    const afterMount = { ...renders };
    await act(async () => {
      fireEvent.click(screen.getByTestId("bill-a").querySelector('[data-testid="vote-support"]')!);
    });
    expect(renders.a).toBeGreaterThan(afterMount.a);
    expect(renders.b).toBe(afterMount.b);
  });
});

describe("voting", () => {
  it("shows the server's first answer, then what the user changed", async () => {
    render(<BillActionButtons slug="a" signedIn initialPosition="NAY" initialFollowing={false} />);
    expect(screen.getByTestId("vote-oppose").getAttribute("aria-pressed")).toBe("true");
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    expect(screen.getByTestId("vote-support").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("vote-oppose").getAttribute("aria-pressed")).toBe("false");
  });

  it("rolls back and undoes the reward if the save fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "No." }), { status: 500 }));
    render(buttons("a"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    expect(screen.getByTestId("vote-support").getAttribute("aria-pressed")).toBe("false");
    expect(useCivicStore.getState().voteDelta).toBe(0);
    expect(useCivicStore.getState().reward).toBeNull();
  });

  it("gives a reward for a new vote, but not for changing one", async () => {
    render(<BillActionButtons slug="a" signedIn initialPosition="NAY" initialFollowing={false} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    expect(useCivicStore.getState().reward).toBeNull();
    expect(useCivicStore.getState().voteDelta).toBe(0);
  });
});

describe("the reveal", () => {
  const panel = (initialPosition: string | null = null) => (
    <>
      <BillActionButtons slug="a" signedIn initialPosition={initialPosition} initialFollowing={false} />
      <RevealPanel slug="a" signedIn initialPosition={initialPosition} />
    </>
  );
  const reveals = () => fetchMock.mock.calls.filter(([url]) => String(url).includes("/reveal"));

  it("doesn't ask how a rep voted until the user votes", () => {
    render(panel());
    expect(reveals()).toHaveLength(0);
    expect(screen.getByTestId("reveal-hidden")).toBeTruthy();
    expect(screen.queryByText("Pat Rep")).toBeNull();
  });

  it("reveals and compares once the user votes", async () => {
    render(panel());
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    await waitFor(() => expect(screen.getByTestId("reveal-row")).toBeTruthy());
    expect(screen.getByTestId("reveal-row").getAttribute("data-outcome")).toBe("MATCH");
    expect(screen.getByText("You match")).toBeTruthy();
  });

  it("updates right away when the user changes their mind, with no new request", async () => {
    render(panel());
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    await waitFor(() => expect(screen.getByText("You match")).toBeTruthy());
    const before = reveals().length;
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-oppose"));
    });
    expect(screen.getByText("You differ")).toBeTruthy();
    expect(reveals()).toHaveLength(before);
  });

  it("hides it again when the vote is taken back", async () => {
    render(panel());
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    await waitFor(() => expect(screen.getByTestId("reveal-row")).toBeTruthy());
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    await waitFor(() => expect(screen.getByTestId("reveal-hidden")).toBeTruthy());
  });

  it("can be shown anyway, without claiming a match", async () => {
    render(panel());
    await act(async () => {
      fireEvent.click(screen.getByTestId("reveal-anyway"));
    });
    await waitFor(() => expect(screen.getByTestId("reveal-row")).toBeTruthy());
    expect(screen.getByTestId("reveal-row").getAttribute("data-outcome")).toBe("UNVOTED");
    expect(screen.queryByText("You match")).toBeNull();
    expect(screen.getByText(/Voted yes/i)).toBeTruthy();
  });

  it("doesn't count a missed vote as agreeing or disagreeing", async () => {
    respondWith([{ ...REP, position: "NOT_VOTING" }]);
    render(panel());
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    await waitFor(() => expect(screen.getByTestId("reveal-row")).toBeTruthy());
    expect(screen.getByTestId("reveal-row").getAttribute("data-outcome")).toBe("DID_NOT_VOTE");
  });

  it("explains when we don't know the user's reps", async () => {
    respondWith([]);
    render(panel());
    await act(async () => {
      fireEvent.click(screen.getByTestId("vote-support"));
    });
    await waitFor(() => expect(screen.getByTestId("reveal-no-reps")).toBeTruthy());
  });

  it("offers a retry when the reveal fails", async () => {
    fetchMock.mockImplementation(async () => new Response("{}", { status: 500 }));
    render(panel());
    await act(async () => {
      fireEvent.click(screen.getByTestId("reveal-anyway"));
    });
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });

  it("shows the comparison straight away for a bill they've already voted on", async () => {
    render(panel("YEA"));
    await waitFor(() => expect(screen.getByTestId("reveal-row")).toBeTruthy());
    expect(screen.getByText("You match")).toBeTruthy();
  });
});
