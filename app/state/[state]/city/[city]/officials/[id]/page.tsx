import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Mail, Phone } from "lucide-react";
import { EmptyState } from "@/components/app/page-states";
import { MemberDetailSkeleton } from "@/components/app/skeletons";
import { Flex, Grid, OuterBlock, PageSpacer, Section, Stack, WithRail } from "@/components/blocks";
import { StatTile } from "@/components/civic/charts";
import { MemberPhoto } from "@/components/people/member-photo";
import { buttonVariants } from "@/components/ui/button";
import { getCityOfficial, getNextRegularMeeting, getOfficialVotes } from "@/lib/civic/city";
import { cityPositionLabel, seatName, summarizeOfficialRecord } from "@/lib/civic/city-logic";
import { getCityContext } from "@/lib/civic/city-registry";
import { stateByKey } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ state: string; city: string; id: string }> };

async function officialFrom(params: PageProps["params"]) {
  const { state: stateKey, city: cityKey, id } = await params;
  const state = stateByKey(stateKey);
  const city = state ? await getCityContext(state, cityKey) : null;
  if (!state || !city) return null;
  const official = await getCityOfficial(city, decodeURIComponent(id));
  return official ? { state, city, official } : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const found = await officialFrom(params);
  return { title: found ? found.official.fullName : "Official not found" };
}

function day(date: Date | null, timeZone: string): string {
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone }) : "";
}

const POSITION_STYLE: Record<string, string> = {
  YEA: "bg-support-tint text-support",
  NAY: "bg-oppose-tint text-oppose",
  PRESENT: "bg-muted text-muted-foreground",
  NOT_VOTING: "bg-streak-tint text-foreground",
};

