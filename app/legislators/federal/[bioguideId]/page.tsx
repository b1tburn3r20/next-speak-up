import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AsOfNote, EmptyState, PageContainer, Panel } from "@/components/app/page-states";
import { BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import { MemberPhoto, stateName } from "@/components/people/member-card";
import { FavoriteButton } from "@/components/people/favorite-button";
import { computeAlignment } from "@/lib/civic/alignment";
import { billLabel, partyLabel, positionLabel, roleLabel, seatLabel } from "@/lib/civic/labels";
import {
  getMemberByBioguide,
  getMemberKeyVotes,
  getMemberLegislativeRecord,
  getMemberSponsoredBills,
  getMemberVotePage,
  getMemberVotingStats,
  isMemberFavorite,
} from "@/lib/civic/people";
import { comparedVotesFor } from "@/lib/civic/users";

type PageProps = {
  params: Promise<{ bioguideId: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const member = await getMemberByBioguide((await params).bioguideId);
  return { title: member?.fullName ?? "Member not found" };
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm">{label}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default async function MemberPage({ params, searchParams }: PageProps) {
  const { bioguideId } = await params;
  const pageNumber = Number((await searchParams)?.page) || 1;
  const member = await getMemberByBioguide(bioguideId);
  if (!member) notFound();

  const current = member.terms.find((term) => term.isCurrent) ?? member.terms[0];
  const session = await getServerSession(authOptions);
  const [stats, votePage, sponsored, compared, record, keyVotes, favorite] = await Promise.all([
    getMemberVotingStats(member.id, current?.party ?? null),
    getMemberVotePage(member.id, pageNumber),
    getMemberSponsoredBills(member.id),
    session?.user?.id ? comparedVotesFor(session.user.id, member.id) : [],
    getMemberLegislativeRecord(member.id),
    getMemberKeyVotes(member.id),
    session?.user?.id ? isMemberFavorite(session.user.id, member.id) : false,
  ]);
  const recentVotes = votePage.votes;
  const alignment = computeAlignment(compared);
  const hasLaggingVotes = recentVotes.some((vote) => vote.rollCall.source === "VOTEVIEW");

  return (
    <PageContainer>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <MemberPhoto name={member.fullName} url={member.imageUrl} size={96} />
        <div className="min-w-0 space-y-1">
          <h1 className="break-words text-2xl font-semibold">{member.fullName}</h1>
          {current ? (
            <p className="text-muted-foreground">
              {roleLabel(current.role)},{" "}
              {seatLabel(stateName(current.regionCode), current.district?.code, current.chamber.kind)}{" "}
              · {partyLabel(current.party)}
              {current.isCurrent ? "" : " (former)"}
            </p>
          ) : null}
          <FavoriteButton
            bioguideId={bioguideId}
            signedIn={Boolean(session?.user?.id)}
            initialFavorite={favorite}
          />
          <div className="flex flex-wrap gap-x-3 text-sm">
            {member.websiteUrl ? (
              <a href={member.websiteUrl} className="underline" target="_blank" rel="noreferrer">
                Official website
              </a>
            ) : null}
            {member.phone ? <a href={`tel:${member.phone}`} className="underline">{member.phone}</a> : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="member-stats">
        <Stat
          label="Attendance"
          value={stats.attendancePercent === null ? "No data" : `${stats.attendancePercent}%`}
          hint={`${stats.missedVotes} of ${stats.totalVotes} votes missed`}
        />
        <Stat
          label="Votes with party"
          value={stats.partyLoyaltyPercent === null ? "No data" : `${stats.partyLoyaltyPercent}%`}
        />
        <Stat label="Bills sponsored" value={String(sponsored.sponsored)} hint="In loaded data" />
        <Stat
          label="Agrees with you"
          value={alignment.percent === null ? "Not yet" : `${alignment.percent}%`}
          hint={
            session?.user?.id
              ? `${alignment.compared} bill${alignment.compared === 1 ? "" : "s"} in common`
              : "Sign in and vote on bills"
          }
        />
      </div>

      {keyVotes.length > 0 ? (
        <Panel aria-labelledby="key-votes-heading">
          <h2 id="key-votes-heading" className="mb-2 font-semibold">
            Votes on passing bills
          </h2>
          <ul className="divide-y text-sm" data-testid="member-key-votes">
            {keyVotes.map(({ position, rollCall }) => (
              <li key={rollCall.id} className="flex items-start justify-between gap-3 py-2">
                <p className="min-w-0 break-words">
                  {rollCall.bill ? (
                    <Link href={`/bills/${rollCall.bill.slug}`} className="underline">
                      {billLabel(rollCall.bill.billType, rollCall.bill.number)}
                    </Link>
                  ) : null}{" "}
                  <span className="text-muted-foreground">{rollCall.bill?.title}</span>
                </p>
                <span className="shrink-0 font-medium">{positionLabel(position)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel aria-labelledby="votes-heading">
        <h2 id="votes-heading" className="mb-2 font-semibold">
          Recent votes
        </h2>
        {recentVotes.length > 0 ? (
          <ul className="divide-y text-sm" data-testid="member-votes">
            {recentVotes.map(({ position, rollCall }) => (
              <li key={rollCall.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="break-words">
                    {rollCall.bill ? (
                      <Link href={`/bills/${rollCall.bill.slug}`} className="underline">
                        {billLabel(rollCall.bill.billType, rollCall.bill.number)}
                      </Link>
                    ) : (
                      rollCall.legislationRef
                    )}{" "}
                    {rollCall.question}
                  </p>
                  <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                    {formatDate(rollCall.occurredAt)}
                    {rollCall.bill?.title ?? rollCall.description
                      ? `: ${rollCall.bill?.title ?? rollCall.description}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 font-medium">{positionLabel(position)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No recorded votes loaded for this member" />
        )}
        {votePage.page > 1 || votePage.hasNext ? (
          <nav className="mt-2 flex justify-between text-sm" aria-label="Vote pages" data-testid="vote-pages">
            {votePage.page > 1 ? (
              <Link href={`?page=${votePage.page - 1}`} className="underline">
                Newer votes
              </Link>
            ) : (
              <span />
            )}
            {votePage.hasNext ? (
              <Link href={`?page=${votePage.page + 1}`} className="underline">
                Older votes
              </Link>
            ) : null}
          </nav>
        ) : null}
        {hasLaggingVotes ? (
          <div className="mt-2">
            <AsOfNote
              date={recentVotes.find((vote) => vote.rollCall.source === "VOTEVIEW")?.rollCall.asOf ?? null}
              label="Senate data from Voteview, which can lag. Fetched"
            />
          </div>
        ) : null}
      </Panel>

      <Panel aria-labelledby="sponsored-heading">
        <h2 id="sponsored-heading" className="mb-2 font-semibold">
          Sponsored bills
        </h2>
        {record.sponsored > 0 ? (
          <div className="mb-3 space-y-2" data-testid="member-record">
            <p className="text-sm">
              Of {record.sponsored} sponsored in the loaded data, {record.advanced} moved past
              committee and {record.becameLaw} became law
              {record.lawPercent !== null ? ` (${record.lawPercent}%)` : ""}.
            </p>
            {record.byPolicyArea.length > 0 ? (
              <ul className="grid gap-1 sm:grid-cols-2">
                {record.byPolicyArea.map((area) => (
                  <li key={area.policyArea} className="text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">{area.policyArea}</span>
                      <span className="shrink-0">{area.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-chart-1" style={{ width: `${area.percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {sponsored.items.length > 0 ? (
          <ul className="divide-y text-sm">
            {sponsored.items.map((bill) => (
              <li key={bill.slug} className="py-2">
                <Link href={`/bills/${bill.slug}`} className="underline">
                  {billLabel(bill.billType, bill.number)}
                </Link>{" "}
                <BillStatusBadge status={bill.currentStatus} />
                <p className="line-clamp-2 break-words text-muted-foreground">{bill.title}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No sponsored bills in the loaded data" />
        )}
      </Panel>
    </PageContainer>
  );
}
