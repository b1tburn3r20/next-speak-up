import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OuterBlock } from "@/components/blocks";
import { VerdictBadge } from "@/components/civic/rep-report-card";
import { MemberPhoto } from "@/components/people/member-photo";
import type { VerdictTone } from "@/lib/civic/verdict";

export type MyPerson = {
  key: string;
  name: string;
  imageUrl: string | null;
  party: string | null;
  /** Where they sit, in plain words: "U.S. Senate, Iowa". */
  seat: string;
  href: string;
  /** Whether they vote like you. Left out for people who don't vote on bills you can vote on, like a mayor. */
  verdict?: { tone: VerdictTone; label: string; hint?: string };
};

export type MyPeopleGroup = { label: string; people: MyPerson[] };

/**
 * Everyone who represents someone, from Congress down to City Hall, one tap from each person's page.
 * Faces first, then whether they vote like you, so the core question is answered at a glance.
 */
export function MyPeople({ groups }: { groups: MyPeopleGroup[] }) {
  const shown = groups.filter((group) => group.people.length > 0);
  if (shown.length === 0) return null;
  return (
    <OuterBlock className="divide-y-2 p-0 sm:p-0" data-testid="my-people">
      {shown.map((group) => (
        <div key={group.label} className="px-4 py-3 sm:px-5" data-testid="my-people-group">
          <p className="pb-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{group.label}</p>
          <ul>
            {group.people.map((person) => (
              <li key={person.key}>
                <Link href={person.href} className="-mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted" data-testid="my-person">
                  <MemberPhoto name={person.name} url={person.imageUrl} party={person.party} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-extrabold leading-snug">{person.name}</span>
                    <span className="block text-sm text-muted-foreground">{person.seat}</span>
                    {person.verdict?.tone === "unknown" ? (
                      // Until there's a verdict, say how close it is, quietly, rather than a badge on every row.
                      <span className="mt-0.5 block text-xs font-bold text-primary" data-testid="verdict-pending">
                        {person.verdict.hint}
                      </span>
                    ) : person.verdict ? (
                      <span className="mt-1 flex flex-wrap items-center gap-x-2">
                        <VerdictBadge tone={person.verdict.tone} label={person.verdict.label} />
                        {person.verdict.hint ? <span className="text-xs text-muted-foreground">{person.verdict.hint}</span> : null}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </OuterBlock>
  );
}
