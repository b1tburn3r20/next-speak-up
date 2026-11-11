"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Laptop, Send, Share, X } from "lucide-react";
import { toast } from "sonner";
import { RelativeDate } from "@/components/app/relative-date";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { NotifyPref } from "@/lib/notifications/plan";
import type { NotifyManagerView } from "@/lib/notifications/subscriptions";
import { routes } from "@/lib/routes";
import { usePushStore, type PushStatus } from "@/stores/use-push-store";

/** What to say about this browser, for each state it can be in. */
export function pushStatusText(status: PushStatus): string {
  switch (status) {
    case "on":
      return "On for this device.";
    case "blocked":
      return "This browser is blocking them. Allow notifications for this site in its settings, then come back.";
    case "install":
      return "On an iPhone or iPad, add Coolbills to your Home Screen first, then open it from there.";
    case "unsupported":
      return "This browser can't show notifications. Try Chrome, Edge, Firefox, or Safari.";
    case "off":
      return "Off for this device.";
    default:
      return "Checking…";
  }
}

async function saveChoice(change: Record<string, unknown>): Promise<boolean> {
  const response = await fetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  }).catch(() => null);
  return Boolean(response?.ok);
}

/** This browser's push address, to mark it in the list of devices. */
function useThisEndpoint(status: PushStatus): string | null {
  const [endpoint, setEndpoint] = useState<string | null>(null);
  useEffect(() => {
    if (status !== "on" || !("serviceWorker" in navigator)) return;
    let live = true;
    void navigator.serviceWorker
      .getRegistration("/")
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => live && setEndpoint(subscription?.endpoint ?? null));
    return () => {
      live = false;
    };
  }, [status]);
  return status === "on" ? endpoint : null;
}

/**
 * Settings' notification manager: whether this device gets them, and every kind on its own switch, with
 * exactly what each one covers for this person. Their city, their topics one by one, the bills they
 * follow, and the devices that get them. Nothing here is on without a way to turn it off.
 */
