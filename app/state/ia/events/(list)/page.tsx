import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app/page-states";
import { PageHeader, PageSpacer, Stack } from "@/components/blocks";
import { EventCard } from "@/components/state/event-card";
import { IowaSessionNote } from "@/components/state/session-note";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { EVENT_KIND_LABELS } from "@/lib/civic/state-logic";
import { IOWA_CODE, listEvents } from "@/lib/civic/state";
import { stateRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Iowa meetings",
  description: "Committee, subcommittee, and City Council meetings you can go to, or look back on.",
};

const PAGE_SIZE = 25;
const KINDS = ["SUBCOMMITTEE", "COMMITTEE", "COUNCIL_MEETING"] as const;
type SearchParams = { when?: string; kind?: string; q?: string; page?: string };

export default async function IowaEventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const when = params.when === "past" ? "past" : "upcoming";
  const kind = KINDS.find((value) => value === params.kind);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim() || undefined;
  const { events, total } = await listEvents([IOWA_CODE, "US-IA-DSM"], { when, kind, q, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE });
  const link = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ when, kind, q, ...changes })) if (value) next.set(key, value);
    return `${stateRoutes.events}?${next}`;
  };

  return (
    <PageSpacer>
      <PageHeader title="Iowa meetings" description="Subcommittee meetings are usually the best place to be heard." />
      <div className="flex gap-2" role="tablist" aria-label="When">
        {(["upcoming", "past"] as const).map((value) => (
          <Link
            key={value}
            role="tab"
            aria-selected={when === value}
            href={link({ when: value, page: undefined })}
            className={cn(buttonVariants({ variant: when === value ? "default" : "outline" }))}
            data-testid={`events-${value}`}
          >
            {value === "upcoming" ? "Coming up" : "Past"}
          </Link>
        ))}
      </div>
      <form className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_auto_auto]" role="search">
        <Input type="hidden" name="when" value={when} />
        <Input className="col-span-2 lg:col-span-1" name="q" defaultValue={q} placeholder="Search by committee or bill, like HF 100" aria-label="Search meetings" data-testid="event-search" />
        <OptionSelect
          name="kind"
          defaultValue={kind ?? ""}
          aria-label="Kind of meeting"
          options={[{ value: "", label: "Any meeting" }, ...KINDS.map((value) => ({ value, label: EVENT_KIND_LABELS[value] }))]}
        />
        <Button type="submit">Search</Button>
      </form>
      {events.length > 0 ? (
        <Stack data-testid="event-list">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {total > page * PAGE_SIZE ? (
            <Link href={link({ page: String(page + 1) })} className={buttonVariants({ variant: "outline" })} data-testid="next-page">
              Next page
            </Link>
          ) : null}
        </Stack>
      ) : when === "upcoming" && !q && !kind ? (
        <Stack>
          <IowaSessionNote />
          <EmptyState title="No meetings are posted right now" action={{ href: link({ when: "past" }), label: "See past meetings" }}>
            Committee meetings get posted once the session starts, usually only days ahead. Des Moines posts its agendas shortly before each council meeting.
          </EmptyState>
        </Stack>
      ) : (
        <EmptyState title="No meetings match that">Try fewer filters, or a different word.</EmptyState>
      )}
    </PageSpacer>
  );
}
