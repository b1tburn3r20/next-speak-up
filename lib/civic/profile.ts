// Queries behind public profiles. What may be shown is decided in profile-logic.ts, not here.
import { getStateBadgeFacts } from "@/lib/civic/state";
import { AgeRange, IncomeRange } from "@prisma/client";
import prisma from "@/prisma/client";
import { STATE_NAMES } from "@/lib/constants/state-names";
import { formatAgeRange, formatIncomeRange } from "@/lib/utils/string-functions";
import { getEngagementFacts, getPolicyLean } from "./engage";
import { repsForLocation } from "./people";
import {
  buildProfileView,
  DEFAULT_PROFILE_SETTINGS,
  type ProfileOwnerForm,
  type ProfileSettings,
  type ProfileStats,
  type ProfileView,
} from "./profile-logic";
import { computeProgress, type Badge } from "./progress";
import { rankFor } from "./ranks";
import { getUserLocation } from "./users";
import { getHudProgress } from "./xp";

function stateName(value: string | null): string | null {
  if (!value) return null;
  return (STATE_NAMES as Record<string, string>)[value] ?? value;
}

function settingsFrom(row: Partial<ProfileSettings> | null | undefined): ProfileSettings {
  return { ...DEFAULT_PROFILE_SETTINGS, ...row };
}

async function statsFor(userId: string, now: Date): Promise<{ stats: ProfileStats; badges: Badge[] }> {
  const [hud, location] = await Promise.all([getHudProgress(userId, now), getUserLocation(userId)]);
  // Their reps only count toward badges here. Nothing about them reaches the page.
  const reps = location ? await repsForLocation(location.regionCode, location.districtCode) : [];
  const facts = await getEngagementFacts(userId, reps.map((rep) => rep.id));
  const { badges } = computeProgress({
    state: await getStateBadgeFacts(userId),
    xp: hud.xp,
    voteDates: facts.voteDates,
    now,
    repsFound: reps.length > 0,
    bestMatchCompared: facts.mostComparedWithRep,
    floorVotes: facts.floorVotes,
    policyAreasVoted: facts.policyAreasVoted,
  });
  return {
    badges,
    stats: {
      rankName: rankFor(hud.xp).rank.name,
      level: hud.level,
      xp: hud.xp,
      streak: hud.streak,
      votesCast: hud.votesCast,
      badgesEarned: badges.filter((badge) => badge.earned).length,
      badgesTotal: badges.length,
    },
  };
}

export type ActivityItem = { key: string; kind: "post" | "comment"; title: string; snippet: string | null; href: string; at: Date };

function plainSnippet(text: string): string | null {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? plain.slice(0, 240) : null;
}

/** What they've said in the forum, which is public anyway. How they've voted is never in here. */
async function getActivity(userId: string, take = 15) {
  const [posts, comments, postCount] = await Promise.all([
    prisma.forumPost.findMany({
      where: { authorId: userId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, body: true, createdAt: true },
    }),
    prisma.forumComment.findMany({
      where: { authorId: userId, isDeleted: false, post: { isDeleted: false } },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, body: true, createdAt: true, post: { select: { id: true, title: true } } },
    }),
    prisma.forumPost.count({ where: { authorId: userId, isDeleted: false } }),
  ]);
  const items: ActivityItem[] = [
    ...posts.map((post) => ({
      key: `post-${post.id}`,
      kind: "post" as const,
      title: post.title,
      snippet: plainSnippet(post.body),
      href: `/forum/posts/${post.id}`,
      at: post.createdAt,
    })),
    ...comments.map((comment) => ({
      key: `comment-${comment.id}`,
      kind: "comment" as const,
      title: comment.post.title,
      snippet: plainSnippet(comment.body),
      href: `/forum/posts/${comment.post.id}`,
      at: comment.createdAt,
    })),
  ];
  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return { items: items.slice(0, take), postCount };
}

export type ProfilePage = {
  view: ProfileView;
  lean: Awaited<ReturnType<typeof getPolicyLean>>;
  badges: Badge[];
  activity: { items: ActivityItem[]; postCount: number };
  /** Only for the owner, because it holds what they've kept private. */
  form: ProfileOwnerForm | null;
};

export async function getProfilePage(userId: string, viewerId: string | null | undefined): Promise<ProfilePage | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      createdAt: true,
      ageRange: true,
      householdIncome: true,
      state: true,
      district: true,
      role: { select: { name: true } },
      profile: true,
    },
  });
  if (!user) return null;
  const settings = settingsFrom(user.profile);
  const account = {
    id: user.id,
    username: user.username,
    name: user.name,
    image: user.image,
    createdAt: user.createdAt,
    roleName: user.role?.name ?? null,
    ageRange: user.ageRange ? formatAgeRange(user.ageRange) : null,
    householdIncome: user.householdIncome ? formatIncomeRange(user.householdIncome) : null,
    state: stateName(user.state),
    district: user.district,
  };
  const empty: ProfileStats = { rankName: "", level: 1, xp: 0, streak: 0, votesCast: 0, badgesEarned: 0, badgesTotal: 0 };
  // A private page does no more work than it has to, and has nothing to reveal.
  if (!settings.isPublic && viewerId !== user.id) {
    return { view: buildProfileView(account, settings, empty, viewerId), lean: [], badges: [], activity: { items: [], postCount: 0 }, form: null };
  }
  const [{ stats, badges }, activity, lean] = await Promise.all([
    statsFor(user.id, new Date()),
    getActivity(user.id),
    settings.showVotingTopics ? getPolicyLean(user.id) : Promise.resolve([]),
  ]);
  const form: ProfileOwnerForm | null =
    viewerId === user.id
      ? {
          name: user.name ?? "",
          username: user.username ?? "",
          about: settings.about ?? "",
          ageRange: user.ageRange ?? "",
          householdIncome: user.householdIncome ?? "",
          state: stateName(user.state) ?? "",
          district: user.district ? String(user.district) : "",
          isPublic: settings.isPublic,
          showName: settings.showName,
          showAgeRange: settings.showAgeRange,
          showState: settings.showState,
          showDistrict: settings.showDistrict,
          showIncome: settings.showIncome,
          showVotingTopics: settings.showVotingTopics,
          ageOptions: Object.values(AgeRange).map((value) => ({ value, label: formatAgeRange(value) })),
          incomeOptions: Object.values(IncomeRange).map((value) => ({ value, label: formatIncomeRange(value) })),
        }
      : null;
  return { view: buildProfileView(account, settings, stats, viewerId), lean, badges, activity, form };
}

export async function getProfileSettings(userId: string): Promise<ProfileSettings> {
  const row = await prisma.userProfile.findUnique({ where: { userId } });
  return settingsFrom(row);
}

export async function saveProfileSettings(userId: string, changes: Partial<ProfileSettings>) {
  await prisma.userProfile.upsert({
    where: { userId },
    update: changes,
    create: { userId, ...changes },
  });
}

/** A moderator clears an about me. The rest of the profile stays. */
export async function clearAbout(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return false;
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: { about: null },
    create: { userId: user.id },
  });
  return true;
}
