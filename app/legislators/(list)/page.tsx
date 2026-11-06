import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState, PageContainer } from "@/components/app/page-states";
import { Grid, PageHeader } from "@/components/blocks";
import { MemberCard, stateName } from "@/components/people/member-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  countCurrentMembers,
  listCurrentMembers,
  repsForLocation,
  type MemberFilters,
} from "@/lib/civic/people";
import { getUserLocation } from "@/lib/civic/users";
import { STATE_NAMES } from "@/lib/constants/state-names";

export const metadata: Metadata = {
  title: "Federal Legislators",
  description: "Every current member of Congress, with how they vote.",
};

type SearchParams = { q?: string; chamber?: string; state?: string; party?: string; page?: string };

const MEMBERS_PER_PAGE = 48;

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
  const filters = { q: params.q, chamber, state: params.state, party: params.party } as MemberFilters;
  const page = Math.max(1, Number(params.page) || 1);
  const [members, total, yourReps] = await Promise.all([
    listCurrentMembers(filters, { take: MEMBERS_PER_PAGE, skip: (page - 1) * MEMBERS_PER_PAGE }),
    countCurrentMembers(filters),
    location ? repsForLocation(location.regionCode, location.districtCode) : [],
  ]);
  const filtering = Boolean(params.q || chamber || params.state || params.party);
  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (chamber) query.set("chamber", chamber);
    if (params.state) query.set("state", params.state);
    if (params.party) query.set("party", params.party);
    query.set("page", String(target));
    return `/legislators?${query}`;
  };
  const states = Object.keys(STATE_NAMES).sort((a, b) =>
    stateName(a).localeCompare(stateName(b)),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Federal Legislators"
        description={`${total} ${filtering ? "matching" : "current"} members of Congress`}
      />

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

      <form className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <Input className="col-span-2 sm:col-span-1" name="q" defaultValue={params.q} placeholder="Search by name" aria-label="Search by name" />
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
        <Button className="col-span-2 sm:col-span-1" type="submit">Search</Button>
      </form>

      {members.length === 0 ? (
        filtering ? (
          <EmptyState title="No members match that" action={{ href: "/legislators", label: "Clear filters" }} />
        ) : (
          <EmptyState title="No members yet">Members appear once the data pipeline has run.</EmptyState>
        )
      ) : (
        <Grid cols="people">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </Grid>
      )}
      {page > 1 || page * MEMBERS_PER_PAGE < total ? (
        <nav className="flex justify-between gap-3 font-extrabold" aria-label="Member pages" data-testid="member-pages">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-primary hover:underline">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm font-bold text-muted-foreground">
            Page {page} of {Math.ceil(total / MEMBERS_PER_PAGE)}
          </span>
          {page * MEMBERS_PER_PAGE < total ? (
            <Link href={pageHref(page + 1)} className="text-primary hover:underline" data-testid="next-members">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </PageContainer>
  );
}
