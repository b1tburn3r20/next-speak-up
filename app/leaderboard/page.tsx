import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Trophy } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EmptyState } from "@/components/app/page-states";
import { OuterBlock, PageHeader, PageSpacer, Stack } from "@/components/blocks";
import { can } from "@/lib/auth/permissions";
import { getLeaderboard } from "@/lib/civic/leaderboard";
import { getUserLocation } from "@/lib/civic/users";
import { STATE_NAMES } from "@/lib/constants/state-names";
import { profilePath, routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { LeaderboardToggle, RemoveFromBoard } from "./leaderboard-actions";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Who's been most active this week in your state.",
};

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return (
      <PageSpacer width="narrow">
        <PageHeader title="Leaderboard" description="See who's most active in your state each week." />
        <EmptyState title="Sign in to see your state's board">Earn XP by voting on bills.</EmptyState>
      </PageSpacer>
    );
  }
  const location = await getUserLocation(userId);
  if (!location) {
    return (
      <PageSpacer width="narrow">
        <PageHeader title="Leaderboard" description="See who's most active in your state each week." />
        <EmptyState title="We don't know your state yet" action={{ href: routes.reps, label: "Find your reps" }}>
          Boards are by state.
        </EmptyState>
      </PageSpacer>
    );
  }

  const board = await getLeaderboard(userId, location.regionCode);
  const stateName = (STATE_NAMES as Record<string, string>)[location.regionCode] ?? location.regionCode;
  const moderator = can(session, "forum.moderate");

  return (
    <PageSpacer width="narrow">
      <PageHeader
        title={`${stateName} this week`}
        description="Ranked by XP earned since Monday, then it starts over. It shows activity, never how anyone voted."
      />
      <OuterBlock className="space-y-3" data-testid="leaderboard-me">
        <p className="flex items-center gap-2 font-extrabold">
          <Trophy className="size-5 text-streak" aria-hidden />
          {board.joined && !board.hidden ? "You're" : "You'd be"} #{board.myRank} with {board.myXp} XP this week
        </p>
        {board.hidden ? (
          <p className="text-sm text-muted-foreground" data-testid="leaderboard-hidden">
            A moderator took your name off the board. <Link href="/feedback" className="font-bold text-primary hover:underline">Ask about this</Link>.
          </p>
        ) : !board.hasUsername ? (
          <p className="text-sm text-muted-foreground">
            <Link href={routes.settings} className="font-bold text-primary hover:underline">Choose a username</Link> to join.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Joining shows your username and that you&apos;re in {stateName}{" "}to anyone signed in. It&apos;s off until you
              choose it, and you can leave anytime.
            </p>
            <LeaderboardToggle joined={board.joined} />
          </>
        )}
      </OuterBlock>
      {board.rows.length > 0 ? (
        <Stack gap="sm">
          <ol className="space-y-2" data-testid="leaderboard">
            {board.rows.map((row) => (
              <li
                key={row.userId}
                data-testid="leaderboard-row"
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-3",
                  row.userId === userId && "border-primary bg-primary-tint",
                )}
              >
                <span className="w-7 text-center text-lg font-extrabold tabular-nums">{row.rank}</span>
                <Link href={profilePath(row.userId)} className="min-w-0 flex-1 break-words font-bold hover:underline">
                  {row.username}
                </Link>
                <span className="font-extrabold tabular-nums">{row.xp} XP</span>
                {moderator && row.userId !== userId ? <RemoveFromBoard userId={row.userId} username={row.username} /> : null}
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">
            See a name that shouldn&apos;t be here? <Link href="/feedback" className="font-bold text-primary hover:underline">Report it</Link>.
          </p>
        </Stack>
      ) : (
        <EmptyState title="Nobody's on the board yet this week">Be the first in {stateName}.</EmptyState>
      )}
    </PageSpacer>
  );
}
