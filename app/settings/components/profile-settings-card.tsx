"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { OuterBlock } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ABOUT_MAX_LENGTH, PRIVACY_OPTIONS, type PrivacyKey, type ProfileSettings } from "@/lib/civic/profile-logic";
import { profilePath } from "@/lib/routes";

async function save(changes: Partial<ProfileSettings>) {
  const response = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!response.ok) throw new Error("That didn't save. Please try again.");
}

/** What your public page says, and what it leaves out. Each switch saves right away. */
export function ProfileSettingsCard({ initial, userId, hasUsername }: { initial: ProfileSettings; userId: string; hasUsername: boolean }) {
  const [settings, setSettings] = useState(initial);
  const [about, setAbout] = useState(initial.about ?? "");
  const [savingAbout, setSavingAbout] = useState(false);

  const toggle = async (key: PrivacyKey | "isPublic", value: boolean) => {
    const previous = settings;
    setSettings({ ...settings, [key]: value });
    try {
      await save({ [key]: value });
    } catch (error) {
      setSettings(previous);
      toast.error((error as Error).message);
    }
  };

  const saveAbout = async () => {
    setSavingAbout(true);
    try {
      await save({ about });
      setSettings({ ...settings, about: about.trim() || null });
      toast.success("Saved");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSavingAbout(false);
    }
  };

  return (
    <OuterBlock className="scroll-mt-4 space-y-5" id="profile" data-testid="profile-settings">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold">Your public profile</h2>
        <Link href={profilePath(userId)} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline" data-testid="profile-view">
          See it
          <ExternalLink className="size-4" aria-hidden />
        </Link>
      </div>
      {!hasUsername ? (
        <p className="rounded-xl bg-streak-tint p-3 text-sm font-bold" data-testid="profile-needs-username">
          You don&apos;t have a username yet, so your profile says &quot;Coolbills member&quot;. Choose one above.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="profile-about">About me</Label>
        <Textarea
          id="profile-about"
          value={about}
          maxLength={ABOUT_MAX_LENGTH}
          onChange={(event) => setAbout(event.target.value)}
          placeholder="What do you care about?"
          data-testid="profile-about-input"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tabular-nums text-muted-foreground">
            {about.length}/{ABOUT_MAX_LENGTH}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={savingAbout || about === (settings.about ?? "")}
            onClick={saveAbout}
            data-testid="profile-about-save"
          >
            {savingAbout ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl bg-muted p-3">
        <div className="min-w-0">
          <Label htmlFor="profile-public">Show my profile to others</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Off means people see only that it&apos;s private. Your username still shows on forum posts and on the leaderboard if you&apos;ve joined.
          </p>
        </div>
        <Switch
          id="profile-public"
          checked={settings.isPublic}
          onCheckedChange={(value) => toggle("isPublic", value)}
          data-testid="profile-public-switch"
        />
      </div>

      <fieldset className="space-y-3" disabled={!settings.isPublic}>
        <legend className="mb-2 text-sm font-bold">
          Share on my profile. These all start off, and your email is never shown.
        </legend>
        {PRIVACY_OPTIONS.map(({ key, label, description }) => {
          const needsState = key === "showDistrict" && !settings.showState;
          return (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor={`profile-${key}`}>{label}</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {needsState ? "Turn on your state first. A district means nothing without it." : description}
                </p>
              </div>
              <Switch
                id={`profile-${key}`}
                checked={settings[key]}
                disabled={!settings.isPublic || needsState}
                onCheckedChange={(value) => toggle(key, value)}
                data-testid={`privacy-${key}`}
              />
            </div>
          );
        })}
      </fieldset>
    </OuterBlock>
  );
}
