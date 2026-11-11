import { LegiHtml, LegiText } from "@/components/glossary/legi-text";
import { Disclosure } from "@/components/ui/disclosure";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, MessageCircle } from "lucide-react";
import { InShortHeading } from "@/components/bills/in-short-heading";
import { FORUM_OPEN } from "@/lib/features";
import sanitizeHtml from "sanitize-html";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { OutcomeButton } from "@/components/notifications/outcome-button";
import { BillAskAi } from "@/components/bills/bill-ask-ai";
import { BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import { BillListenButton } from "@/components/bills/bill-listen-button";
import { RollCallCard } from "@/components/bills/roll-call-card";
import { ShareButton } from "@/components/bills/share-button";
import { FloorCategoryPill } from "@/components/bills/upcoming-bill-card";
import { VoteGateCard } from "@/components/bills/vote-gate-card";
import { SectionTabs } from "@/components/app/section-tabs";
import { buttonVariants } from "@/components/ui/button";
import { VoteResultAnchor } from "@/components/bills/vote-result-anchor";
import { Flex, OuterBlock, PageSpacer, Section, Stack, WithRail } from "@/components/blocks";
import { AfterVote } from "@/components/civic/after-vote";
import { BillOutlookCard } from "@/components/civic/bill-outlook-card";
import { NextStepCard } from "@/components/civic/next-step-card";
import { PolicyChip } from "@/components/civic/policy-chip";
import { RevealPanel } from "@/components/civic/reveal-panel";
import { Term } from "@/components/civic/term";
import { MemberPhoto } from "@/components/people/member-photo";
import { getBill, getPartyBreakdowns } from "@/lib/civic/bills";
import { isFetchableTextUrl } from "@/lib/civic/bill-text-logic";
import { billOutlook } from "@/lib/civic/bill-outlook";
import { buildDigest } from "@/lib/civic/digest";
import { getBillFloorItem } from "@/lib/civic/floor";
import { weekLabel } from "@/lib/civic/floor-logic";
import { explainAction } from "@/lib/civic/glossary";
import {
  billLabel,
  billStageIndex,
  partyLabel,
  type BillStatusValue,
} from "@/lib/civic/labels";
import { memberKeyOf } from "@/lib/civic/people";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import { getUserBillState, recordBillView } from "@/lib/civic/users";
import { missingSenateVotes } from "@/lib/civic/verdict";
import { billPath, billTextPath, memberPath, rollCallPath, stateRoutes, topicPath } from "@/lib/routes";
import { EventCard } from "@/components/state/event-card";
import { existingBills } from "@/lib/civic/bills";
import { explainStateAction, governmentOfSlug } from "@/lib/civic/government";
import { stateOfSlug } from "@/lib/civic/states";
import { getBillEvents } from "@/lib/civic/state";
import { RelativeDate } from "@/components/app/relative-date";
import { BillWhen } from "@/components/bills/bill-when";
import { Suspense } from "react";
import { BillDetailSkeleton } from "@/components/app/skeletons";
import { billExists } from "@/lib/civic/exists";

export type BillPageProps = { params: Promise<{ id: string }> };
type PageProps = BillPageProps;

export async function billPageMetadata({ params }: PageProps): Promise<Metadata> {
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

function BillProgress({ status, stages }: { status: BillStatusValue; stages: string[] }) {
  const reached = billStageIndex(status);
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="How far this bill has come">
      {stages.map((stage, index) => (
        <li key={stage} aria-current={index === reached ? "step" : undefined} className="min-w-0">
          <div className={`h-2.5 rounded-full ${index <= reached ? "bg-primary" : "bg-background-dark"}`} />
          <p
            className={`mt-1 text-center text-[0.65rem] leading-tight sm:text-xs ${
              index === reached ? "font-extrabold" : "text-muted-foreground"
            }`}
          >
            {stage}
          </p>
        </li>
      ))}
    </ol>
  );
}

type Sponsorship = NonNullable<Awaited<ReturnType<typeof getBill>>>["sponsorships"][number];

function PersonRow({ sponsorship, size = 40 }: { sponsorship: Sponsorship; size?: number }) {
  const { person } = sponsorship;
  const bioguide = memberKeyOf(person);
  const term = person.terms[0];
  return (
    <div className="flex min-w-0 items-center gap-3">
      <MemberPhoto name={person.fullName} url={person.imageUrl} party={term?.party} size={size} />
      <p className="min-w-0 break-words leading-snug">
        {bioguide ? (
          <Link href={memberPath(bioguide)} className="font-bold hover:underline">
            {person.fullName}
          </Link>
        ) : (
          <span className="font-bold">{person.fullName}</span>
        )}
        {term ? (
          <span className="block text-sm text-muted-foreground">
            {partyLabel(term.party)}, {term.regionCode}
          </span>
        ) : null}
      </p>
    </div>
  );
}

async function BillBody({ params }: PageProps) {
  const bill = await getBill((await params).id);
  if (!bill) notFound();

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const state = userId ? await getUserBillState(userId, bill.id) : null;
  if (userId) {
    // Viewing history is nice to have, so it never holds up or breaks the page.
    recordBillView(userId, bill.id).catch(() => undefined);
  }

  const floorItem = await getBillFloorItem(bill.id);
  // The text isn't stored. A version Congress.gov publishes as a page can be fetched when someone opens it.
  const textAvailable = bill.textVersions.some((version) => isFetchableTextUrl(version.htmlUrl));

  const sponsors = bill.sponsorships.filter((item) => item.kind === "SPONSOR");
  const cosponsors = bill.sponsorships.filter((item) => item.kind === "COSPONSOR");
  const [summary, ...olderSummaries] = bill.summaries;
  const digest = buildDigest(summary?.text);
  const label = billLabel(bill.billType, bill.number);
  const pdf = bill.textVersions.find((version) => version.pdfUrl)?.pdfUrl ?? null;
  const area = policyAreaByName(bill.policyArea);
  const government = governmentOfSlug(bill.slug);
  const billState = stateOfSlug(bill.slug);
  const isState = billState !== null;
  const endDate = bill.session.endDate;
  const outlook = billOutlook(bill.currentStatus, { slug: bill.slug, endDate });

  // Vote first, then find out. Signed-out visitors and search engines can't vote, so they see it all.
  if (userId && !state?.position && !state?.skippedGate) {
    return (
      <PageSpacer width="narrow">
        <VoteGateCard
          slug={bill.slug}
          label={label}
          title={bill.title}
          policyArea={bill.policyArea}
          explanation={isState ? null : (area?.explanation ?? null)}
          digest={digest}
          summarySource={summary?.source === "BILL_EXPLANATION" ? "BILL_EXPLANATION" : "CRS"}
          textHref={textAvailable ? billTextPath(bill.slug) : null}
          floorNotice={floorItem ? weekLabel(floorItem.weekOf, new Date()) : null}
          sponsor={sponsors[0] ? <PersonRow sponsorship={sponsors[0]} size={44} /> : null}
        />
      </PageSpacer>
    );
  }

  const breakdowns = await getPartyBreakdowns(bill.rollCalls.map((rollCall) => rollCall.id));
  const hasFinalVote = bill.rollCalls.length > 0;
  const pendingSenateVotes = isState ? [] : missingSenateVotes(bill.actions, bill.rollCalls);
  const passages = billState ? bill.actions.filter((action) => billState.passageAction.test(action.text)).length : 0;
  const unreadVotes = Math.max(0, passages - bill.rollCalls.length);
  const meetings = billState ? await getBillEvents(billState, label) : [];
  const existing = await existingBills(bill.relations.map((relation) => relation.relatedSlug));

  return (
    <PageSpacer>
      <header className="space-y-3">
        <nav>
          <Link href={government.billsHref} className="text-sm font-bold text-primary hover:underline">
            ← All {billState ? `${billState.name} ` : ""}bills
          </Link>
        </nav>
        <Flex gap="xs">
          <span className="mr-1 font-extrabold">{label}</span>
          <BillStatusBadge status={bill.currentStatus} slug={bill.slug} endDate={endDate} />
          <PolicyChip name={bill.policyArea} link slug={bill.slug} />
          {bill.lawNumber ? (
            <span className="text-sm font-bold text-muted-foreground">
              {isState ? government.lawLabel(bill.lawNumber) : <Term id="public-law">Public Law {bill.lawNumber}</Term>}
            </span>
          ) : null}
        </Flex>
        <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">{bill.title}</h1>
        <p data-testid="bill-when">
          <BillWhen bill={bill} className="text-base" />
        </p>
        <BillProgress status={bill.currentStatus as BillStatusValue} stages={government.stages} />
      </header>

      <WithRail
        lead={
          <OuterBlock className="space-y-3" aria-labelledby="digest-heading" data-testid="digest">
        <InShortHeading source={summary?.source === "BILL_EXPLANATION" ? "BILL_EXPLANATION" : "CRS"} />
        {digest ? (
          <>
            <p className="text-lg font-semibold leading-relaxed" data-testid="digest-lead">
              <LegiText text={digest.lead} />
            </p>
            {/* The lead is the point. The rest of the summary is a tab away, so the vote stays near the top. */}
          </>
        ) : (
          <div className="space-y-1" data-testid="no-summary">
            <p className="text-lg font-semibold leading-relaxed">
              {area ? `This is a ${area.name.toLowerCase()} bill. ` : ""}
              {isState ? "We don't have a summary for this one." : "No official summary yet."}
            </p>
            {isState ? (
              <p className="text-sm text-muted-foreground">
                This one has no explanation we could read. {pdf ? "The bill itself is linked below." : ""}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                The <Term id="crs">Congressional Research Service</Term> summarizes bills once
                they&apos;re moving, which can take a while for new ones.
                {textAvailable ? " The full text is available below." : ""}
              </p>
            )}
          </div>
        )}
        {area && !isState ? <p className="text-sm text-muted-foreground">{area.explanation}</p> : null}
        <p className="text-sm text-muted-foreground">
          Latest: {bill.latestActionText ?? "No action yet"}
          {bill.latestActionDate ? ` (${formatDate(bill.latestActionDate)})` : ""}
        </p>
        {isState && digest ? (
          <p className="text-xs text-muted-foreground" data-testid="explanation-note">
            From the explanation the drafters attach to the bill as introduced. Legislators don&apos;t vote on its wording, and later amendments can change what the bill does.
          </p>
        ) : null}
        <Flex gap="sm">
          {pdf ? (
            <a href={pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline" data-testid="bill-pdf-link">
              <FileText className="size-4" aria-hidden />
              Read the bill (PDF)
            </a>
          ) : null}
          {summary ? <BillListenButton slug={bill.slug} signedIn={Boolean(userId)} /> : null}
          {textAvailable ? (
            <Link
              href={billTextPath(bill.slug)}
              className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline"
              data-testid="bill-text-link"
            >
              <FileText className="size-4" aria-hidden />
              Read the full text
            </Link>
          ) : null}
        </Flex>
      </OuterBlock>
        }
        rail={
          <>
          <VoteResultAnchor slug={bill.slug} />
          <OuterBlock className="space-y-3" data-testid="your-vote">
        {floorItem ? (
          <div className="space-y-1 rounded-xl bg-primary-tint p-3" data-testid="floor-notice">
            <p className="font-extrabold">On the House floor schedule: {weekLabel(floorItem.weekOf, new Date())}</p>
            <Flex gap="sm">
              <FloorCategoryPill category={floorItem.category} />
              {floorItem.stage ? <span className="text-sm">{floorItem.stage} this bill</span> : null}
            </Flex>
            <p className="text-sm">A vote may happen, so now&apos;s the time to weigh in.</p>
          </div>
        ) : null}
        <h2 className="text-lg font-extrabold">{hasFinalVote ? "What do you think?" : "Would you support this?"}</h2>
        <BillActionButtons
          slug={bill.slug}
          signedIn={Boolean(userId)}
          initialPosition={state?.position ?? null}
          initialFollowing={state?.following ?? false}
          size="lg"
        />
        <AfterVote slug={bill.slug} initialPosition={state?.position ?? null}>
          <BillOutlookCard status={bill.currentStatus} slug={bill.slug} endDate={endDate} />
        </AfterVote>
        <RevealPanel
          slug={bill.slug}
          signedIn={Boolean(userId)}
          initialPosition={state?.position ?? null}
          canContact={outlook.canInfluence}
        />
        <Flex justify={outlook.canInfluence ? "between" : "end"}>
          {/* A bill still in play can still be voted on, so there's an outcome to hear about. */}
          {outlook.canInfluence ? (
            <OutcomeButton slug={bill.slug} signedIn={Boolean(userId)} initialFollowing={state?.following ?? false} />
          ) : null}
          <span className="flex flex-wrap items-center gap-2">
            {/* The forum is shelved for now (lib/features.ts). */}
            {FORUM_OPEN ? (
              <Link href={`/forum?bill=${encodeURIComponent(bill.slug)}`} className={buttonVariants({ variant: "outline", size: "sm" })} data-testid="bill-discuss">
                <MessageCircle className="size-4" aria-hidden />
                Talk about it
              </Link>
            ) : null}
            <ShareButton title={`${label}: ${bill.title}`} />
          </span>
        </Flex>
      </OuterBlock>
          </>
        }
      >
      <Section title="Who's behind it">
        <OuterBlock className="space-y-3">
          <p className="text-sm font-extrabold text-muted-foreground">
            <Term id="sponsor">Sponsor</Term>
          </p>
          {sponsors.length > 0 ? (
            sponsors.map((sponsorship) => (
              <PersonRow key={sponsorship.person.fullName} sponsorship={sponsorship} size={56} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{billState ? `No individual sponsor listed. Committees write many ${billState.name} bills.` : "Not listed yet."}</p>
          )}
          {cosponsors.length > 0 ? (
            <Disclosure
              data-testid="cosponsors"
              title={`${cosponsors.length} cosponsor${cosponsors.length === 1 ? "" : "s"}`}
              aside={<Term id="cosponsor">What&apos;s a cosponsor?</Term>}
            >
              <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                {cosponsors.map((sponsorship) => (
                  <li key={sponsorship.person.fullName}>
                    <PersonRow sponsorship={sponsorship} size={36} />
                  </li>
                ))}
              </ul>
            </Disclosure>
          ) : (
            isState ? null : <p className="text-sm text-muted-foreground">No cosponsors yet.</p>
          )}
          {bill.subjects.length > 0 ? (
            <p className="break-words text-sm text-muted-foreground">
              <span className="font-bold">Topics: </span>
              {bill.subjects
                .slice(0, 12)
                .map((subject) => subject.name)
                .join(", ")}
            </p>
          ) : null}
        </OuterBlock>
      </Section>

      <SectionTabs
        testId="bill-tabs"
        tabTestId="bill-tab"
        tabs={[
          {
            id: "history",
            label: "What's happened",
            content: (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Every step so far, newest first, in plain words where we can.</p>

        <OuterBlock>
          <ol className="max-h-[32rem] space-y-3 overflow-y-auto" data-testid="bill-timeline">
            {bill.actions.map((action) => {
              const plain = billState
                ? (() => {
                    const explanation = explainStateAction(billState, action.text);
                    return explanation ? { explanation, term: null } : null;
                  })()
                : explainAction(action.text);
              return (
                <li key={action.id} className="border-l-4 border-primary-tint pl-3">
                  <p className="text-xs font-bold text-muted-foreground"><RelativeDate date={action.actionDate} /></p>
                  {plain ? (
                    <p className="font-bold leading-snug" data-testid="action-plain">
                      {plain.term ? <Term id={plain.term}>{plain.explanation}</Term> : plain.explanation}
                    </p>
                  ) : null}
                  <p className={`break-words ${plain ? "text-sm text-muted-foreground" : ""}`}>{action.text}</p>
                </li>
              );
            })}
          </ol>
        </OuterBlock>
                    </div>
            ),
          },
          {
            id: "votes",
            label: `Votes (${bill.rollCalls.length})`,
            content: (
              <div className="space-y-3" data-testid="bill-votes">
                <p className="text-sm text-muted-foreground">Party totals. How your own reps voted stays hidden above until you ask.</p>

        {unreadVotes > 0 ? (
          <p className="rounded-xl bg-streak-tint p-3 text-sm" data-testid="unread-state-votes">
            {unreadVotes === 1 ? "One passage vote is" : `${unreadVotes} passage votes are`}{" "}only in the timeline below, without names. We show a vote once the journal&apos;s names and totals add up.
          </p>
        ) : null}
        {pendingSenateVotes.length > 0 ? (
          <p className="rounded-xl bg-streak-tint p-3 text-sm" data-testid="pending-senate-votes">
            The Senate has voted on this: see the timeline below for the result. How each senator
            voted isn&apos;t in yet, because that data can take a few weeks to arrive.
          </p>
        ) : null}
        {bill.rollCalls.length > 0 ? (
          <Stack>
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
                sourceUrl={rollCall.sourceUrl}
                asOf={rollCall.asOf}
                totals={{
                  yea: rollCall.totalYea,
                  nay: rollCall.totalNay,
                  present: rollCall.totalPresent,
                  notVoting: rollCall.totalNotVoting,
                }}
                parties={breakdowns.get(rollCall.id) ?? []}
                membersHref={rollCallPath(bill.slug, rollCall.id)}
              />
            ))}
          </Stack>
        ) : pendingSenateVotes.length > 0 ? null : (
          <EmptyState title="No recorded votes yet">
            Many bills never get a <Term id="roll-call">recorded vote</Term>. They appear here if they do.
          </EmptyState>
        )}
                    </div>
            ),
          },
          ...(olderSummaries.length > 0 || summary
            ? [
                {
                  id: "summary",
                  label: isState ? "Full explanation" : "Full summary",
                  content: (

          <OuterBlock className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {summary?.source === "BILL_EXPLANATION" ? "The bill's explanation" : <Term id="crs">Congressional Research Service</Term>}
              {summary?.actionDesc ? `, ${summary.actionDesc}` : ""}
              {summary?.actionDate ? `, ${formatDate(summary.actionDate)}` : ""}
            </p>
            <LegiHtml testId="bill-summary" className="prose max-w-none break-words" html={sanitizeHtml(summary.text, SUMMARY_SANITIZE)} />
            {olderSummaries.length > 0 ? (
              <Disclosure data-testid="older-summaries" title={`Earlier versions (${olderSummaries.length})`}>
                <div className="mt-3 space-y-3">
                  {olderSummaries.map((older) => (
                    <div key={older.id} className="border-l-4 pl-3">
                      <p className="mb-1 text-xs font-bold text-muted-foreground">
                        {older.actionDesc ?? "Earlier version"}
                        {older.actionDate ? `, ${formatDate(older.actionDate)}` : ""}
                      </p>
                      <LegiHtml className="prose prose-sm max-w-none break-words" html={sanitizeHtml(older.text, SUMMARY_SANITIZE)} />
                    </div>
                  ))}
                </div>
              </Disclosure>
            ) : null}
          </OuterBlock>
                          ),
                },
              ]
            : []),
          ...(textAvailable
            ? [
                {
                  id: "ask",
                  label: "Ask a question",
                  content: (

          <OuterBlock>
            <BillAskAi slug={bill.slug} signedIn={Boolean(userId)} />
          </OuterBlock>
                          ),
                },
              ]
            : []),
          ...(meetings.length > 0
            ? [
                {
                  id: "meetings",
                  label: `Meetings (${meetings.length})`,
                  content: (
                    <div data-testid="bill-meetings">

          <Stack>
            {meetings.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Stack>
                            </div>
                  ),
                },
              ]
            : []),
          ...(bill.relations.length > 0
            ? [
                {
                  id: "related",
                  label: "Related bills",
                  content: (

          <OuterBlock>
            <ul className="space-y-2 text-sm">
              {bill.relations.map((relation) => (
                <li key={`${relation.relatedSlug}-${relation.relationType}`} className="break-words">
                  {existing.has(relation.relatedSlug) ? (
                    <Link href={billPath(relation.relatedSlug)} className="font-bold text-primary hover:underline">
                      {relation.relatedTitle ?? existing.get(relation.relatedSlug)}
                    </Link>
                  ) : (
                    <span className="font-bold">{relation.relatedTitle ?? relation.relatedSlug}</span>
                  )}{" "}
                  <span className="text-muted-foreground">({relation.relationType})</span>
                </li>
              ))}
            </ul>
          </OuterBlock>
                          ),
                },
              ]
            : []),
        ]}
      />

      <NextStepCard
        label="Keep going"
        step={{
          id: "after-bill",
          title: billState ? `Vote on another ${billState.name} bill` : area ? `See more ${area.name.toLowerCase()} bills` : "Vote on another bill",
          description: area && !isState ? area.explanation : "Each one sharpens how well you know your reps.",
          href: billState ? stateRoutes(billState.key).bills : area ? topicPath(area.slug) : "/vote",
          cta: billState ? `Browse ${billState.name} bills` : area ? "Browse this topic" : "Start voting",
          tone: "primary",
        }}
      />

      {bill.sourceUrl ? (
        <p className="text-xs text-muted-foreground">
          Source:{" "}
          <a href={bill.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            {government.sourceName}
          </a>
        </p>
      ) : null}
      </WithRail>
    </PageSpacer>
  );
}

/** `prefix` keeps each government's bills under its own URLs. */
export async function BillPage(props: PageProps & { prefix: string }) {
  const { id } = await props.params;
  if (!id.startsWith(props.prefix) || !(await billExists(id))) notFound();
  return (
    <Suspense fallback={<BillDetailSkeleton />}>
      <BillBody {...props} />
    </Suspense>
  );
}
