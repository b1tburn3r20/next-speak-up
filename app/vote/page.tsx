import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OuterBlock, PageSpacer, Stack } from "@/components/blocks";
import { BlindVoteCard } from "@/components/civic/blind-vote-card";
import { VoteSession } from "@/components/civic/vote-session";
import { buttonVariants } from "@/components/ui/button";
import { getVoteQueue } from "@/lib/civic/engage";
import { repsForLocation } from "@/lib/civic/people";
import { getStateRepIds } from "@/lib/civic/state";
import { stateByRegion } from "@/lib/civic/states";
import { getUserLocation, getUserTopics } from "@/lib/civic/users";

export const metadata: Metadata = {
  title: "Vote",
  description: "Vote on real bills, then find out if your representatives agree with you.",
};

const SESSION_LENGTH = 5;

export default async function VotePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const location = userId ? await getUserLocation(userId) : null;
  const reps = location ? await repsForLocation(location.regionCode, location.districtCode) : [];
  const topics = userId ? await getUserTopics(userId) : [];
  const userState = stateByRegion(location?.regionCode);
  const stateRepIds = userId && userState ? await getStateRepIds(userId) : [];
  const repIds = [...reps.map((rep) => rep.id), ...stateRepIds];
  const queue = await getVoteQueue(
    userId,
    repIds,
    SESSION_LENGTH,
    new Date(),
    topics,
    { state: userState },
  );

  // Why each bill is here, so it never feels random.
  const why = (item: (typeof queue)[number]) =>
    item.reason === "REP_VOTED"
      ? "Your reps voted on this"
      : item.reason === "FLOOR"
        ? "Congress may vote on this soon"
        : item.bill.policyArea && topics.includes(item.bill.policyArea)
          ? `In a topic you track: ${item.bill.policyArea}`
          : "A bill you haven't weighed in on";

  return (
    <PageSpacer width="narrow">
      <Stack gap="lg">
        <header className="space-y-1">
          <h1 className="text-2xl font-extrabold">Vote</h1>
          <p className="text-muted-foreground">
            {queue.length > 0
              ? `${queue.length} real bills, one at a time. Support or oppose each one, then see how your reps voted.`
              : "Support or oppose real bills, then see how your reps voted."}
          </p>
        </header>
        {queue.length > 0 ? (
          <VoteSession
            signedIn={Boolean(userId)}
            reasons={queue.map(why)}
            slugs={queue.map((item) => item.bill.slug)}
            cards={queue.map((item) => (
              <BlindVoteCard key={item.bill.id} item={item} signedIn={Boolean(userId)} />
            ))}
          />
        ) : (
          <OuterBlock className="space-y-3 text-center" data-testid="queue-empty">
            <p className="text-lg font-extrabold">You&apos;ve voted on everything we have!</p>
            <p className="text-muted-foreground">
              New bills and votes arrive every day. Until then, see how your reps are doing.
            </p>
            <Link href="/reps" className={buttonVariants({ size: "lg" })}>
              See your reps&apos; report cards
            </Link>
          </OuterBlock>
        )}
      </Stack>
    </PageSpacer>
  );
}