export function PushSettings({ initial }: { initial: NotifyManagerView }) {
  const router = useRouter();
  const status = usePushStore((store) => store.status);
  const busy = usePushStore((store) => store.busy);
  const check = usePushStore((store) => store.check);
  const enable = usePushStore((store) => store.enable);
  const disable = usePushStore((store) => store.disable);
  const [prefs, setPrefs] = useState(initial.prefs);
  const [muted, setMuted] = useState(() => new Set(initial.topics.filter((topic) => topic.muted).map((topic) => topic.name)));
  const [unfollowed, setUnfollowed] = useState<Set<string>>(new Set());
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [testing, setTesting] = useState(false);
  const thisEndpoint = useThisEndpoint(status);

  useEffect(() => {
    void check();
  }, [check]);

  const turnOn = async () => {
    try {
      if (await enable()) {
        toast.success("Notifications are on for this device.");
        router.refresh();
      }
    } catch {
      toast.error("That didn't work. Please try again.");
    }
  };

  const turnOff = async () => {
    await disable();
    router.refresh();
  };

  const change = async (pref: NotifyPref, on: boolean) => {
    setPrefs((current) => ({ ...current, [pref]: on }));
    if (!(await saveChoice({ [pref]: on }))) {
      setPrefs((current) => ({ ...current, [pref]: !on }));
      toast.error("That didn't save. Please try again.");
    }
  };

  const toggleTopic = async (name: string) => {
    const mute = !muted.has(name);
    const flip = (on: boolean) =>
      setMuted((current) => {
        const next = new Set(current);
        if (on) next.add(name);
        else next.delete(name);
        return next;
      });
    flip(mute);
    if (!(await saveChoice({ topic: { name, muted: mute } }))) {
      flip(!mute);
      toast.error("That didn't save. Please try again.");
    }
  };

  const unfollow = async (slug: string, label: string) => {
    setUnfollowed((current) => new Set(current).add(slug));
    const response = await fetch("/api/civic/bills/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, following: false }),
    }).catch(() => null);
    if (!response?.ok) {
      setUnfollowed((current) => {
        const next = new Set(current);
        next.delete(slug);
        return next;
      });
      toast.error("That didn't save. Please try again.");
    } else toast.success(`You won't hear about ${label} anymore.`);
  };

  const removeDevice = async (device: NotifyManagerView["devices"][number]) => {
    if (device.endpoint === thisEndpoint) return turnOff();
    setRemoved((current) => new Set(current).add(device.id));
    const response = await fetch("/api/notifications/subscription", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: device.id }),
    }).catch(() => null);
    if (!response?.ok) {
      setRemoved((current) => {
        const next = new Set(current);
        next.delete(device.id);
        return next;
      });
      toast.error("That didn't work. Please try again.");
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/notifications/test", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) toast.error(body.error ?? "That didn't send. Please try again.");
      else if (!body.reached) toast.error("It didn't reach this device. Try turning notifications off and on again.");
      else toast.success("Sent. It should show up in a moment.");
    } finally {
      setTesting(false);
    }
  };

  const topics = initial.topics;
  const heard = topics.filter((topic) => !muted.has(topic.name)).length;
  const followed = initial.followed.filter((bill) => !unfollowed.has(bill.slug));
  const devices = initial.devices.filter((device) => !removed.has(device.id));

  const topicChips = (
    <div className="space-y-2 pt-1" data-testid="notify-topics">
      {topics.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">Tap a topic to stop or start its notifications. You still track it either way.</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => {
              const on = !muted.has(topic.name);
              return (
                <Button
                  key={topic.name}
                  type="button"
                  variant="choice"
                  size="sm"
                  aria-pressed={on}
                  onClick={() => void toggleTopic(topic.name)}
                  className={on ? undefined : "text-muted-foreground line-through"}
                  data-testid="notify-topic"
                  data-topic={topic.name}
                >
                  {on ? <Bell className="size-3.5" aria-hidden /> : <BellOff className="size-3.5" aria-hidden />}
                  {topic.name}
                </Button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">You don&apos;t track any topics yet.</p>
      )}
      <Link href={routes.federal.topics} className="inline-block text-sm font-bold text-primary hover:underline">
        {topics.length > 0 ? "Track more topics" : "Pick topics to track"}
      </Link>
    </div>
  );

  type Row = { pref: NotifyPref; title: string; detail: React.ReactNode; more?: React.ReactNode };
  const groups: { heading: string; rows: Row[] }[] = [
    {
      heading: "Your city",
      rows: [
        {
          pref: "cityMeetings",
          title: "City council meetings",
          detail: initial.homeCity ? (
            <>
              <Link href={initial.homeCity.href} className="font-bold text-primary hover:underline" data-testid="notify-city">
                {initial.homeCity.name}
              </Link>
              : a week, two days, and a day before, and that morning.{" "}
              <Link href={routes.states} className="font-bold text-primary hover:underline">
                Change city
              </Link>
            </>
          ) : (
            <>
              No home city yet, so nothing is sent.{" "}
              <Link href={routes.myCity} className="font-bold text-primary hover:underline" data-testid="notify-city-pick">
                Pick yours
              </Link>
            </>
          ),
        },
      ],
    },
    {
      heading: "Bills",
      rows: [
        {
          pref: "voteResults",
          title: "Votes on bills you follow",
          detail: followed.length > 0 ? `${followed.length === 1 ? "1 bill" : `${followed.length} bills`}, with how your legislators voted.` : "You don't follow any bills. Tap \"Tell me how it turns out\" on one.",
          more:
            followed.length > 0 ? (
              <ul className="divide-y pt-1" data-testid="notify-followed">
                {followed.map((bill) => (
                  <li key={bill.slug} className="flex items-center gap-2 py-1.5" data-testid="notify-followed-bill">
                    <Link href={bill.href} className="min-w-0 flex-1 truncate text-sm hover:underline">
                      <span className="font-extrabold">{bill.label}</span> {bill.title}
                    </Link>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Stop following ${bill.label}`} onClick={() => void unfollow(bill.slug, bill.label)} data-testid="notify-unfollow">
                      <X className="size-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null,
        },
        { pref: "becameLaw", title: "A bill you follow becomes law", detail: "The day it's signed, or passes over a veto." },
        {
          pref: "votedBills",
          title: "Votes on bills you voted on",
          detail: initial.votedCount > 0 ? `You've voted on ${initial.votedCount === 1 ? "1 bill" : `${initial.votedCount} bills`}. Hear how each final vote went.` : "Once you vote on a bill, hear how its final vote went.",
        },
        {
          pref: "floorWeek",
          title: "Bills in your topics this week",
          detail: topics.length > 0 ? `Mondays, for ${heard} of your ${topics.length} topics, when they may come up for a vote.` : "Mondays, when bills in topics you track may come up for a vote.",
          more: topicChips,
        },
        {
          pref: "topicResults",
          title: "Votes on bills in your topics",
          detail: "When one that was up for a vote is decided. Uses the same topics.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-4" data-testid="push-settings">
      <div className="flex flex-wrap items-center gap-3">
        {status === "on" ? <Bell className="size-6 shrink-0 text-primary" aria-hidden /> : <BellOff className="size-6 shrink-0 text-muted-foreground" aria-hidden />}
        <p className="min-w-0 flex-1 text-sm" data-testid="push-status" data-status={status}>
          {pushStatusText(status)}
        </p>
        {status === "off" ? (
          <Button onClick={turnOn} disabled={busy} data-testid="push-enable">
            <Bell className="size-4" aria-hidden />
            {busy ? "Turning on…" : "Turn on"}
          </Button>
        ) : status === "on" ? (
          <>
            <Button variant="secondary" size="sm" onClick={sendTest} disabled={testing} data-testid="push-test">
              <Send className="size-4" aria-hidden />
              {testing ? "Sending…" : "Test"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void turnOff()} disabled={busy} data-testid="push-disable">
              {busy ? "Turning off…" : "Turn off"}
            </Button>
          </>
        ) : null}
      </div>
      {status === "install" ? (
        <p className="flex items-start gap-2 rounded-xl bg-muted p-3 text-sm" data-testid="push-install-steps">
          <Share className="mt-0.5 size-4 shrink-0" aria-hidden />
          Tap Share in Safari, then Add to Home Screen. Open Coolbills from your Home Screen, and turn notifications on here.
        </p>
      ) : null}

      {groups.map((group) => (
        <section key={group.heading} className="space-y-1" data-testid={`notify-group-${group.heading === "Bills" ? "bills" : "city"}`}>
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{group.heading}</h3>
          <ul className="divide-y-2">
            {group.rows.map(({ pref, title, detail, more }) => (
              <li key={pref} className="py-3 first:pt-1 last:pb-0" data-testid={`notify-row-${pref}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-0.5">
                    <Label htmlFor={`notify-${pref}`} className="block cursor-pointer font-extrabold">
                      {title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{detail}</p>
                  </div>
                  <Switch id={`notify-${pref}`} checked={prefs[pref]} onCheckedChange={(on) => void change(pref, on)} className="mt-1" data-testid={`notify-${pref}`} />
                </div>
                {more && prefs[pref] ? (
                  <Disclosure title={pref === "floorWeek" ? "Choose topics" : "See them"} className="mt-1" data-testid={`notify-more-${pref}`}>
                    {more}
                  </Disclosure>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="space-y-1 border-t-2 pt-2">
        <Disclosure title={`Devices that get them (${devices.length})`} data-testid="notify-devices">
          {devices.length > 0 ? (
            <ul className="divide-y">
              {devices.map((device) => (
                <li key={device.id} className="flex items-center gap-2 py-2" data-testid="notify-device">
                  <Laptop className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-bold">{device.label}</span>
                    {device.endpoint === thisEndpoint ? <span className="ml-1.5 rounded-full bg-primary-tint px-2 py-0.5 text-xs font-extrabold">This device</span> : null}
                    <span className="block text-muted-foreground">
                      <RelativeDate date={device.addedAt} label="Added" />
                    </span>
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeDevice(device)} data-testid="notify-device-remove">
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pb-2 text-sm text-muted-foreground">None yet. Turn them on above, on each phone or computer you want them on.</p>
          )}
        </Disclosure>
        <Disclosure title="Recently sent" data-testid="notify-recent">
          {initial.recent.length > 0 ? (
            <ul className="divide-y">
              {initial.recent.map((row) => (
                <li key={row.id} className="py-2 text-sm" data-testid="notify-recent-item">
                  <Link href={row.url} className="font-bold hover:underline">
                    {row.title}
                  </Link>
                  <span className="block text-muted-foreground">
                    <RelativeDate date={row.sentAt} label="Sent" />
                    {row.reached === 0 ? " · didn't reach a device" : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pb-2 text-sm text-muted-foreground">Nothing has been sent to you yet.</p>
          )}
        </Disclosure>
      </div>
    </div>
  );
}
