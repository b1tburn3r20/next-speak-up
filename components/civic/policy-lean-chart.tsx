"use client";

import { useEffect, useState } from "react";
import { Disclosure } from "@/components/ui/disclosure";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leanChanges, type PolicyLean } from "@/lib/civic/engagement-logic";

function readSnapshot(key: string): PolicyLean[] | null {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as PolicyLean[]) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(key: string, areas: PolicyLean[]) {
  try {
    localStorage.setItem(key, JSON.stringify(areas));
  } catch {
    // Only the animation depends on this.
  }
}

function Change({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span className="animate-pop-in ml-1 rounded-full bg-muted px-1.5 text-xs font-extrabold tabular-nums" data-testid="lean-change">
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

/**
 * How you've voted, by topic. Opposed goes left and supported goes right, so position says which is
 * which even without color. Each bar grows from where it was on your last visit.
 */
export function PolicyLeanChart({ userId, areas }: { userId: string; areas: PolicyLean[] }) {
  const key = `policy-lean:${userId}`;
  const [shown, setShown] = useState(areas);
  const [previous, setPrevious] = useState<PolicyLean[] | null>(null);

  useEffect(() => {
    const saved = readSnapshot(key);
    const before = new Map((saved ?? []).map((row) => [row.area, row]));
    // Start each bar where it was last time, or from nothing, then let it grow on the next frame.
    let second = 0;
    const first = requestAnimationFrame(() => {
      // Saved here, not above: React can run this effect twice, and a cancelled run mustn't count.
      saveSnapshot(key, areas);
      setPrevious(saved);
      setShown(areas.map((row) => ({ area: row.area, support: before.get(row.area)?.support ?? 0, oppose: before.get(row.area)?.oppose ?? 0 })));
      second = requestAnimationFrame(() => setShown(areas));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [key, areas]);

  if (areas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="lean-empty">
        Vote on a few bills to see how you lean on each topic.
      </p>
    );
  }

  const changes = previous ? leanChanges(previous, areas) : null;
  const shownByArea = new Map(shown.map((row) => [row.area, row]));
  const max = Math.max(1, ...areas.flatMap((row) => [row.support, row.oppose]));

  return (
    <div className="space-y-3" data-testid="policy-lean">
      <p className="flex justify-between text-xs font-extrabold text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-oppose" aria-hidden />← Opposed
        </span>
        <span className="flex items-center gap-1">
          Supported →<span className="size-2.5 rounded-sm bg-support" aria-hidden />
        </span>
      </p>
      <ul className="space-y-2.5">
        {areas.map((row) => {
          const current = shownByArea.get(row.area) ?? row;
          const change = changes?.get(row.area);
          return (
            <li
              key={row.area}
              title={`${row.area}: ${row.support} supported, ${row.oppose} opposed`}
              data-testid="lean-row"
            >
              <p className="break-words text-sm font-bold leading-snug">{row.area}</p>
              <div className="grid grid-cols-[1.75rem_1fr_1fr_1.75rem] items-center gap-x-1" aria-hidden>
                <span className="text-right text-xs font-extrabold tabular-nums">{row.oppose}</span>
                <div className="flex h-3 justify-end border-r-2 border-background-dark pr-px">
                  <div
                    className="rounded-l bg-oppose transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: `${(current.oppose / max) * 100}%` }}
                  />
                </div>
                <div className="flex h-3 pl-px">
                  <div
                    className="rounded-r bg-support transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: `${(current.support / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold tabular-nums">{row.support}</span>
              </div>
              {change && (change.support !== 0 || change.oppose !== 0) ? (
                <p className="text-xs text-muted-foreground">
                  Since last time:
                  {change.support !== 0 ? (
                    <>
                      {" "}supported<Change value={change.support} />
                    </>
                  ) : null}
                  {change.oppose !== 0 ? (
                    <>
                      {" "}opposed<Change value={change.oppose} />
                    </>
                  ) : null}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        This counts bills, not your view of a whole topic. A bill can expand or restrict something.
      </p>
      <Disclosure title="See this as a table" data-testid="lean-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Supported</TableHead>
              <TableHead>Opposed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map((row) => (
              <TableRow key={row.area}>
                <TableCell>{row.area}</TableCell>
                <TableCell>{row.support}</TableCell>
                <TableCell>{row.oppose}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Disclosure>
    </div>
  );
}
