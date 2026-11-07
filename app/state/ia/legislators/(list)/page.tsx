import type { Metadata } from "next";
import { EmptyState } from "@/components/app/page-states";
import { Grid, PageHeader, PageSpacer } from "@/components/blocks";
import { MemberCard } from "@/components/people/member-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { listCurrentMembers } from "@/lib/civic/people";
import { getVacantSeats, IOWA_CODE } from "@/lib/civic/state";

export const metadata: Metadata = {
  title: "Iowa legislators",
  description: "Who's sitting in the Iowa House and Senate right now.",
};

type SearchParams = { q?: string; chamber?: string; party?: string; district?: string };

export default async function IowaLegislatorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const chamber = params.chamber === "UPPER" || params.chamber === "LOWER" ? params.chamber : undefined;
  const [members, vacant] = await Promise.all([
    listCurrentMembers({ jurisdiction: IOWA_CODE, chamber, party: params.party || undefined, q: params.q, district: params.district?.trim() || undefined }),
    getVacantSeats(),
  ]);

  return (
    <PageSpacer>
      <PageHeader
        title="Iowa legislators"
        description="Who's sitting now. People elected on November 3 take office in January, so they aren't listed yet."
      />
      <form className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <Input className="col-span-2 lg:col-span-1" name="q" defaultValue={params.q} placeholder="Search by name" aria-label="Search by name" data-testid="iowa-member-search" />
        <OptionSelect
          name="chamber"
          defaultValue={chamber ?? ""}
          aria-label="Chamber"
          options={[{ value: "", label: "House and Senate" }, { value: "LOWER", label: "House" }, { value: "UPPER", label: "Senate" }]}
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
        <p className="rounded-xl bg-streak-tint p-3 text-sm" data-testid="iowa-vacancies">
          {vacant.length === 1 ? "One seat is" : `${vacant.length} seats are`} empty right now:{" "}
          {vacant.map((seat) => `${seat.chamber.shortName} ${seat.code}`).join(", ")}.
        </p>
      ) : null}
      {members.length > 0 ? (
        <Grid cols="people" data-testid="iowa-members">
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
