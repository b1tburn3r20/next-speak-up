import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Award, Flame, Lock, Medal, MessageSquare, Pencil, Sparkles, Vote, type LucideIcon } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RelativeDate } from "@/components/app/relative-date";
import { OuterBlock, PageShell } from "@/components/blocks";
import { PolicyLeanChart } from "@/components/civic/policy-lean-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { can } from "@/lib/auth/permissions";
import { getProfilePage } from "@/lib/civic/profile";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ClearAboutButton } from "./clear-about-button";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getProfilePage((await params).id, null);
  const title = page?.view.kind === "PUBLIC" ? page.view.profile.displayName : "Profile";
  // Using a civic app can say something about a person, so these stay out of search engines.
  return { title, robots: { index: false, follow: false } };
}

const STATUS_STYLE: Record<string, string> = {
  Admin: "bg-oppose-tint",
  Moderator: "bg-xp-tint",
  Supporter: "bg-streak-tint",
  Member: "bg-primary-tint",
};

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-3 text-center" data-testid="profile-stat">
      <p className="break-words text-xl font-extrabold leading-tight tabular-nums sm:text-2xl">{value}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </p>
    </div>
  );
}

function Detail({ label, value, testId }: { label: string; value: string | undefined; testId: string }) {
  if (!value) return null;
  return (
    <div data-testid={testId}>
      <dt className="text-xs font-extrabold text-muted-foreground">{label}</dt>
      <dd className="break-words font-bold">{value}</dd>
    </div>
  );
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const page = await getProfilePage(id, session?.user?.id);
  if (!page) notFound();
  const { view, lean, badges, activity } = page;

  if (view.kind === "PRIVATE") {
    return (
      <PageShell>
        <div className="overflow-hidden rounded-3xl border-2 border-b-8 bg-card" data-testid="profile-private">
          <div className="h-32 bg-muted sm:h-48" aria-hidden />
          <div className="space-y-2 p-8 text-center">
            <Lock className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <h1 className="break-words text-2xl font-extrabold">{view.displayName}</h1>
            <p className="text-muted-foreground">This profile is private.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const { profile, isOwner, isPrivateToOthers } = view;
  const { stats } = profile;
  const hasDetails = profile.ageRange || profile.state || profile.householdIncome;
  const since = profile.memberSince.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const moderator = can(session, "forum.moderate");
  const initials = profile.displayName.slice(0, 2).toUpperCase();
  const showTopics = profile.showVotingTopics && lean.length > 0;

  return (
    <PageShell className="space-y-6">
      <section className="overflow-hidden rounded-3xl border-2 border-b-8 bg-card" data-testid="profile-header">
        <div className="h-32 bg-linear-to-r from-primary via-xp to-streak sm:h-52" aria-hidden data-testid="profile-cover" />
        <div className="px-4 pb-2 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Avatar className="-mt-14 size-28 shrink-0 border-4 border-card sm:-mt-20 sm:size-40" data-testid="profile-avatar">
              {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
              <AvatarFallback className="bg-primary-tint text-4xl font-extrabold sm:text-5xl">{initials}</AvatarFallback>
            </Avatar>
            {isOwner ? (
              <Link href={`${routes.settings}#profile`} className={cn(buttonVariants({ variant: "secondary" }), "mt-3")} data-testid="profile-edit">
                <Pencil className="size-4" aria-hidden />
                Edit profile
              </Link>
            ) : null}
          </div>
          <div className="mt-3 space-y-1">
            <h1 className="break-words text-3xl font-extrabold leading-tight sm:text-4xl" data-testid="profile-title">
              {profile.displayName}
            </h1>
            {profile.username && profile.username !== profile.displayName ? (
              <p className="break-words font-bold text-muted-foreground" data-testid="profile-handle">@{profile.username}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={cn("rounded-full px-3 py-0.5 text-sm font-extrabold", STATUS_STYLE[profile.status] ?? STATUS_STYLE.Member)} data-testid="profile-status">
                {profile.status}
              </span>
              <span className="text-sm font-bold text-muted-foreground">Joined {since}</span>
            </div>
          </div>
          {isOwner ? (
            <p className="mt-3 rounded-xl bg-primary-tint p-2.5 text-sm font-bold" data-testid="profile-owner-note">
              {isPrivateToOthers ? "Your profile is private. Only you can see this page." : "This is what other people see."}
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-3 divide-x-2 border-t-2 sm:grid-cols-6" data-testid="profile-stats">
            <Stat icon={Medal} label="Rank" value={stats.rankName} />
            <Stat icon={Sparkles} label={`${stats.xp.toLocaleString()} XP`} value={`Lv ${stats.level}`} />
            <Stat icon={Flame} label="Day streak" value={String(stats.streak)} />
            <Stat icon={Vote} label="Votes" value={stats.votesCast.toLocaleString()} />
            <Stat icon={Award} label="Badges" value={`${stats.badgesEarned}/${stats.badgesTotal}`} />
            <Stat icon={MessageSquare} label="Posts" value={activity.postCount.toLocaleString()} />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <OuterBlock className="space-y-4 lg:sticky lg:top-6">
          <h2 className="text-lg font-extrabold">About</h2>
          {profile.about ? (
            <p className="whitespace-pre-wrap break-words" data-testid="profile-about">
              {profile.about}
            </p>
          ) : (
            <p className="text-muted-foreground" data-testid="profile-no-about">
              {isOwner ? "You haven't written anything about yourself yet." : "Nothing here yet."}
            </p>
          )}
          {hasDetails ? (
            <dl className="grid grid-cols-2 gap-3 border-t-2 pt-4" data-testid="profile-details">
              <Detail label="Age range" value={profile.ageRange} testId="profile-age" />
              <Detail label="State" value={profile.state} testId="profile-state" />
              <Detail label="District" value={profile.district} testId="profile-district" />
              <Detail label="Household income" value={profile.householdIncome} testId="profile-income" />
            </dl>
          ) : null}
          {moderator && !isOwner && profile.about ? <ClearAboutButton userId={id} /> : null}
          {!isOwner && profile.about ? (
            <p className="text-xs text-muted-foreground">
              See something that shouldn&apos;t be here?{" "}
              <Link href="/feedback" className="font-bold text-primary hover:underline">
                Report it
              </Link>
              .
            </p>
          ) : null}
        </OuterBlock>

        <Tabs defaultValue="activity" className="min-w-0" data-testid="profile-tabs">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">Badges</TabsTrigger>
            {showTopics ? <TabsTrigger value="topics" data-testid="tab-topics">Voting topics</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="activity" className="mt-3">
            {activity.items.length > 0 ? (
              <ul className="space-y-3" data-testid="profile-activity">
                {activity.items.map((item) => (
                  <li key={item.key} data-testid="activity-item" data-kind={item.kind}>
                    <OuterBlock className="space-y-1">
                      <p className="text-xs font-extrabold text-muted-foreground">
                        {item.kind === "post" ? "Posted in the forum" : "Commented on"}
                      </p>
                      <Link href={item.href} className="block break-words font-extrabold hover:underline">
                        {item.title}
                      </Link>
                      {item.snippet ? <p className="line-clamp-3 break-words text-sm">{item.snippet}</p> : null}
                      <p className="text-xs text-muted-foreground">
                        <RelativeDate date={item.at} />
                      </p>
                    </OuterBlock>
                  </li>
                ))}
              </ul>
            ) : (
              <OuterBlock data-testid="profile-no-activity">
                <p className="text-muted-foreground">
                  {isOwner ? "You haven't posted in the forum yet. How you vote never appears here." : "No forum posts yet."}
                </p>
              </OuterBlock>
            )}
          </TabsContent>

          <TabsContent value="badges" className="mt-3">
            <OuterBlock>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" data-testid="profile-badges">
                {badges.map((badge) => (
                  <li key={badge.id} className={badge.earned ? "" : "opacity-50"} data-earned={badge.earned} data-testid="profile-badge">
                    <div className={cn("mb-1 flex size-12 items-center justify-center rounded-full", badge.earned ? "bg-streak-tint text-streak" : "bg-muted text-muted-foreground")}>
                      {badge.earned ? <Award className="size-6" aria-hidden /> : <Lock className="size-5" aria-hidden />}
                    </div>
                    <p className="text-sm font-extrabold leading-tight">{badge.label}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </li>
                ))}
              </ul>
            </OuterBlock>
          </TabsContent>

          {showTopics ? (
            <TabsContent value="topics" className="mt-3" data-testid="profile-lean">
              <OuterBlock>
                <PolicyLeanChart userId={`profile:${id}`} areas={lean} />
              </OuterBlock>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </PageShell>
  );
}
