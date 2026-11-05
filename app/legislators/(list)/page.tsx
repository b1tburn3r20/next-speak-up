import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState, PageContainer } from "@/components/app/page-states";
import { MemberCard, stateName } from "@/components/people/member-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listCurrentMembers, repsForLocation } from "@/lib/civic/people";
import { getUserLocation } from "@/lib/civic/users";
import { STATE_NAMES } from "@/lib/constants/state-names";

export const metadata: Metadata = {
  title: "Federal Legislators",
  description: "Every current member of Congress, with how they vote.",
};

type SearchParams = { q?: string; chamber?: string; state?: string; party?: string };

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm";

export default async function LegislatorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const chamber =
    params.chamber === "UPPER" || params.chamber === "LOWER" ? params.chamber : undefined;
  const session = await getServerSession(authOptions);
  const location = session?.user?.id ? await getUserLocation(session.user.id) : null;
  const [members, yourReps] = await Promise.all([
    listCurrentMembers({ q: params.q, chamber, state: params.state, party: params.party }),
    location ? repsForLocation(location.regionCode, location.districtCode) : [],
  ]);
  const filtering = Boolean(params.q || chamber || params.state || params.party);
  const states = Object.keys(STATE_NAMES).sort((a, b) =>
    stateName(a).localeCompare(stateName(b)),
  );

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-semibold">Federal Legislators</h1>
        <p className="text-sm text-muted-foreground">
          {members.length} {filtering ? "matching" : "current"} members of Congress
        </p>
      </div>

      {yourReps.length > 0 && !filtering ? (
        <section aria-labelledby="your-reps" className="space-y-2">
          <h2 id="your-reps" className="font-semibold">
            Your representatives
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="your-reps">
            {yourReps.map((rep) => (
              <MemberCard key={rep.id} member={rep} />
            ))}
          </div>
        </section>
      ) : null}

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <Input name="q" defaultValue={params.q} placeholder="Search by name" aria-label="Search by name" />
        <select name="chamber" defaultValue={chamber ?? ""} aria-label="Chamber" className={SELECT_CLASS}>
          <option value="">Both chambers</option>
          <option value="UPPER">Senate</option>
          <option value="LOWER">House</option>
        </select>
        <select name="state" defaultValue={params.state ?? ""} aria-label="State" className={SELECT_CLASS}>
          <option value="">All states</option>
          {states.map((code) => (
            <option key={code} value={code}>
              {stateName(code)}
            </option>
          ))}
        </select>
        <select name="party" defaultValue={params.party ?? ""} aria-label="Party" className={SELECT_CLASS}>
          <option value="">All parties</option>
          <option value="D">Democrat</option>
          <option value="R">Republican</option>
          <option value="I">Independent</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      {members.length === 0 ? (
        filtering ? (
          <EmptyState title="No members match that" action={{ href: "/legislators", label: "Clear filters" }} />
        ) : (
          <EmptyState title="No members yet">Members appear once the data pipeline has run.</EmptyState>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
