"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { InboxView } from "@/lib/notifications/inbox";
import { routes } from "@/lib/routes";
import { useCivicStore } from "@/stores/use-civic-store";

// How many waiting votes there were the last time the bell was opened, so the same ones don't
// count as new forever. Per device, which is fine for a badge.
const SEEN_KEY = "bell.seenWaiting";

function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeSeen(value: number) {
  try {
    localStorage.setItem(SEEN_KEY, String(value));
  } catch {
    // Not remembered, so the badge may come back next visit.
  }
}

/** What's new for you: your reps' votes waiting on yours, and every notification we've sent you. */
export function NotificationBell() {
  const waiting = useCivicStore((state) => state.pulseCount);
  const loadWaiting = useCivicStore((state) => state.loadPulseCount);
  const [inbox, setInbox] = useState<InboxView | null>(null);
  // Both renders agree before the counts load, because no badge shows until they do.
  const [seen, setSeen] = useState(readSeen);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadWaiting();
    fetch("/api/notifications/inbox")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: InboxView | null) => setInbox(data ?? { items: [], unread: 0 }))
      .catch(() => setInbox({ items: [], unread: 0 }));
  }, [loadWaiting]);

  const newVotes = waiting !== null && waiting > seen;
  const count = (inbox?.unread ?? 0) + (newVotes ? 1 : 0);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    if (waiting !== null) {
      writeSeen(waiting);
      setSeen(waiting);
    }
    if (inbox && inbox.unread > 0) {
      fetch("/api/notifications/inbox", { method: "PATCH" }).catch(() => undefined);
      // Shown as read the next time it opens, so what's new now stays marked while they look.
      setInbox({ ...inbox, unread: 0 });
    }
  };

  const loading = inbox === null || waiting === null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={count > 0 ? `Notifications, ${count} new` : "Notifications"}
          data-testid="notification-bell"
        >
          <Bell className="size-5" aria-hidden />
          {count > 0 ? (
            <span
              className="animate-pop-in absolute right-0.5 top-0.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-oppose px-1 text-[0.6rem] font-extrabold leading-4.5 text-oppose-foreground"
              data-testid="notification-count"
              aria-hidden
            >
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] gap-0 p-0" data-testid="notification-panel">
        <div className="flex items-center justify-between gap-2 border-b-2 px-4 py-2.5">
          <p className="font-extrabold">Notifications</p>
          <Link href={`${routes.settings}#notifications`} onClick={() => setOpen(false)} className="text-sm font-bold text-primary hover:underline">
            Choose what you get
          </Link>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4" data-testid="notification-skeleton" aria-hidden>
              {[0, 1, 2].map((row) => (
                <div key={row} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y-2">
              {waiting ? (
                <li>
                  <Link
                    href={routes.vote}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 hover:bg-muted"
                    data-testid="notification-waiting"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-oppose-tint">
                      <Vote className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-extrabold">
                        Your reps voted on {waiting.toLocaleString()} bill{waiting === 1 ? "" : "s"}{" "}you haven&apos;t
                      </span>
                      <span className="block text-sm text-muted-foreground">Vote on them to see if your reps match you.</span>
                    </span>
                  </Link>
                </li>
              ) : null}
              {inbox.items.map((item) => (
                <li key={item.id}>
                  <Link href={item.url} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-muted" data-testid="notification-item">
                    <span className="flex items-start gap-2">
                      {item.read ? null : <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="New" />}
                      <span className="min-w-0">
                        <span className="block break-words font-extrabold">{item.title}</span>
                        <span className="line-clamp-2 block break-words text-sm text-muted-foreground">{item.body}</span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(item.sentAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {!waiting && inbox.items.length === 0 ? (
                <li className="space-y-1 px-4 py-6 text-center" data-testid="notification-empty">
                  <p className="font-extrabold">Nothing new</p>
                  <p className="text-sm text-muted-foreground">
                    Reminders for your city&apos;s meetings, and news on bills you follow, show up here.
                  </p>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
