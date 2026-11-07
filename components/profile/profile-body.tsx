"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, Flame, Medal, MessageSquare, Pencil, Sparkles, Vote, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { OuterBlock } from "@/components/blocks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionSelect } from "@/components/ui/option-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ABOUT_MAX_LENGTH, type ProfileOwnerForm, type PublicProfile } from "@/lib/civic/profile-logic";
import { US_STATES } from "@/lib/constants/states";
import { usStateToDistrictMap } from "@/lib/constants/state-to-distict-map";
import { cn } from "@/lib/utils";
import { ClearAboutButton } from "@/app/users/[id]/clear-about-button";

const STATUS_STYLE: Record<string, string> = {
  Admin: "bg-oppose-tint",
  Moderator: "bg-xp-tint",
  Supporter: "bg-streak-tint",
  Member: "bg-primary-tint",
};

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-3 text-center" data-testid="profile-stat">
      <p className="break-words text-base font-extrabold leading-tight tabular-nums sm:text-2xl">{value}</p>
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

/** A value and whether it's shown, side by side, in the spot the value normally sits. */
function EditDetail({
  label,
  showId,
  shown,
  onShow,
  disabled,
  hint,
  children,
}: {
  label: string;
  showId: string;
  shown: boolean;
  onShow: (value: boolean) => void;
  disabled?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-testid={`edit-${showId}`}>
      <p className="text-xs font-extrabold text-muted-foreground">{label}</p>
      {children}
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={showId} className="text-xs text-muted-foreground">
          {shown ? "Shown on your profile" : "Only you can see this"}
        </Label>
        <Switch id={showId} checked={shown} disabled={disabled} onCheckedChange={onShow} data-testid={`privacy-${showId}`} />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

async function patch(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return;
  const text = await response.text();
  let message = text;
  try {
    message = JSON.parse(text).error ?? text;
  } catch {
    // Older routes send plain text, which is already the message.
  }
  throw new Error(message || "That didn't save. Please try again.");
}

/**
 * The profile's header and About. Editing happens right here: each value becomes its control in the
 * same spot, so the page doesn't change shape and there's no separate form to learn. Only the owner
 * is sent `form`, which holds the private values.
 */
export function ProfileBody({
  userId,
  profile,
  isOwner,
  isPrivateToOthers,
  isModerator,
  form,
  postCount,
  startEditing = false,
  children,
}: {
  userId: string;
  profile: PublicProfile;
  isOwner: boolean;
  isPrivateToOthers: boolean;
  isModerator: boolean;
  form: ProfileOwnerForm | null;
  postCount: number;
  startEditing?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(Boolean(form && startEditing));
  const [draft, setDraft] = useState(form);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastForm, setLastForm] = useState(form);
  // After saving, the server's values are the new starting point.
  if (form !== lastForm) {
    setLastForm(form);
    setDraft(form);
  }

  const { stats } = profile;
  const since = profile.memberSince.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const initials = profile.displayName.slice(0, 2).toUpperCase();
  const hasDetails = profile.ageRange || profile.state || profile.householdIncome;
  const set = <K extends keyof ProfileOwnerForm>(key: K, value: ProfileOwnerForm[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  const cancel = () => {
    setDraft(form);
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    if (!draft || !form) return;
    setSaving(true);
    setError(null);
    try {
      const account: Record<string, unknown> = {};
      for (const key of ["name", "username", "ageRange", "householdIncome", "state", "district"] as const) {
        if (draft[key] !== form[key]) account[key] = draft[key] === "" ? null : draft[key];
      }
      if (Object.keys(account).length > 0) await patch("/api/user/settings", account);
      await patch("/api/user/profile", {
        about: draft.about.trim() || null,
        isPublic: draft.isPublic,
        showName: draft.showName,
        showAgeRange: draft.showAgeRange,
        showState: draft.showState,
        showDistrict: draft.showDistrict,
        showIncome: draft.showIncome,
        showVotingTopics: draft.showVotingTopics,
      });
      setEditing(false);
      toast.success("Your profile is saved");
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const districts = draft?.state ? (usStateToDistrictMap as Record<string, number>)[draft.state] ?? 0 : 0;
  const open = editing && draft;

  return (
    <>
      <section className="overflow-hidden rounded-3xl border-2 border-b-8 bg-card" data-testid="profile-header" data-editing={Boolean(open)}>
        <div className="h-32 bg-linear-to-r from-primary via-xp to-streak sm:h-52" aria-hidden data-testid="profile-cover" />
        <div className="px-4 pb-2 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Avatar className="-mt-14 size-28 shrink-0 border-4 border-card sm:-mt-20 sm:size-40" data-testid="profile-avatar">
              {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
              <AvatarFallback className="bg-primary-tint text-4xl font-extrabold sm:text-5xl">{initials}</AvatarFallback>
            </Avatar>
            {isOwner && !open ? (
              <Button variant="secondary" className="mt-3" onClick={() => setEditing(true)} data-testid="profile-edit">
                <Pencil className="size-4" aria-hidden />
                Edit profile
              </Button>
            ) : null}
            {open ? (
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" disabled={saving} onClick={cancel} data-testid="profile-cancel">
                  <X className="size-4" aria-hidden />
                  Cancel
                </Button>
                <Button disabled={saving} onClick={save} data-testid="profile-save">
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            ) : null}
          </div>

          {open ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2" data-testid="profile-edit-identity">
              <EditDetail label="Your name" showId="showName" shown={draft.showName} onShow={(value) => set("showName", value)}>
                <Input aria-label="Your name" value={draft.name} maxLength={80} onChange={(event) => set("name", event.target.value)} data-testid="edit-name-input" />
              </EditDetail>
              <div className="space-y-1.5">
                <Label htmlFor="edit-username" className="text-xs font-extrabold text-muted-foreground">
                  Username
                </Label>
                <Input id="edit-username" value={draft.username} maxLength={40} onChange={(event) => set("username", event.target.value)} data-testid="edit-username-input" />
                <p className="text-xs text-muted-foreground">Always public. It&apos;s how you appear in the forum.</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              <h1 className="break-words text-3xl font-extrabold leading-tight sm:text-4xl" data-testid="profile-title">
                {profile.displayName}
              </h1>
              {profile.username && profile.username !== profile.displayName ? (
                <p className="break-words font-bold text-muted-foreground" data-testid="profile-handle">
                  @{profile.username}
                </p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className={cn("rounded-full px-3 py-0.5 text-sm font-extrabold", STATUS_STYLE[profile.status] ?? STATUS_STYLE.Member)} data-testid="profile-status">
              {profile.status}
            </span>
            <span className="text-sm font-bold text-muted-foreground">Joined {since}</span>
          </div>

          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-oppose-tint p-2.5 text-sm font-bold" data-testid="profile-edit-error">
              {error}
            </p>
          ) : null}
          {isOwner && !open ? (
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
            <Stat icon={MessageSquare} label="Posts" value={postCount.toLocaleString()} />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <OuterBlock className="space-y-4 lg:sticky lg:top-6" data-testid="profile-about-card">
          <h2 className="text-lg font-extrabold">About</h2>
          {open ? (
            <div className="space-y-5" data-testid="profile-edit-about">
              <div className="space-y-1">
                <Textarea
                  aria-label="About me"
                  value={draft.about}
                  maxLength={ABOUT_MAX_LENGTH}
                  onChange={(event) => set("about", event.target.value)}
                  placeholder="What do you care about?"
                  data-testid="profile-about-input"
                />
                <p className="text-right text-xs font-bold tabular-nums text-muted-foreground">
                  {draft.about.length}/{ABOUT_MAX_LENGTH}
                </p>
              </div>
              <EditDetail label="Age range" showId="showAgeRange" shown={draft.showAgeRange} onShow={(value) => set("showAgeRange", value)}>
                <OptionSelect aria-label="Age range" value={draft.ageRange} onValueChange={(value) => set("ageRange", value)} options={form?.ageOptions ?? []} placeholder="Not set" />
              </EditDetail>
              <EditDetail label="State" showId="showState" shown={draft.showState} onShow={(value) => set("showState", value)}>
                <OptionSelect
                  aria-label="State"
                  value={draft.state}
                  onValueChange={(value) => setDraft((current) => (current ? { ...current, state: value, district: "" } : current))}
                  options={[{ value: "", label: "Not set" }, ...(US_STATES as string[]).map((state) => ({ value: state, label: state }))]}
                  placeholder="Not set"
                />
              </EditDetail>
              <EditDetail
                label="District"
                showId="showDistrict"
                shown={draft.showDistrict}
                onShow={(value) => set("showDistrict", value)}
                disabled={!draft.showState}
                hint={draft.showState ? undefined : "Turn on your state first. A district means nothing without it."}
              >
                <OptionSelect
                  aria-label="District"
                  value={draft.district}
                  disabled={districts === 0}
                  onValueChange={(value) => set("district", value)}
                  options={[{ value: "", label: "Not set" }, ...Array.from({ length: districts }, (_, index) => ({ value: String(index + 1), label: `District ${index + 1}` }))]}
                  placeholder={draft.state ? "Not set" : "Choose a state first"}
                />
              </EditDetail>
              <EditDetail label="Household income" showId="showIncome" shown={draft.showIncome} onShow={(value) => set("showIncome", value)}>
                <OptionSelect aria-label="Household income" value={draft.householdIncome} onValueChange={(value) => set("householdIncome", value)} options={form?.incomeOptions ?? []} placeholder="Not set" />
              </EditDetail>
              <div className="flex items-start justify-between gap-3 border-t-2 pt-4">
                <div className="min-w-0">
                  <Label htmlFor="showVotingTopics">Show how I vote, by topic</Label>
                  <p className="mt-1 text-xs text-muted-foreground">How many bills you supported and opposed on each topic. Never which bills.</p>
                </div>
                <Switch id="showVotingTopics" checked={draft.showVotingTopics} onCheckedChange={(value) => set("showVotingTopics", value)} data-testid="privacy-showVotingTopics" />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Label htmlFor="isPublic">Show my profile to others</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Off means people only see that it&apos;s private.</p>
                </div>
                <Switch id="isPublic" checked={draft.isPublic} onCheckedChange={(value) => set("isPublic", value)} data-testid="profile-public-switch" />
              </div>
            </div>
          ) : (
            <>
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
              {isModerator && !isOwner && profile.about ? <ClearAboutButton userId={userId} /> : null}
              {!isOwner && profile.about ? (
                <p className="text-xs text-muted-foreground">
                  See something that shouldn&apos;t be here?{" "}
                  <Link href="/feedback" className="font-bold text-primary hover:underline">
                    Report it
                  </Link>
                  .
                </p>
              ) : null}
            </>
          )}
        </OuterBlock>
        {children}
      </div>
    </>
  );
}
