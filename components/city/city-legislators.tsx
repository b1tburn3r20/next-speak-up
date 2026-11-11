import Link from "next/link";
import { Landmark, UserRoundX } from "lucide-react";
import { Grid, OuterBlock, Section } from "@/components/blocks";
import { MemberPhoto } from "@/components/people/member-photo";
import type { CityLegislator } from "@/lib/civic/city";
import { memberKeyOf } from "@/lib/civic/people";
import { chamberName, type StateConfig } from "@/lib/civic/states";
import { memberPath } from "@/lib/routes";

function shareText(share: number, districts: number): string {
  if (districts === 1) return "All of the city";
  if (share >= 0.5) return "Most of the city";
  if (share >= 0.1) return `About ${Math.round(share * 100)}% of the city`;
  return "A small part of the city";
}

/** The state legislators whose districts cover a city, House first. Big cities list several. */
export function CityLegislators({ state, cityName, legislators }: { state: StateConfig; cityName: string; legislators: CityLegislator[] }) {
  if (legislators.length === 0) return null;
  const chambers = (["LOWER", "UPPER"] as const).map((chamber) => ({ chamber, seats: legislators.filter((seat) => seat.chamber === chamber) }));
  return (
    <Section
      title={`${cityName}'s state legislators`}
      description={
        legislators.length > 2
          ? `${cityName} is split across several districts. Yours depends on your address.`
          : `Everyone in ${cityName} shares these two.`
      }
      data-testid="city-legislators"
    >
      <Grid cols="halves">
        {chambers.map(({ chamber, seats }) =>
          seats.length === 0 ? null : (
            <OuterBlock key={chamber} className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                <Landmark className="size-4" aria-hidden />
                {chamberName(state, chamber)}
              </p>
              <ul className="divide-y-2">
                {seats.map((seat) => {
                  const key = seat.member ? memberKeyOf(seat.member) : null;
                  return (
                    <li key={seat.code} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0" data-testid="city-legislator">
                      {seat.member ? <MemberPhoto name={seat.member.fullName} url={seat.member.imageUrl} party={seat.member.terms[0]?.party ?? null} size={40} /> : null}
                      <span className="min-w-0 flex-1">
                        {seat.member && key ? (
                          <Link href={memberPath(key)} className="font-extrabold text-primary hover:underline">
                            {seat.member.fullName}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-extrabold text-muted-foreground">
                            <UserRoundX className="size-4" aria-hidden />
                            Empty seat
                          </span>
                        )}
                        <span className="block text-sm text-muted-foreground">District {seat.code}</span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-muted-foreground">{shareText(seat.share, seats.length)}</span>
                    </li>
                  );
                })}
              </ul>
            </OuterBlock>
          ),
        )}
      </Grid>
    </Section>
  );
}
