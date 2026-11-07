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
  const queue = await getVoteQueue(userId, reps.map((rep) => rep.id), SESSION_LENGTH, new Date(), topics);

  return (
    <PageSpacer width="narrow">
      <Stack gap="lg">
        <h1 className="sr-only">Vote on bills</h1>
        {queue.length > 0 ? (
          <VoteSession
            signedIn={Boolean(userId)}
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
