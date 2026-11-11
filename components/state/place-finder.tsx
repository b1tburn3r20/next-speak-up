"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Landmark, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { matchPlaces } from "@/lib/civic/place-search";
import { cn } from "@/lib/utils";

/** What we have about a place, shown as small icons so the list itself says how deep each one goes. */
export type PlaceFlags = { mayor?: boolean; hall?: boolean; meetings?: boolean };
export type PlaceItem = { key: string; name: string; href: string | null; detail?: string; flags?: PlaceFlags };
type FlagName = keyof PlaceFlags;

const FLAGS: { name: FlagName; label: string; icon: typeof UserRound }[] = [
  { name: "mayor", label: "Mayor", icon: UserRound },
  { name: "hall", label: "City Hall", icon: Landmark },
  { name: "meetings", label: "Meetings", icon: CalendarDays },
];

/**
 * A list you narrow by typing. Everything comes with the page, so each letter answers at once, with no
 * request. Places without a page yet are listed but muted.
 */
export function PlaceFinder({
  places,
  label,
  placeholder,
  filters = false,
  pageSize = 30,
  testId = "place-finder",
  inputTestId = "place-search",
  itemTestId = "place-item",
}: {
  places: PlaceItem[];
  label: string;
  placeholder: string;
  /** Offer chips to keep only places with a mayor, City Hall, or meetings. */
  filters?: boolean;
  pageSize?: number;
  testId?: string;
  inputTestId?: string;
  itemTestId?: string;
}) {
  const [query, setQuery] = useState("");
  const [only, setOnly] = useState<FlagName[]>([]);
  const [shown, setShown] = useState(pageSize);

  const found = useMemo(() => {
    const kept = only.length > 0 ? places.filter((place) => only.every((flag) => place.flags?.[flag])) : places;
    return matchPlaces(kept, query);
  }, [places, query, only]);

  const toggle = (flag: FlagName) => {
    setOnly((current) => (current.includes(flag) ? current.filter((name) => name !== flag) : [...current, flag]));
    setShown(pageSize);
  };

  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShown(pageSize);
          }}
          placeholder={placeholder}
          aria-label={label}
          className="pl-10"
          autoComplete="off"
          data-testid={inputTestId}
        />
      </div>
      {filters ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Only show places with">
          {FLAGS.map(({ name, label: flagLabel, icon: Icon }) => (
            <Button
              key={name}
              type="button"
              size="xs"
              variant="choice"
              aria-pressed={only.includes(name)}
              onClick={() => toggle(name)}
              className="h-9 rounded-full px-3 text-sm"
              data-testid={`place-filter-${name}`}
            >
              <Icon className="size-4" aria-hidden />
              {flagLabel}
            </Button>
          ))}
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground" aria-live="polite" data-testid={`${testId}-count`}>
        {found.length === places.length ? `${places.length.toLocaleString()} in all` : `${found.length.toLocaleString()} found`}
      </p>
      {found.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {found.slice(0, shown).map((place) => (
            <li key={place.key}>
              <PlaceRow place={place} testId={itemTestId} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border-2 border-dashed bg-card p-6 text-center" data-testid={`${testId}-empty`}>
          <p className="font-extrabold">Nothing by that name</p>
          <p className="text-sm text-muted-foreground">Try the first few letters{only.length > 0 ? ", or turn off a filter" : ""}.</p>
        </div>
      )}
      {found.length > shown ? (
        <Button type="button" variant="secondary" className="w-full" onClick={() => setShown((count) => count + pageSize * 2)} data-testid={`${testId}-more`}>
          Show more ({(found.length - shown).toLocaleString()} left)
        </Button>
      ) : null}
    </div>
  );
}

function PlaceRow({ place, testId }: { place: PlaceItem; testId: string }) {
  const flags = place.flags ? FLAGS.filter(({ name }) => place.flags?.[name]) : [];
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block break-words font-extrabold leading-snug">{place.name}</span>
        {place.detail ? <span className="block text-sm text-muted-foreground">{place.detail}</span> : null}
      </span>
      {flags.length > 0 ? (
        <span className="flex shrink-0 gap-1 text-primary" aria-label={`Has ${flags.map((flag) => flag.label).join(", ")}`}>
          {flags.map(({ name, icon: Icon }) => (
            <Icon key={name} className="size-4" aria-hidden />
          ))}
        </span>
      ) : null}
      {place.href ? <ArrowRight className="size-4 shrink-0" aria-hidden /> : null}
    </>
  );
  const shape = "flex min-h-14 items-center gap-3 rounded-2xl border-2 border-b-4 bg-card px-4 py-3";
  return place.href ? (
    <Link href={place.href} className={cn(shape, "hover:bg-muted")} data-testid={testId}>
      {body}
    </Link>
  ) : (
    <div className={cn(shape, "border-dashed opacity-60")} data-testid={testId} aria-disabled>
      {body}
    </div>
  );
}
