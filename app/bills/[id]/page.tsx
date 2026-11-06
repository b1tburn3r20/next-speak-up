import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, Sparkles } from "lucide-react";
import sanitizeHtml from "sanitize-html";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { BillActionButtons } from "@/components/bills/bill-action-buttons";
import { BillAskAi } from "@/components/bills/bill-ask-ai";
import { BillStatusBadge, formatDate } from "@/components/bills/bill-card";
import { BillListenButton } from "@/components/bills/bill-listen-button";
import { RollCallCard } from "@/components/bills/roll-call-card";
import { ShareButton } from "@/components/bills/share-button";
import { FloorCategoryPill } from "@/components/bills/upcoming-bill-card";
import { Flex, OuterBlock, PageShell, Section, Stack } from "@/components/blocks";
import { NextStepCard } from "@/components/civic/next-step-card";
import { PolicyChip } from "@/components/civic/policy-chip";
import { RevealPanel } from "@/components/civic/reveal-panel";
import { Term } from "@/components/civic/term";
import { MemberPhoto } from "@/components/people/member-photo";
import { getBill, getPartyBreakdowns, hasBillText } from "@/lib/civic/bills";
import { buildDigest } from "@/lib/civic/digest";
import { getBillFloorItem } from "@/lib/civic/floor";
import { weekLabel } from "@/lib/civic/floor-logic";
import { explainAction } from "@/lib/civic/glossary";
import {
  BILL_STAGES,
  billLabel,
  billStageIndex,
  partyLabel,
  type BillStatusValue,
} from "@/lib/civic/labels";
import { bioguideOf } from "@/lib/civic/people";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import { getUserBillState, recordBillView } from "@/lib/civic/users";

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
    <ol className="grid grid-cols-6 gap-1" aria-label="How far this bill has come">
      {BILL_STAGES.map((stage, index) => (
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
  const bioguide = bioguideOf(person);
  const term = person.terms[0];
  return (
    <div className="flex min-w-0 items-center gap-3">
      <MemberPhoto name={person.fullName} url={person.imageUrl} party={term?.party} size={size} />
      <p className="min-w-0 break-words leading-snug">
        {bioguide ? (
          <Link href={`/legislators/federal/${bioguide}`} className="font-bold hover:underline">
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

export default async function BillPage({ params }: PageProps) {
  const bill = await getBill((await params).id);
  if (!bill) notFound();

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const state = userId ? await getUserBillState(userId, bill.id) : null;
  if (userId) {
    // Viewing history is nice to have, so it never holds up or breaks the page.
    recordBillView(userId, bill.id).catch(() => undefined);
  }

  const [floorItem, textAvailable, breakdowns] = await Promise.all([
    getBillFloorItem(bill.id),
    hasBillText(bill.id),
    getPartyBreakdowns(bill.rollCalls.map((rollCall) => rollCall.id)),
  ]);

  const sponsors = bill.sponsorships.filter((item) => item.kind === "SPONSOR");
  const cosponsors = bill.sponsorships.filter((item) => item.kind === "COSPONSOR");
  const [summary, ...olderSummaries] = bill.summaries;
  const digest = buildDigest(summary?.text);
  const label = billLabel(bill.billType, bill.number);
  const area = policyAreaByName(bill.policyArea);
  const hasFinalVote = bill.rollCalls.length > 0;

  return (
    <PageShell width="narrow">
      <header className="space-y-3">
        <nav>
          <Link href="/bills" className="text-sm font-bold text-primary hover:underline">
            ← All bills
          </Link>
        </nav>
        <Flex gap="xs">
          <span className="mr-1 font-extrabold">{label}</span>
          <BillStatusBadge status={bill.currentStatus} />
          <PolicyChip name={bill.policyArea} link />
          {bill.lawNumber ? (
            <span className="text-sm font-bold text-muted-foreground">
              <Term id="public-law">Public Law {bill.lawNumber}</Term>
            </span>
          ) : null}
        </Flex>
        <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">{bill.title}</h1>
        <BillProgress status={bill.currentStatus as BillStatusValue} />
      </header>

      <OuterBlock className="space-y-3" aria-labelledby="digest-heading" data-testid="digest">
        <h2 id="digest-heading" className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden />
          In short
        </h2>
        {digest ? (
          <>
            <p className="text-lg font-semibold leading-relaxed" data-testid="digest-lead">
              {digest.lead}
            </p>
            {digest.points.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {digest.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <div className="space-y-1" data-testid="no-summary">
            <p className="text-lg font-semibold leading-relaxed">
              {area ? `This is a ${area.name.toLowerCase()} bill. ` : ""}
              No official summary yet.
            </p>
            <p className="text-sm text-muted-foreground">
              The <Term id="crs">Congressional Research Service</Term> summarizes bills once
              they&apos;re moving, which can take a while for new ones.
              {textAvailable ? " The full text is available below." : ""}
            </p>
          </div>
        )}
        {area ? <p className="text-sm text-muted-foreground">{area.explanation}</p> : null}
        <p className="text-sm text-muted-foreground">
          Latest: {bill.latestActionText ?? "No action yet"}
          {bill.latestActionDate ? ` (${formatDate(bill.latestActionDate)})` : ""}
        </p>
        <Flex gap="sm">
          {summary ? <BillListenButton slug={bill.slug} signedIn={Boolean(userId)} /> : null}
          {textAvailable ? (
            <Link
              href={`/bills/${bill.slug}/text`}
              className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline"
              data-testid="bill-text-link"
            >
              <FileText className="size-4" aria-hidden />
              Read the full text
            </Link>
          ) : null}
        </Flex>
      </OuterBlock>

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
        <RevealPanel
          slug={bill.slug}
          signedIn={Boolean(userId)}
          initialPosition={state?.position ?? null}
        />
        <Flex justify="end">
          <ShareButton title={`${label}: ${bill.title}`} />
        </Flex>
      </OuterBlock>

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
            <p className="text-sm text-muted-foreground">Not listed yet.</p>
          )}
          {cosponsors.length > 0 ? (
            <details data-testid="cosponsors">
              <summary className="font-bold text-primary">
                {cosponsors.length} <Term id="cosponsor">cosponsor{cosponsors.length === 1 ? "" : "s"}</Term>
              </summary>
              <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                {cosponsors.map((sponsorship) => (
                  <li key={sponsorship.person.fullName}>
                    <PersonRow sponsorship={sponsorship} size={36} />
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="text-sm text-muted-foreground">No cosponsors yet.</p>
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

      {textAvailable ? (
        <Section title="Ask about this bill" aria-labelledby="ask-heading">
          <OuterBlock>
            <BillAskAi slug={bill.slug} signedIn={Boolean(userId)} />
          </OuterBlock>
        </Section>
      ) : null}

      <Section
        title="Recorded votes"
        description="Party totals. How your own reps voted stays hidden above until you ask."
      >
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
                asOf={rollCall.asOf}
                totals={{
                  yea: rollCall.totalYea,
                  nay: rollCall.totalNay,
                  present: rollCall.totalPresent,
                  notVoting: rollCall.totalNotVoting,
                }}
                parties={breakdowns.get(rollCall.id) ?? []}
                membersHref={`/bills/${bill.slug}/votes/${rollCall.id}`}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState title="No recorded votes yet">
            Many bills never get a <Term id="roll-call">recorded vote</Term>. They appear here if they do.
          </EmptyState>
        )}
      </Section>

      <Section title="What's happened so far">
        <OuterBlock>
          <ol className="max-h-[32rem] space-y-3 overflow-y-auto" data-testid="bill-timeline">
            {bill.actions.map((action) => {
              const plain = explainAction(action.text);
              return (
                <li key={action.id} className="border-l-4 border-primary-tint pl-3">
                  <p className="text-xs font-bold text-muted-foreground">{formatDate(action.actionDate)}</p>
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
      </Section>

      {olderSummaries.length > 0 || summary ? (
        <Section title="The full summary">
          <OuterBlock className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <Term id="crs">Congressional Research Service</Term>
              {summary?.actionDesc ? `, ${summary.actionDesc}` : ""}
              {summary?.actionDate ? `, ${formatDate(summary.actionDate)}` : ""}
            </p>
            <div
              data-testid="bill-summary"
              className="prose max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(summary.text, SUMMARY_SANITIZE) }}
            />
            {olderSummaries.length > 0 ? (
              <details data-testid="older-summaries">
                <summary className="font-bold text-primary">Earlier versions ({olderSummaries.length})</summary>
                <div className="mt-3 space-y-3">
                  {olderSummaries.map((older) => (
                    <div key={older.id} className="border-l-4 pl-3">
                      <p className="mb-1 text-xs font-bold text-muted-foreground">
                        {older.actionDesc ?? "Earlier version"}
                        {older.actionDate ? `, ${formatDate(older.actionDate)}` : ""}
                      </p>
                      <div
                        className="prose prose-sm max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(older.text, SUMMARY_SANITIZE) }}
                      />
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </OuterBlock>
        </Section>
      ) : null}

      {bill.relations.length > 0 ? (
        <Section title="Related bills">
          <OuterBlock>
            <ul className="space-y-2 text-sm">
              {bill.relations.map((relation) => (
                <li key={`${relation.relatedSlug}-${relation.relationType}`} className="break-words">
                  {relation.relatedBillId ? (
                    <Link href={`/bills/${relation.relatedSlug}`} className="font-bold text-primary hover:underline">
                      {relation.relatedTitle ?? relation.relatedSlug}
                    </Link>
                  ) : (
                    <span className="font-bold">{relation.relatedTitle ?? relation.relatedSlug}</span>
                  )}{" "}
                  <span className="text-muted-foreground">({relation.relationType})</span>
                </li>
              ))}
            </ul>
          </OuterBlock>
        </Section>
      ) : null}

      <NextStepCard
        label="Keep going"
        step={{
          id: "after-bill",
          title: area ? `See more ${area.name.toLowerCase()} bills` : "Vote on another bill",
          description: area ? area.explanation : "Each one sharpens how well you know your reps.",
          href: area ? `/topics/${area.slug}` : "/vote",
          cta: area ? "Browse this topic" : "Start voting",
          tone: "primary",
        }}
      />

      {bill.sourceUrl ? (
        <p className="text-xs text-muted-foreground">
          Source:{" "}
          <a href={bill.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            Congress.gov
          </a>
        </p>
      ) : null}
    </PageShell>
  );
}
