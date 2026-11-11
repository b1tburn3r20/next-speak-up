import type { Metadata } from "next";
import { EmptyState } from "@/components/app/page-states";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SectionTabs } from "@/components/app/section-tabs";
import { PageHeader, PageSpacer, Section } from "@/components/blocks";
import { MemberList } from "@/components/people/member-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { listCurrentMembers } from "@/lib/civic/people";
import { getStateLocation, getStateSeats, getVacantSeats } from "@/lib/civic/state";
import { chamberName, stateByKey } from "@/lib/civic/states";
import { notFound } from "next/navigation";

type StateParams = { params: Promise<{ state: string }> };

async function stateFrom(params: StateParams["params"]) {
  const state = stateByKey((await params).state);
  // The layout already turned away states we don't cover. This keeps the type honest.
  if (!state) notFound();
  return state;
}

export async function generateMetadata({ params }: StateParams): Promise<Metadata> {
  const state = await stateFrom(params);
  return { title: "Legislators", description: `Who's sitting in the ${chamberName(state, "LOWER")} and ${state.chambers.UPPER.name} right now.` };
}

type SearchParams = { q?: string; chamber?: string; party?: string; district?: string };

export default async function StateLegislatorsPage({ params: route, searchParams }: StateParams & { searchParams: Promise<SearchParams> }) {
  const state = await stateFrom(route);
  const params = await searchParams;
  const chamber = params.chamber === "UPPER" || params.chamber === "LOWER" ? params.chamber : undefined;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const filtering = Boolean(params.q || chamber || params.party || params.district?.trim());
  const [members, vacant, location] = await Promise.all([
    listCurrentMembers({ jurisdiction: state.jurisdiction, chamber, party: params.party || undefined, q: params.q, district: params.district?.trim() || undefined }),
    getVacantSeats(state),
    userId ? getStateLocation(userId, state) : Promise.resolve(null),
  ]);
  const seats = await getStateSeats(location);
  const mineIds = new Set(seats.flatMap((seat) => (seat.member ? [seat.member.id] : [])));
  const mine = members.filter((member) => mineIds.has(member.id));

  return (
    <PageSpacer>
      <PageHeader
        title={`${state.name} legislators`}
        description={`Everyone in the ${state.chambers.LOWER.name} and ${state.chambers.UPPER.name} now. Tap anyone to see how they vote. Anyone just elected appears once they take their seat.`}
      />
      <form className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <Input className="col-span-2 lg:col-span-1" name="q" defaultValue={params.q} placeholder="Search by name" aria-label="Search by name" data-testid="state-member-search" />
        <OptionSelect
          name="chamber"
          defaultValue={chamber ?? ""}
          aria-label="Chamber"
          options={[
            { value: "", label: `${state.chambers.LOWER.name} and ${state.chambers.UPPER.name}` },
            { value: "LOWER", label: state.chambers.LOWER.name },
            { value: "UPPER", label: state.chambers.UPPER.name },
          ]}
        />
        <OptionSelect
          name="party"
          defaultValue={params.party ?? ""}
          aria-label="Party"
          options={[{ value: "", label: "Any party" }, { value: "D", label: "Democrat" }, { value: "R", label: "Republican" }, { value: "I", label: "Independent" }]}
        />
        <Input name="district" defaultValue={params.district} inputMode="numeric" placeholder="District" aria-label="District" />
        <Button type="submit">Search</Button>
      </form>
      {vacant.length > 0 ? (
        <p className="rounded-xl bg-streak-tint p-3 text-sm" data-testid="state-vacancies">
          {vacant.length === 1 ? "One seat is" : `${vacant.length} seats are`} empty right now:{" "}
          {vacant.map((seat) => `${seat.chamber.shortName} ${seat.code}`).join(", ")}.
        </p>
      ) : null}
      {members.length === 0 ? (
        <EmptyState title="Nobody matches that">Try fewer filters, or a different name.</EmptyState>
      ) : filtering ? (
        <MemberList members={members} testId="state-members" />
      ) : (
        <div className="space-y-6" data-testid="state-members">
          {mine.length > 0 ? (
            <Section title="Yours" description="The two who vote for you in the capitol.">
              <MemberList members={mine} testId="state-members-yours" />
            </Section>
          ) : null}
          <SectionTabs
            testId="state-chamber-tabs"
            tabTestId="state-chamber-tab"
            tabs={(["LOWER", "UPPER"] as const).map((kind) => {
              const inChamber = members.filter((member) => member.terms[0]?.chamber.kind === kind);
              return { id: kind.toLowerCase(), label: `${state.chambers[kind].name} (${inChamber.length})`, content: <MemberList members={inChamber} /> };
            })}
          />
        </div>
      )}
    </PageSpacer>
  );
}