function VoteRow({ vote, timeZone }: { vote: Awaited<ReturnType<typeof getOfficialVotes>>[number]; timeZone: string }) {
  const { rollCall } = vote;
  return (
    <li className="space-y-1 py-3 first:pt-0 last:pb-0" data-testid="official-vote" data-position={vote.position}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold", POSITION_STYLE[vote.position])}>{cityPositionLabel(vote.position)}</span>
        <span className="text-muted-foreground">
          {day(rollCall.occurredAt, timeZone)} · {rollCall.result} {rollCall.totalYea}-{rollCall.totalNay + rollCall.totalNotVoting}
        </span>
      </div>
      <p className="break-words">{rollCall.question}</p>
      <p className="text-xs text-muted-foreground">
        {rollCall.description ? `${rollCall.description}. ` : ""}Roll call {rollCall.legislationRef}.{" "}
        {rollCall.sourceUrl ? (
          <a href={rollCall.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
            Minutes
          </a>
        ) : null}
      </p>
    </li>
  );
}

async function OfficialBody({ params }: PageProps) {
  const found = await officialFrom(params);
  if (!found) notFound();
  const { state, city, official } = found;
  const term = official.terms[0];
  const isMayor = term?.role === "MAYOR";
  const seat = seatName(term?.role ?? "", term?.district?.code);
  const config = city.config;
  const [votes, next] = await Promise.all([getOfficialVotes(city, official.id), getNextRegularMeeting(city, new Date(), Boolean(config))]);
  const lastName = official.fullName.split(" ").at(-1) ?? official.fullName;
  const record = summarizeOfficialRecord(votes, lastName);
  const noVotes = votes.filter((vote) => vote.position === "NAY");
  const stepped = votes.filter((vote) => vote.position === "PRESENT");
  const councilName = config?.council.name ?? "City Council";
  // What the job is, in the city's own terms when we've checked them. Otherwise, what's true in any Iowa city.
  const role = config
    ? isMayor
      ? config.roles.MAYOR
      : term?.district?.code === "AL"
        ? config.roles.AT_LARGE
        : config.roles.WARD
    : isMayor
      ? `The mayor is ${city.name}'s top elected official and leads City Council meetings.`
      : `A member of ${city.name}'s City Council, which passes the city's ordinances and budget.`;
  const links = config?.roleLinks[isMayor ? "MAYOR" : "COUNCIL_MEMBER"] ?? [];
  const cityHref = stateRoutes(state.key).city(city.key);

  return (
    <PageSpacer>
      <header className="space-y-3">
        <Link href={cityHref} className="text-sm font-bold text-primary hover:underline">
          ← City Hall: {city.name}
        </Link>
        <Flex nowrap gap="md" align="center">
          <MemberPhoto name={official.fullName} url={official.imageUrl} party={null} size={112} />
          <div className="min-w-0 space-y-1">
            <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl" data-testid="official-name">
              {official.fullName}
            </h1>
            <p className="font-bold text-muted-foreground" data-testid="official-seat">
              {isMayor ? `Mayor of ${city.name}` : `${councilName} member, ${seat}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {term?.startYear ? `Since ${term.startYear}` : ""}
              {term?.endYear ? ` · Term ends January ${term.endYear}` : ""}
            </p>
          </div>
        </Flex>
        <p className="max-w-2xl">{role}</p>
      </header>

      <WithRail
        rail={
          <>
            <OuterBlock className="space-y-3" data-testid="official-contact">
              <h2 className="text-lg font-extrabold">Reach {isMayor ? "the mayor" : "them"}</h2>
              {official.phone ? (
                <a href={`tel:${official.phone.replace(/[^\d]/g, "")}`} className="tap flex items-center gap-2 font-bold text-primary hover:underline">
                  <Phone className="size-4" aria-hidden />
                  {official.phone}
                </a>
              ) : null}
              {official.email ? (
                <a href={`mailto:${official.email}`} className="tap flex min-w-0 items-center gap-2 break-all font-bold text-primary hover:underline">
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {official.email}
                </a>
              ) : null}
              {official.websiteUrl && !config ? (
                <a href={official.websiteUrl} target="_blank" rel="noreferrer" className="tap flex items-center gap-2 font-bold text-primary hover:underline" data-testid="official-source">
                  <ExternalLink className="size-4" aria-hidden />
                  On the city&apos;s site
                </a>
              ) : null}
              {links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="tap flex items-center gap-2 font-bold text-primary hover:underline" data-testid="official-role-link">
                  <ExternalLink className="size-4" aria-hidden />
                  {link.label}
                </a>
              ))}
            </OuterBlock>
            {next ? (
              <OuterBlock className="space-y-2">
                <h2 className="text-lg font-extrabold">Say it to them in person</h2>
                <p className="text-sm">
                  The {councilName} meets next on{" "}
                  {next.startsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: state.timeZone })}.
                </p>
                <Link href={cityHref} className={buttonVariants({ variant: "outline" })}>
                  How to speak at the meeting
                </Link>
              </OuterBlock>
            ) : null}
          </>
        }
      >
        {record.votes > 0 ? (
          <Section
            title="Their record"
            description={`From ${record.votes.toLocaleString()} council votes between ${day(record.firstVote, state.timeZone)} and ${day(record.lastVote, state.timeZone)}, each checked against the clerk's tally.`}
            data-testid="official-record"
          >
            <Grid cols="halves">
              <StatTile
                value={record.attendancePercent === null ? "—" : `${record.attendancePercent}%`}
                label="Of votes they were there for"
                hint={`At ${record.meetingsAttended} of ${record.meetings} meetings`}
                testId="official-attendance"
              />
              <StatTile value={record.nays.toLocaleString()} label="Times they voted no" hint="Most council votes are unanimous" testId="official-nays" />
              <StatTile value={record.moved.toLocaleString()} label="Motions they made" hint={`And ${record.seconded} they seconded`} testId="official-motions" />
              <StatTile value={record.abstained.toLocaleString()} label="Times they stepped aside" hint="For a conflict of interest they declared" testId="official-abstained" />
            </Grid>
          </Section>
        ) : (
          <EmptyState title="No votes we could check yet">Their votes appear here once the minutes that record them have been read.</EmptyState>
        )}

        {noVotes.length > 0 ? (
          <Section title="Where they voted no" description="The votes where they parted from at least part of the council." data-testid="official-no-votes">
            <OuterBlock>
              <ul className="divide-y-2">
                {noVotes.map((vote) => (
                  <VoteRow key={vote.rollCall.id} vote={vote} timeZone={state.timeZone} />
                ))}
              </ul>
            </OuterBlock>
          </Section>
        ) : null}

        {stepped.length > 0 ? (
          <Section title="When they stepped aside" description="They declared a conflict of interest, so they didn't vote." data-testid="official-abstentions">
            <OuterBlock>
              <ul className="divide-y-2">
                {stepped.map((vote) => (
                  <VoteRow key={vote.rollCall.id} vote={vote} timeZone={state.timeZone} />
                ))}
              </ul>
            </OuterBlock>
          </Section>
        ) : null}

        {votes.length > 0 ? (
          <Section title="Their latest votes" data-testid="official-recent">
            <Stack>
              <OuterBlock>
                <ul className="divide-y-2">
                  {votes.slice(0, 15).map((vote) => (
                    <VoteRow key={vote.rollCall.id} vote={vote} timeZone={state.timeZone} />
                  ))}
                </ul>
              </OuterBlock>
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <FileText className="mt-0.5 size-4 shrink-0" aria-hidden />
                Rebuilt from the {city.name}{" "}City Clerk&apos;s minutes. A vote only appears when the names add up to the tally the clerk recorded, and one split
                across sub-items is left out rather than guessed.
              </p>
            </Stack>
          </Section>
        ) : null}
      </WithRail>
    </PageSpacer>
  );
}

export default async function CityOfficialPage(props: PageProps) {
  if (!(await officialFrom(props.params))) notFound();
  return (
    <Suspense fallback={<MemberDetailSkeleton />}>
      <OfficialBody {...props} />
    </Suspense>
  );
}
