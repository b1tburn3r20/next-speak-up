// What a public profile may show. This is the one place that decides, and it's pure so it can be
// tested against every field. Anything not returned here never reaches the page or its HTML.

/** Choices someone makes about their profile. A missing row means these defaults. */
export type ProfileSettings = {
  about: string | null;
  isPublic: boolean;
  showName: boolean;
  showAgeRange: boolean;
  showState: boolean;
  showDistrict: boolean;
  showIncome: boolean;
  showVotingTopics: boolean;
};

/** Personal details are off until someone chooses to share them. */
export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  about: null,
  isPublic: true,
  showName: false,
  showAgeRange: false,
  showState: false,
  showDistrict: false,
  showIncome: false,
  showVotingTopics: false,
};

export const ABOUT_MAX_LENGTH = 500;

export type PrivacyKey = Exclude<keyof ProfileSettings, "about" | "isPublic">;

export const PRIVACY_OPTIONS: { key: PrivacyKey; label: string; description: string }[] = [
  { key: "showName", label: "Your name", description: "Your username always shows." },
  { key: "showAgeRange", label: "Your age range", description: "Only the range, never a birthday." },
  { key: "showState", label: "Your state", description: "This also shows if you join the leaderboard." },
  { key: "showDistrict", label: "Your district", description: "Together with your state, this narrows down where you live." },
  { key: "showIncome", label: "Your household income", description: "Most people keep this private." },
  { key: "showVotingTopics", label: "How you vote, by topic", description: "How many bills you supported and opposed on each topic. Never which bills." },
];

/** What someone's role shows as. Two kinds of admin look the same to everyone else. */
export function statusLabel(roleName: string | null | undefined): string {
  switch (roleName) {
    case "Super Admin":
    case "Admin":
      return "Admin";
    case "Moderator":
      return "Moderator";
    case "Supporter":
      return "Supporter";
    default:
      return "Member";
  }
}

export type ProfileAccount = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
  roleName: string | null;
  ageRange: string | null;
  householdIncome: string | null;
  state: string | null;
  district: number | string | null;
};

export type ProfileStats = {
  rankName: string;
  level: number;
  xp: number;
  streak: number;
  votesCast: number;
  badgesEarned: number;
  badgesTotal: number;
};

/** What someone is called: their name only if they've shared it, and never their email. */
export function displayNameOf(account: { username: string | null; name: string | null }, showName: boolean): string {
  if (showName && account.name) return account.name;
  return account.username ?? "Coolbills member";
}

export type PublicProfile = {
  displayName: string;
  username: string | null;
  image: string | null;
  status: string;
  memberSince: Date;
  about: string | null;
  stats: ProfileStats;
  /** Each is here only if they chose to share it, and has a value. */
  name?: string;
  ageRange?: string;
  state?: string;
  district?: string;
  householdIncome?: string;
  showVotingTopics: boolean;
};

/** The owner's private values, for editing in place. It's never sent to anyone else. */
export type ProfileOwnerForm = {
  name: string;
  username: string;
  about: string;
  ageRange: string;
  householdIncome: string;
  state: string;
  district: string;
  isPublic: boolean;
  showName: boolean;
  showAgeRange: boolean;
  showState: boolean;
  showDistrict: boolean;
  showIncome: boolean;
  showVotingTopics: boolean;
  ageOptions: { value: string; label: string }[];
  incomeOptions: { value: string; label: string }[];
};

export type ProfileView =
  | { kind: "PRIVATE"; displayName: string }
  | { kind: "PUBLIC"; profile: PublicProfile; isOwner: boolean; isPrivateToOthers: boolean };

/**
 * Builds the page's data from an allow list, so a field added to an account later stays private
 * until someone adds it here. The owner sees exactly what others see, so the page doesn't mislead.
 */
export function buildProfileView(
  account: ProfileAccount,
  settings: ProfileSettings,
  stats: ProfileStats,
  viewerId: string | null | undefined,
): ProfileView {
  const isOwner = viewerId === account.id;
  // A private page only ever uses their username, even if they'd shared their name.
  if (!settings.isPublic && !isOwner) return { kind: "PRIVATE", displayName: displayNameOf(account, false) };
  const profile: PublicProfile = {
    displayName: displayNameOf(account, settings.showName),
    username: account.username,
    image: account.image,
    status: statusLabel(account.roleName),
    memberSince: account.createdAt,
    about: settings.about?.trim() || null,
    stats,
    showVotingTopics: settings.showVotingTopics,
  };
  if (settings.showName && account.name) profile.name = account.name;
  if (settings.showAgeRange && account.ageRange) profile.ageRange = account.ageRange;
  if (settings.showState && account.state) {
    profile.state = account.state;
    // A district means nothing without its state, so it only ever shows with one.
    if (settings.showDistrict && account.district) profile.district = String(account.district);
  }
  if (settings.showIncome && account.householdIncome) profile.householdIncome = account.householdIncome;
  return { kind: "PUBLIC", profile, isOwner, isPrivateToOthers: !settings.isPublic };
}
