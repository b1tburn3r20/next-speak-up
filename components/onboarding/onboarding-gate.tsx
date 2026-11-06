"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { billLabel, partyLabel } from "@/lib/civic/labels";
import { LocationPicker, type ResolvedLocation } from "./location-picker";

type Rep = { id: number; name: string; party: string | null; role: string; seat: string };
type SuggestedBill = { slug: string; title: string; billType: string; number: number };

export function OnboardingGate() {
  const { data: session, update } = useSession();
  const [dismissed, setDismissed] = useState(false);
  // Null until the user moves on. The session often loads after the first render, so the first
  // step is worked out from it each time instead of being stored.
  const [chosenStep, setStep] = useState<"location" | "reps" | "vote" | null>(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [reps, setReps] = useState<Rep[]>([]);
  const [bills, setBills] = useState<SuggestedBill[]>([]);
  const [loadError, setLoadError] = useState(false);

  const needsOnboarding = Boolean(session?.user?.needsOnboarding);

  const hasSavedState = Boolean(session?.user?.state);
  const hasUsername = Boolean(session?.user?.username);

  const loadReps = useCallback(async (query: string) => {
    setLoadError(false);
    try {
      const response = await fetch(`/api/civic/reps${query}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setReps(data.reps);
      setBills(data.suggestedBills);
    } catch {
      setLoadError(true);
    }
  }, []);

  const [skippedUsername, setSkippedUsername] = useState(false);
  const afterUsername = hasSavedState ? "reps" : "location";
  // Google accounts start without a username, and that comes first if it's needed.
  const step = chosenStep ?? (hasUsername || skippedUsername ? afterUsername : "username");

  // Someone who already has a location only needs the remaining steps.
  useEffect(() => {
    if (needsOnboarding && hasSavedState) loadReps("");
  }, [needsOnboarding, hasSavedState, loadReps]);

  const complete = async () => {
    setDismissed(true);
    // Skipping must always work, even if this save fails. They'd just see it again next visit.
    await fetch("/api/civic/onboarding/complete", { method: "POST" }).catch(() => undefined);
    await update().catch(() => undefined);
  };

  const saveUsername = async (event: React.FormEvent) => {
    event.preventDefault();
    setUsernameError(null);
    try {
      const response = await fetch("/api/user/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setUsernameError(data?.error ?? "That username didn't work. Please try another.");
        return;
      }
      await update().catch(() => undefined);
      setStep(afterUsername);
    } catch {
      setUsernameError("That didn't save. Please try again.");
    }
  };

  const onResolved = async (location: ResolvedLocation) => {
    setStep("reps");
    await loadReps(`?state=${location.regionCode}&district=${location.districtCode}`);
  };

  if (!needsOnboarding || dismissed) return null;

  return (
    <Dialog open onOpenChange={(open) => (!open ? complete() : undefined)}>
      <DialogContent data-testid="onboarding" className="max-h-[90dvh] overflow-y-auto">
        {step === "username" ? (
          <>
            <DialogHeader>
              <DialogTitle>Pick a username</DialogTitle>
              <DialogDescription>This is how you&apos;ll appear in the forum.</DialogDescription>
            </DialogHeader>
            <form className="space-y-2 font-normal" onSubmit={saveUsername}>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={30}
                aria-label="Username"
                data-testid="onboarding-username"
              />
              {usernameError ? (
                <p role="alert" className="text-sm text-destructive">
                  {usernameError}
                </p>
              ) : null}
              <Button type="submit" disabled={!username.trim()} data-testid="onboarding-username-save">
                Continue
              </Button>
            </form>
            <button
              type="button"
              className="w-fit text-sm underline"
              onClick={() => setSkippedUsername(true)}
              data-testid="onboarding-username-later"
            >
              Choose one later
            </button>
          </>
        ) : null}

        {step === "location" ? (
          <>
            <DialogHeader>
              <DialogTitle>Find your representatives</DialogTitle>
              <DialogDescription>
                See who represents you, and how often you agree with them.
              </DialogDescription>
            </DialogHeader>
            <LocationPicker onResolved={onResolved} />
          </>
        ) : null}

        {step === "reps" ? (
          <>
            <DialogHeader>
              <DialogTitle>Your representatives</DialogTitle>
              <DialogDescription>These are the people who vote on your behalf.</DialogDescription>
            </DialogHeader>
            {loadError ? (
              <p role="alert" className="text-sm text-destructive">
                We saved your location, but couldn&apos;t load your representatives right now.
                They&apos;ll be on your dashboard.
              </p>
            ) : (
              <ul className="space-y-2 font-normal" data-testid="onboarding-reps">
                {reps.map((rep) => (
                  <li key={rep.id} className="rounded-md border p-2">
                    <p className="font-medium">{rep.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {rep.role}, {rep.seat} · {partyLabel(rep.party)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={() => setStep("vote")} data-testid="onboarding-next">
              Next
            </Button>
          </>
        ) : null}

        {step === "vote" ? (
          <>
            <DialogHeader>
              <DialogTitle>Weigh in on a bill</DialogTitle>
              <DialogDescription>
                Each bill you vote on shows how closely your reps match you.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 font-normal">
              {bills.map((bill) => (
                <li key={bill.slug}>
                  <Link
                    href={`/bills/${bill.slug}`}
                    onClick={complete}
                    className="block rounded-md border p-2 text-sm hover:bg-accent/40"
                  >
                    <span className="font-medium">{billLabel(bill.billType, bill.number)}</span>{" "}
                    <span className="line-clamp-2">{bill.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Button onClick={complete} data-testid="onboarding-finish">
              Go to my dashboard
            </Button>
          </>
        ) : null}

        {step !== "vote" ? (
          <button
            type="button"
            className="text-sm underline"
            onClick={complete}
            data-testid="onboarding-skip"
          >
            Skip for now
          </button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
