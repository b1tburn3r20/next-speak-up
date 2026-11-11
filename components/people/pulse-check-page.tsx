import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginButton } from "@/components/app/login-button";
import { OuterBlock, PageSpacer, Stack } from "@/components/blocks";
import { BlindVoteCard } from "@/components/civic/blind-vote-card";
import { PulseCheckFinish } from "@/components/civic/pulse-check-finish";
import { VoteSession } from "@/components/civic/vote-session";
import { MemberPhoto } from "@/components/people/member-photo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPulseCheckItems } from "@/lib/civic/engage";
import { type PulseSize } from "@/lib/civic/pulse-check";

export type PulseMember = { id: number; fullName: string; imageUrl: string | null; party: string | null };

/** Where a pulse check of a given size is, for the member at `pulseHref`. */
export function pulseCheckHref(pulseHref: string, size: PulseSize): string {
  return `${pulseHref}?count=${size}`;
}

/**
 * A pulse check on one member: a quick run of bills they've voted on and you haven't, earliest first,
 * then how you lined up on just those. Federal and state members share it.
 */
export async function PulseCheckPage({
  member,
  memberHref,
  pulseHref,
  size,
  userId,
}: {
  member: PulseMember;
  memberHref: string;
  pulseHref: string;
  size: PulseSize;
  userId: string | null;
}) {
  const firstName = member.fullName.split(" ")[0];
  const items = userId ? await getPulseCheckItems(userId, member.id, size) : [];
  const slugs = items.map((item) => item.bill.slug);

  return (
    <PageSpacer width="narrow">
      <Stack gap="lg">
        <header className="flex items-center gap-3">
          <MemberPhoto name={member.fullName} url={member.imageUrl} party={member.party} size={56} />
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-extrabold leading-tight">Pulse check: {member.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {items.length > 0
                ? `${items.length} bill${items.length === 1 ? "" : "s"} ${firstName} voted on, starting with the earliest you haven't. Vote on each, then see how you line up.`
                : `Bills ${firstName} voted on, one at a time, then how you line up.`}
            </p>
          </div>
        </header>

        {!userId ? (
          <OuterBlock className="space-y-3 text-center" data-testid="pulse-sign-in">
            <p className="text-lg font-extrabold">Log in to do a pulse check</p>
            <p className="text-muted-foreground">We keep your votes, so we can show how they compare with {firstName}&apos;s.</p>
            <LoginButton />
          </OuterBlock>
        ) : items.length === 0 ? (
          <OuterBlock className="space-y-3 text-center" data-testid="pulse-empty">
            <p className="text-lg font-extrabold">You&apos;ve voted on every bill {firstName} has</p>
            <p className="text-muted-foreground">Their page has your full match with them.</p>
            <Link href={memberHref} className={buttonVariants({ size: "lg" })}>
              See how you match
            </Link>
          </OuterBlock>
        ) : (
          <VoteSession
            signedIn
            exitHref={memberHref}
            slugs={slugs}
            reasons={items.map(() => `${firstName} voted on this`)}
            cards={items.map((item) => (
              <BlindVoteCard key={item.bill.id} item={item} signedIn />
            ))}
            finish={
              <PulseCheckFinish
                personId={member.id}
                firstName={firstName}
                slugs={slugs}
                memberHref={memberHref}
                againHref={pulseCheckHref(pulseHref, size)}
              />
            }
          />
        )}

        <Link href={memberHref} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden />
          Back to {member.fullName}
        </Link>
      </Stack>
    </PageSpacer>
  );
}

// The middle size is the one most people want, so it's the primary outline. The other two are the quieter accent.
const PULSE_CHOICES: { size: PulseSize; name: string; variant: "primary_outline" | "accent" }[] = [
  { size: 3, name: "Quick", variant: "accent" },
  { size: 5, name: "Standard", variant: "primary_outline" },
  { size: 10, name: "Deep", variant: "accent" },
];

/**
 * The way in: pick how many of their bills. `embedded` sits inside "Do they represent you?", where the
 * question is already asked. On its own, it brings its own card and heading.
 */
export function PulseCheckStart({ pulseHref, firstName, embedded = false }: { pulseHref: string; firstName: string; embedded?: boolean }) {
  const choices = (
    <div className="grid grid-cols-3 gap-2">
      {PULSE_CHOICES.map(({ size, name, variant }) => (
        <Link
          key={size}
          href={pulseCheckHref(pulseHref, size)}
          className={cn(buttonVariants({ variant }), "h-auto flex-col gap-0 px-2 py-2")}
          data-testid={`pulse-check-${size}`}
        >
          <span className="text-lg font-extrabold tabular-nums leading-tight">{size} bills</span>
          <span className="text-xs font-bold opacity-80">{name}</span>
        </Link>
      ))}
    </div>
  );
  if (embedded) {
    return (
      <div className="space-y-2 border-t-2 pt-3" data-testid="pulse-check-start">
        <p className="text-sm font-extrabold">
          Pulse check <span className="font-semibold text-muted-foreground">· vote on a few of {firstName}&apos;s bills, then see how you line up</span>
        </p>
        {choices}
      </div>
    );
  }
  return (
    <OuterBlock className="space-y-3" data-testid="pulse-check-start">
      <div>
        <h2 className="text-lg font-extrabold">Do they represent you?</h2>
        <p className="text-sm text-muted-foreground">
          Pulse check: vote on a few bills {firstName} has voted on, one after another, then see how you line up.
        </p>
      </div>
      {choices}
    </OuterBlock>
  );
}
