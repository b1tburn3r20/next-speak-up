import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import sanitizeHtml from "sanitize-html";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import { RollCallCard } from "@/components/bills/roll-call-card";
import { EmptyState, PageContainer, Panel } from "@/components/app/page-states";
import { getBill, getPartyBreakdowns, getPositionsFor } from "@/lib/civic/bills";
import {
  BILL_STAGES,
  billLabel,
  billStageIndex,
  partyLabel,
  type BillStatusValue,
} from "@/lib/civic/labels";
import { bioguideOf, repsForLocation } from "@/lib/civic/people";
import { getUserBillState, getUserLocation, recordBillView } from "@/lib/civic/users";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const bill = await getBill((await params).id);
  if (!bill) return { title: "Bill not found" };
  return {
    title: billLabel(bill.billType, bill.number),
    description: bill.title.slice(0, 160),
  };
}

function BillProgress({ status }: { status: BillStatusValue }) {
  const reached = billStageIndex(status);
  return (
    <ol className="grid grid-cols-3 gap-1 sm:grid-cols-6" aria-label="Bill progress">
      {BILL_STAGES.map((stage, index) => (
        <li
          key={stage}
          aria-current={index === reached ? "step" : undefined}
          className={`rounded px-2 py-1 text-center text-xs ${
            index <= reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {stage}
        </li>
      ))}
    </ol>
  );
}

export default async function BillPage({ params }: PageProps) {
  const bill = await getBill((await params).id);
  if (!bill) notFound();

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const [state, location] = userId
    ? await Promise.all([getUserBillState(userId, bill.id), getUserLocation(userId)])
    : [null, null];
  if (userId) {
    // Viewing history is nice to have, so it never holds up or breaks the page.
    recordBillView(userId, bill.id).catch(() => undefined);
  }

  const rollCallIds = bill.rollCalls.map((rollCall) => rollCall.id);
  const reps = location ? await repsForLocation(location.regionCode, location.districtCode) : [];
  const [breakdowns, repPositions] = await Promise.all([
    getPartyBreakdowns(rollCallIds),
    getPositionsFor(
      rollCallIds,
      reps.map((rep) => rep.id),
    ),
  ]);
  const repNames = new Map(reps.map((rep) => [rep.id, rep.fullName]));

  const sponsors = bill.sponsorships.filter((item) => item.kind === "SPONSOR");
  const cosponsors = bill.sponsorships.filter((item) => item.kind === "COSPONSOR");
  const summary = bill.summaries[0];

  return (
    <PageContainer>
      <header className="space-y-3">
        <nav className="text-sm">
          <Link href="/bills" className="underline">
            Bills
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{billLabel(bill.billType, bill.number)}</span>
          <BillStatusBadge status={bill.currentStatus} />
          {bill.lawNumber ? (
            <span className="text-sm text-muted-foreground">Public Law {bill.lawNumber}</span>
          ) : null}
        </div>
        <h1 className="break-words text-xl font-semibold sm:text-2xl">{bill.title}</h1>
        <BillProgress status={bill.currentStatus as BillStatusValue} />
        <p className="text-sm text-muted-foreground">
          Latest action, {formatDate(bill.latestActionDate)}: {bill.latestActionText ?? "None yet"}
        </p>
        <BillActionButtons
          slug={bill.slug}
          signedIn={Boolean(userId)}
          initialPosition={state?.position ?? null}
          initialFollowing={state?.following ?? false}
        />
      </header>

      <Panel aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-2 font-semibold">
          Summary
        </h2>
        {summary ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              Congressional Research Service
              {summary.actionDesc ? `, ${summary.actionDesc}` : ""}
              {summary.actionDate ? `, ${formatDate(summary.actionDate)}` : ""}
              {bill.summaries.length > 1 ? ` · ${bill.summaries.length} versions` : ""}
            </p>
            <div
              data-testid="bill-summary"
              className="prose prose-sm max-w-none break-words dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(summary.text, {
                  allowedTags: ["p", "strong", "em", "b", "i", "ul", "ol", "li", "br"],
                  allowedAttributes: {},
                }),
              }}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="no-summary">
            The Congressional Research Service hasn&apos;t published a summary for this bill yet.
            These often take a while for new bills.
          </p>
        )}
      </Panel>

      <Panel aria-labelledby="votes-heading">
        <h2 id="votes-heading" className="mb-3 font-semibold">
          Recorded votes
        </h2>
        {bill.rollCalls.length > 0 ? (
          <div className="space-y-3">
            {bill.rollCalls.map((rollCall) => (
              <RollCallCard
                key={rollCall.id}
                question={rollCall.question}
                result={rollCall.result}
                occurredAt={rollCall.occurredAt}
                chamber={rollCall.chamber.shortName}
                number={rollCall.number}
                subSession={rollCall.subSession}
                source={rollCall.source}
                asOf={rollCall.asOf}
                totals={{
                  yea: rollCall.totalYea,
                  nay: rollCall.totalNay,
                  present: rollCall.totalPresent,
                  notVoting: rollCall.totalNotVoting,
                }}
                parties={breakdowns.get(rollCall.id) ?? []}
                yourReps={repPositions
                  .filter((position) => position.rollCallId === rollCall.id)
                  .map((position) => ({
                    name: repNames.get(position.personId) ?? "Your rep",
                    position: position.position,
                  }))}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No recorded votes yet">
            Many bills never get a recorded floor vote. Votes appear here if they happen.
          </EmptyState>
        )}
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel aria-labelledby="sponsors-heading">
          <h2 id="sponsors-heading" className="mb-2 font-semibold">
            Sponsors
          </h2>
          <ul className="space-y-1 text-sm">
            {sponsors.map(({ person }) => {
              const bioguide = bioguideOf(person);
              const term = person.terms[0];
              const name = bioguide ? (
                <Link href={`/legislators/federal/${bioguide}`} className="underline">
                  {person.fullName}
                </Link>
              ) : (
                person.fullName
              );
              return (
                <li key={person.fullName}>
                  {name}
                  {term ? ` (${partyLabel(term.party)}, ${term.regionCode})` : ""}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            {cosponsors.length} cosponsor{cosponsors.length === 1 ? "" : "s"}
          </p>
          {bill.subjects.length > 0 ? (
            <>
              <h3 className="mb-1 mt-4 text-sm font-semibold">Topics</h3>
              <p className="break-words text-sm text-muted-foreground">
                {bill.policyArea ? `${bill.policyArea}. ` : ""}
                {bill.subjects
                  .slice(0, 12)
                  .map((subject) => subject.name)
                  .join(", ")}
              </p>
            </>
          ) : null}
        </Panel>

        <Panel aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="mb-2 font-semibold">
            Timeline
          </h2>
          <ol className="max-h-96 space-y-2 overflow-y-auto text-sm" data-testid="bill-timeline">
            {bill.actions.map((action) => (
              <li key={action.id} className="border-l-2 pl-3">
                <p className="text-xs text-muted-foreground">{formatDate(action.actionDate)}</p>
                <p className="break-words">{action.text}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {bill.textVersions.length > 0 || bill.relations.length > 0 ? (
        <Panel aria-labelledby="more-heading">
          <h2 id="more-heading" className="mb-2 font-semibold">
            Text and related bills
          </h2>
          {bill.textVersions.length > 0 ? (
            <ul className="mb-3 space-y-1 text-sm">
              {bill.textVersions.map((version) => (
                <li key={version.id} className="break-words">
                  {version.versionType}
                  {version.issuedOn ? `, ${formatDate(version.issuedOn)}` : ""}:{" "}
                  {version.htmlUrl ? (
                    <a href={version.htmlUrl} className="underline" target="_blank" rel="noreferrer">
                      Read
                    </a>
                  ) : null}{" "}
                  {version.pdfUrl ? (
                    <a href={version.pdfUrl} className="underline" target="_blank" rel="noreferrer">
                      PDF
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {bill.relations.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {bill.relations.map((relation) => (
                <li key={`${relation.relatedSlug}-${relation.relationType}`} className="break-words">
                  {relation.relatedBillId ? (
                    <Link href={`/bills/${relation.relatedSlug}`} className="underline">
                      {relation.relatedTitle ?? relation.relatedSlug}
                    </Link>
                  ) : (
                    (relation.relatedTitle ?? relation.relatedSlug)
                  )}{" "}
                  <span className="text-muted-foreground">({relation.relationType})</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ) : null}

      {bill.sourceUrl ? (
        <p className="text-xs text-muted-foreground">
          Source:{" "}
          <a href={bill.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            Congress.gov
          </a>
        </p>
      ) : null}
    </PageContainer>
  );
}
