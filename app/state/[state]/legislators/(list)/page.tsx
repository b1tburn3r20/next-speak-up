import type { Metadata } from "next";
import { EmptyState } from "@/components/app/page-states";
import { Grid, PageHeader, PageSpacer } from "@/components/blocks";
import { MemberCard } from "@/components/people/member-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { listCurrentMembers } from "@/lib/civic/people";
import { getVacantSeats } from "@/lib/civic/state";
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
  const [members, vacant] = await Promise.all([
    listCurrentMembers({ jurisdiction: state.jurisdiction, chamber, party: params.party || undefined, q: params.q, district: params.district?.trim() || undefined }),
    getVacantSeats(state),
  ]);

  return (
    <PageSpacer>
      <PageHeader
        title={`${state.name} legislators`}
        description="Who's sitting now. Anyone just elected appears once they take their seat."
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
      {members.length > 0 ? (
        <Grid cols="people" data-testid="state-members">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </Grid>
      ) : (
        <EmptyState title="Nobody matches that">Try fewer filters, or a different name.</EmptyState>
      )}
    </PageSpacer>
  );
}
