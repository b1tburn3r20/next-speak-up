import Link from "next/link";
import { ArrowRight, CalendarDays, Mic } from "lucide-react";
import { OuterBlock, Section } from "@/components/blocks";
import { MemberPhoto } from "@/components/people/member-photo";
import { getCityOfficials, getNextRegularMeeting, getUserWard } from "@/lib/civic/city";
import { seatName, speakWindow } from "@/lib/civic/city-logic";
import type { CityConfig, StateConfig } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";

/** City Hall in a few lines, for the dashboard and the state's page: who's yours, and when they meet. */
export async function CityGlance({ state, city, userId }: { state: StateConfig; city: CityConfig; userId: string | null }) {
  const now = new Date();
  const [officials, next, ward] = await Promise.all([
    getCityOfficials(city),
    getNextRegularMeeting(city, now),
    userId ? getUserWard(userId, city) : Promise.resolve(null),
  ]);
  const people = officials.filter((official) => {
    const term = official.terms[0];
    return term?.role === "MAYOR" || (ward !== null && term?.district?.code === ward);
  });
  const window = next ? speakWindow(next.startsAt, city, state.timeZone, now) : null;
  const href = stateRoutes(state.key).city(city.key);
  return (
    <Section title={`City Hall: ${city.name}`} action={{ href, label: "All of City Hall" }} data-testid="city-glance">
      <OuterBlock className="space-y-3">
        <ul className="grid gap-3 sm:grid-cols-2">
          {people.map((official) => (
            <li key={official.id} className="flex min-w-0 items-center gap-3">
              <MemberPhoto name={official.fullName} url={official.imageUrl} party={null} size={44} />
              <span className="min-w-0">
                <span className="block break-words font-extrabold leading-snug">{official.fullName}</span>
                <span className="block text-sm text-muted-foreground">
                  {official.terms[0]?.role === "MAYOR" ? "Your mayor" : `Your council member, ${seatName("COUNCIL_MEMBER", ward)}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {ward === null ? (
          <p className="text-sm text-muted-foreground">
            <Link href={href} className="font-bold text-primary hover:underline">
              Choose your ward
            </Link>{" "}
            to see your own council member.
          </p>
        ) : null}
        {next ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="font-bold">
              {city.council.name} meets{" "}
              {next.startsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: state.timeZone })}
            </span>
            {window?.status === "OPEN" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-support-tint px-2 py-0.5 font-extrabold text-support" data-testid="glance-speak-open">
                <Mic className="size-3.5" aria-hidden />
                You can ask to speak
              </span>
            ) : null}
          </p>
        ) : null}
        <Link href={href} className="tap inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          Topics, the council, and how to speak
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </OuterBlock>
    </Section>
  );
}
