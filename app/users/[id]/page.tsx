import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Award, Lock } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RelativeDate } from "@/components/app/relative-date";
import { ProfileSkeleton } from "@/components/app/skeletons";
import { OuterBlock, PageSpacer } from "@/components/blocks";
import { PolicyLeanChart } from "@/components/civic/policy-lean-chart";
import { ProfileBody } from "@/components/profile/profile-body";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { can } from "@/lib/auth/permissions";
import { userExists } from "@/lib/civic/exists";
import { getProfilePage } from "@/lib/civic/profile";
import { cn } from "@/lib/utils";
import { FORUM_OPEN } from "@/lib/features";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getProfilePage((await params).id, null);
  const title = page?.view.kind === "PUBLIC" ? page.view.profile.displayName : "Profile";
  // Using a civic app can say something about a person, so these stay out of search engines.
  return { title, robots: { index: false, follow: false } };
}

async function ProfileContent({ params, searchParams }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const page = await getProfilePage(id, session?.user?.id);
  if (!page) notFound();
  const { view, lean, badges, activity, form } = page;

  if (view.kind === "PRIVATE") {
    return (
      <PageSpacer>
        <div className="overflow-hidden rounded-3xl border-2 border-b-8 bg-card" data-testid="profile-private">
          <div className="h-32 bg-muted sm:h-48" aria-hidden />
          <div className="space-y-2 p-8 text-center">
            <Lock className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <h1 className="break-words text-2xl font-extrabold">{view.displayName}</h1>
            <p className="text-muted-foreground">This profile is private.</p>
          </div>
        </div>
      </PageSpacer>
    );
  }

  const { profile, isOwner, isPrivateToOthers } = view;
  const showTopics = profile.showVotingTopics && lean.length > 0;

  return (
    <PageSpacer className="space-y-6">
      <ProfileBody
        userId={id}
        profile={profile}
        isOwner={isOwner}
        isPrivateToOthers={isPrivateToOthers}
        isModerator={can(session, "forum.moderate")}
        form={form}
        postCount={activity.postCount}
        startEditing={(await searchParams).edit === "1"}
      >
        {/* Opens on whichever has something in it, so the first thing seen isn't an empty box. */}
        {/* With the forum shelved (lib/features.ts), there are no posts to show, so it opens on badges. */}
        <Tabs
          defaultValue={!FORUM_OPEN || (activity.items.length === 0 && profile.stats.badgesEarned > 0) ? "badges" : "activity"}
          className="min-w-0"
          data-testid="profile-tabs"
        >
          <TabsList className="w-full sm:w-fit">
            {FORUM_OPEN ? <TabsTrigger value="activity" data-testid="tab-activity">Forum posts</TabsTrigger> : null}
            <TabsTrigger value="badges" data-testid="tab-badges">
              Badges ({profile.stats.badgesEarned})
            </TabsTrigger>
            {showTopics ? <TabsTrigger value="topics" data-testid="tab-topics">Voting topics</TabsTrigger> : null}
          </TabsList>

          {FORUM_OPEN ? (
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
          ) : null}

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
      </ProfileBody>
    </PageSpacer>
  );
}

export default async function ProfilePage(props: PageProps) {
  if (!(await userExists((await props.params).id))) notFound();
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent {...props} />
    </Suspense>
  );
}
