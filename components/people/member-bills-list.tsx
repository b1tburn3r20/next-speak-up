"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ordinal } from "@/lib/civic/labels";
import type { SponsoredListItem } from "@/lib/civic/people";

type Page = { items: SponsoredListItem[]; total: number; hasMore: boolean };

const DAY = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" } as const;

function Row({ bill }: { bill: SponsoredListItem }) {
  const when = bill.latestActionDate ? new Date(bill.latestActionDate).toLocaleDateString("en-US", DAY) : null;
  const body = (
    <>
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="font-extrabold text-primary">{bill.label}</span>
        {bill.becameLaw ? <span className="rounded-full bg-support-tint px-2 py-0.5 text-xs font-extrabold text-support">Became law</span> : null}
        {bill.external ? <ExternalLink className="size-3.5 text-muted-foreground" aria-label="Opens Congress.gov" /> : null}
      </span>
      <span className="line-clamp-2 block break-words text-sm font-semibold">{bill.title}</span>
      <span className="block text-xs text-muted-foreground">
        {when ? `Last action ${when}` : "No action date"} · {ordinal(bill.congress)} Congress
      </span>
    </>
  );
  const className = "block rounded-lg px-2 py-2 hover:bg-muted";
  if (!bill.href) return <div className={className}>{body}</div>;
  return bill.external ? (
    <a href={bill.href} target="_blank" rel="noreferrer" className={className} data-testid="member-bill">
      {body}
    </a>
  ) : (
    <Link href={bill.href} className={className} data-testid="member-bill">
      {body}
    </Link>
  );
}

/**
 * Bills a member sponsored, for one topic or only the ones that became law, newest first. Loads when
 * it's opened, a page at a time. Bills from before this Congress open on Congress.gov.
 */
export function MemberBillsList({ personId, area, becameLaw = false }: { personId: number; area?: string; becameLaw?: boolean }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = async (page: number) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ personId: String(personId), page: String(page) });
      if (area) query.set("area", area);
      if (becameLaw) query.set("law", "1");
      const response = await fetch(`/api/civic/people/sponsored?${query}`);
      if (!response.ok) throw new Error("failed");
      const next = (await response.json()) as Page;
      // Each page goes in its own slot, so a repeated request (like React's double run in development) can't list bills twice.
      setPages((current) => [...current.slice(0, page - 1), next]);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // Loads once, when it opens. Each opening mounts it fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = pages.flatMap((page) => page.items);
  const last = pages[pages.length - 1];

  if (failed && items.length === 0) return <p className="py-3 text-sm text-muted-foreground">Their bills didn&apos;t load. Try again in a moment.</p>;
  if (pages.length === 0) {
    return (
      <div className="space-y-3 py-2" data-testid="member-bills-skeleton" aria-hidden>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) return <p className="py-3 text-sm text-muted-foreground">None yet.</p>;

  return (
    <div className="space-y-2 pt-1" data-testid="member-bills">
      <p className="text-xs font-bold text-muted-foreground">
        {last.total.toLocaleString()} bill{last.total === 1 ? "" : "s"}, the most recent first
      </p>
      <ul className="-mx-2 divide-y">
        {items.map((bill) => (
          <li key={bill.key}>
            <Row bill={bill} />
          </li>
        ))}
      </ul>
      {last.hasMore ? (
        <Button variant="secondary" className="w-full" disabled={loading} onClick={() => load(pages.length + 1)} data-testid="member-bills-more">
          {loading ? "Loading…" : `Show more (${(last.total - items.length).toLocaleString()} left)`}
        </Button>
      ) : null}
    </div>
  );
}
