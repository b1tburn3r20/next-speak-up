import { describe, expect, it } from "vitest";
import {
  buildProfileView,
  DEFAULT_PROFILE_SETTINGS,
  PRIVACY_OPTIONS,
  statusLabel,
  type ProfileAccount,
  type ProfileStats,
} from "@/lib/civic/profile-logic";

const ACCOUNT: ProfileAccount = {
  id: "owner",
  username: "pat",
  name: "Pat Secretname",
  image: "https://example.test/pat.png",
  createdAt: new Date("2026-01-02T00:00:00Z"),
  roleName: "Member",
  ageRange: "FROM_25_TO_34",
  householdIncome: "UNDER_25000",
  state: "Iowa",
  district: 3,
};

const STATS: ProfileStats = {
  rankName: "Listener",
  level: 1,
  xp: 50,
  streak: 2,
  votesCast: 3,
  badgesEarned: 1,
  badgesTotal: 8,
};

const view = (settings = {}, viewer: string | null = "someone-else") =>
  buildProfileView(ACCOUNT, { ...DEFAULT_PROFILE_SETTINGS, ...settings }, STATS, viewer);

const publicProfile = (settings = {}, viewer: string | null = "someone-else") => {
  const result = view(settings, viewer);
  if (result.kind !== "PUBLIC") throw new Error("expected a public profile");
  return result.profile;
};

describe("buildProfileView", () => {
  it("shows nothing personal by default", () => {
    const json = JSON.stringify(publicProfile());
    for (const secret of ["Secretname", "FROM_25_TO_34", "UNDER_25000", "Iowa", '"district"']) {
      expect(json).not.toContain(secret);
    }
  });

  it("shows the username, picture, status, and stats by default", () => {
    expect(publicProfile()).toMatchObject({
      username: "pat",
      image: ACCOUNT.image,
      status: "Member",
      stats: STATS,
      showVotingTopics: false,
    });
  });

  it.each([
    ["showName", "name", "Pat Secretname"],
    ["showAgeRange", "ageRange", "FROM_25_TO_34"],
    ["showState", "state", "Iowa"],
    ["showIncome", "householdIncome", "UNDER_25000"],
  ])("%s shares only that one field", (setting, field, value) => {
    const profile = publicProfile({ [setting]: true }) as unknown as Record<string, unknown>;
    expect(profile[field]).toBe(value);
    const others = ["name", "ageRange", "state", "district", "householdIncome"].filter((key) => key !== field);
    for (const other of others) expect(profile[other]).toBeUndefined();
  });

  it("never shows a district without its state", () => {
    expect(publicProfile({ showDistrict: true }).district).toBeUndefined();
    expect(publicProfile({ showDistrict: true, showState: true }).district).toBe("3");
  });

  it("never includes the account's other fields, like an email", () => {
    const withExtras = { ...ACCOUNT, email: "pat@example.test", id: "owner" } as ProfileAccount;
    const result = buildProfileView(withExtras, { ...DEFAULT_PROFILE_SETTINGS, showName: true }, STATS, "x");
    expect(JSON.stringify(result)).not.toContain("pat@example.test");
    expect(JSON.stringify(result)).not.toContain("owner");
  });

  it("a shared field with no value just isn't there", () => {
    const empty = { ...ACCOUNT, state: null, name: null };
    const result = buildProfileView(empty, { ...DEFAULT_PROFILE_SETTINGS, showState: true, showName: true }, STATS, "x");
    expect(result.kind === "PUBLIC" && result.profile.state).toBeUndefined();
    expect(result.kind === "PUBLIC" && result.profile.name).toBeUndefined();
  });

  it("keeps an empty about me empty", () => {
    expect(publicProfile({ about: "   " }).about).toBeNull();
    expect(publicProfile({ about: " Hi there " }).about).toBe("Hi there");
  });

  it("a private profile shows others nothing but that it's private", () => {
    const result = view({ isPublic: false, showName: true, about: "hello" });
    expect(result).toEqual({ kind: "PRIVATE", displayName: "pat" });
    expect(view({ isPublic: false }, null)).toEqual({ kind: "PRIVATE", displayName: "pat" });
  });

  it("a private profile still opens for its owner, who's told it's private", () => {
    const result = view({ isPublic: false }, "owner");
    expect(result).toMatchObject({ kind: "PUBLIC", isOwner: true, isPrivateToOthers: true });
  });

  it("the owner sees only what others see, so the preview can't mislead", () => {
    expect(publicProfile({}, "owner")).toEqual(publicProfile({}, "someone-else"));
  });
});

describe("what someone is called", () => {
  it("uses their username unless they've shared their name", () => {
    expect(publicProfile().displayName).toBe("pat");
    expect(publicProfile({ showName: true }).displayName).toBe("Pat Secretname");
  });

  it("someone with no username still has a page, without showing their name", () => {
    const noUsername = { ...ACCOUNT, username: null };
    const result = buildProfileView(noUsername, DEFAULT_PROFILE_SETTINGS, STATS, "x");
    expect(result.kind === "PUBLIC" && result.profile.displayName).toBe("Coolbills member");
    expect(JSON.stringify(result)).not.toContain("Secretname");
  });

  it("a private page never uses their name, even if they'd shared it", () => {
    expect(view({ isPublic: false, showName: true })).toEqual({ kind: "PRIVATE", displayName: "pat" });
  });
});

describe("statusLabel", () => {
  it("shows both kinds of admin the same", () => {
    expect(statusLabel("Super Admin")).toBe("Admin");
    expect(statusLabel("Admin")).toBe("Admin");
  });

  it("names the others, and treats an unknown role as a member", () => {
    expect(statusLabel("Moderator")).toBe("Moderator");
    expect(statusLabel("Supporter")).toBe("Supporter");
    expect(statusLabel("Member")).toBe("Member");
    expect(statusLabel(null)).toBe("Member");
    expect(statusLabel("Something Internal")).toBe("Member");
  });
});

describe("privacy defaults", () => {
  it("every personal option starts off", () => {
    for (const { key } of PRIVACY_OPTIONS) expect(DEFAULT_PROFILE_SETTINGS[key]).toBe(false);
  });
});
