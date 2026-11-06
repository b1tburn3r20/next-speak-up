import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import sanitizeHtml from "sanitize-html";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { BillAskAi } from "@/components/bills/bill-ask-ai";
import { BillListenButton } from "@/components/bills/bill-listen-button";
import { ShareButton } from "@/components/bills/share-button";
import { FloorCategoryPill } from "@/components/bills/upcoming-bill-card";
import { BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import { RollCallCard } from "@/components/bills/roll-call-card";
import { EmptyState, PageContainer, Panel } from "@/components/app/page-states";
import { getBill, getPartyBreakdowns, getPositionsFor, hasBillText } from "@/lib/civic/bills";
import { getBillFloorItem } from "@/lib/civic/floor";
import { weekLabel } from "@/lib/civic/floor-logic";
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

const SUMMARY_SANITIZE = {
  allowedTags: ["p", "strong", "em", "b", "i", "ul", "ol", "li", "br"],
  allowedAttributes: {},
};

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

  const [floorItem, textAvailable] = await Promise.all([
    getBillFloorItem(bill.id),
    hasBillText(bill.id),
  ]);
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
  const [summary, ...olderSummaries] = bill.summaries;
  const label = billLabel(bill.billType, bill.number);

  return (
    <PageContainer>
      <header className="space-y-3">
        <nav className="text-sm">
          <Link href="/bills" className="underline">
            Bills
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{label}</span>
          <BillStatusBadge status={bill.currentStatus} />
          {bill.lawNumber ? (
            <span className="text-sm text-muted-foreground">Public Law {bill.lawNumber}</span>
          ) : null}
          {bill.policyArea ? (
            <span className="text-sm text-muted-foreground" data-testid="bill-policy-area">
              {bill.policyArea}
            </span>
          ) : null}
        </div>
        <h1 className="break-words text-xl font-semibold sm:text-2xl">{bill.title}</h1>
        <BillProgress status={bill.currentStatus as BillStatusValue} />
        <p className="text-sm text-muted-foreground">
          Latest action, {formatDate(bill.latestActionDate)}: {bill.latestActionText ?? "None yet"}
        </p>
        {floorItem ? (
          <div
            className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/50 p-3 text-sm"
            data-testid="floor-notice"
          >
            <strong>On the House floor schedule: {weekLabel(floorItem.weekOf, new Date())}.</strong>
            <FloorCategoryPill category={floorItem.category} />
            {floorItem.stage ? <span>{floorItem.stage} this bill.</span> : null}
            <span className="text-muted-foreground">
              A vote may happen, so now&apos;s the time to weigh in.
            </span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <BillActionButtons
            slug={bill.slug}
            signedIn={Boolean(userId)}
            initialPosition={state?.position ?? null}
            initialFollowing={state?.following ?? false}
          />
          <ShareButton title={`${label}: ${bill.title}`} />
        </div>
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
                __html: sanitizeHtml(summary.text, SUMMARY_SANITIZE),
              }}
            />
            <div className="mt-3">
              <BillListenButton slug={bill.slug} signedIn={Boolean(userId)} />
            </div>
            {olderSummaries.length > 0 ? (
              <details className="mt-3 text-sm" data-testid="older-summaries">
                <summary className="cursor-pointer font-medium">
                  Earlier versions ({olderSummaries.length})
                </summary>
                <div className="mt-2 space-y-3">
                  {olderSummaries.map((older) => (
                    <div key={older.id} className="border-l-2 pl-3">
                      <p className="mb-1 text-xs text-muted-foreground">
                        {older.actionDesc ?? "Earlier version"}
                        {older.actionDate ? `, ${formatDate(older.actionDate)}` : ""}
                      </p>
                      <div
                        className="prose prose-sm max-w-none break-words dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(older.text, SUMMARY_SANITIZE),
                        }}
                      />
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="no-summary">
            The Congressional Research Service hasn&apos;t published a summary for this bill yet.
            These often take a while for new bills.
          </p>
        )}
      </Panel>

      {textAvailable ? (
        <Panel aria-labelledby="ask-heading">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="ask-heading" className="font-semibold">
              Ask about this bill
            </h2>
            <Link href={`/bills/${bill.slug}/text`} className="text-sm underline" data-testid="bill-text-link">
              Read the full text
            </Link>
          </div>
          <BillAskAi slug={bill.slug} signedIn={Boolean(userId)} />
        </Panel>
      ) : null}

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
                membersHref={`/bills/${bill.slug}/votes/${rollCall.id}`}
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
          {cosponsors.length > 0 ? (
            <details className="mt-2 text-sm" data-testid="cosponsors">
              <summary className="cursor-pointer text-muted-foreground">
                {cosponsors.length} cosponsor{cosponsors.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-1 max-h-64 space-y-1 overflow-y-auto">
                {cosponsors.map(({ person }) => {
                  const bioguide = bioguideOf(person);
                  const term = person.terms[0];
                  return (
                    <li key={person.fullName} className="break-words">
                      {bioguide ? (
                        <Link href={`/legislators/federal/${bioguide}`} className="underline">
                          {person.fullName}
                        </Link>
                      ) : (
                        person.fullName
                      )}
                      {term ? ` (${partyLabel(term.party)}, ${term.regionCode})` : ""}
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No cosponsors</p>
          )}
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
